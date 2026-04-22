import { isAuthDisabled } from "@/lib/auth-mode";
import { isAdmin } from "@/lib/auth/isAdmin";
import { requireAdminWithMfa } from "@/lib/auth/require-admin-mfa";
import { logger } from "@/lib/logger";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export type HistoryViewer = { role: "admin" | "user" };

export type HistoryRow = {
  id: string;
  user_id: string;
  created_at: string;
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
  direction: number;
  capacity: number;
  archetype: string;
};

export type HistoryPagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
};

const ROW_COLUMNS =
  "id, user_id, created_at, mentalidade, engajamento, cultura, performance, direction, capacity, archetype" as const;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 200;
/** Hard cap on rows returned for a single non-admin user (prevents unbounded responses). */
const USER_HISTORY_HARD_CAP = 500;

function devAnonymousUserId(): string | null {
  const id = process.env.DEV_ANONYMOUS_USER_ID?.trim();
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return id;
}

/** Avoid RangeError from `Invalid Date` when PostgREST returns unexpected null/shape. */
function safeIsoTimestamp(value: unknown): string {
  if (value == null || value === "") {
    return new Date(0).toISOString();
  }
  const t = new Date(value as string).getTime();
  if (Number.isNaN(t)) {
    return new Date(0).toISOString();
  }
  return new Date(t).toISOString();
}

function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeRows(rows: Record<string, unknown>[]): HistoryRow[] {
  return rows.map((r) => ({
    id: String(r.id ?? ""),
    user_id: String(r.user_id ?? ""),
    created_at: safeIsoTimestamp(r.created_at),
    mentalidade: safeNumber(r.mentalidade),
    engajamento: safeNumber(r.engajamento),
    cultura: safeNumber(r.cultura),
    performance: safeNumber(r.performance),
    direction: safeNumber(r.direction),
    capacity: safeNumber(r.capacity),
    archetype: String(r.archetype ?? ""),
  }));
}

function parseAdminPagination(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const rawPage = parseInt(searchParams.get("page") ?? String(DEFAULT_PAGE), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE;
  const rawSize = parseInt(
    searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE),
    10,
  );
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.isFinite(rawSize) ? rawSize : DEFAULT_PAGE_SIZE),
  );
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

async function queryRowsForUser(
  client: SupabaseClient,
  userId: string,
): Promise<{ rows?: HistoryRow[]; error?: string }> {
  const { data, error } = await client
    .from("responses")
    .select(ROW_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(USER_HISTORY_HARD_CAP);
  if (error) return { error: error.message };
  return { rows: normalizeRows((data ?? []) as Record<string, unknown>[]) };
}

/**
 * Paginated global list (admin). Uses exact count — one query with range.
 */
async function queryRowsAdminPage(
  client: SupabaseClient,
  pageSize: number,
  offset: number,
): Promise<{
  rows?: HistoryRow[];
  error?: string;
  totalCount: number;
  hasMore: boolean;
}> {
  const { data, error, count } = await client
    .from("responses")
    .select(ROW_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) return { error: error.message, totalCount: 0, hasMore: false };

  const totalCount = count ?? 0;
  const rows = normalizeRows((data ?? []) as Record<string, unknown>[]);
  const hasMore = offset + rows.length < totalCount;

  return { rows, totalCount, hasMore };
}

/**
 * `createServiceRoleClient` throws if e.g. NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is set (must never be public).
 */
function getServiceRoleClientOrNull(): SupabaseClient | null {
  try {
    return createServiceRoleClient();
  } catch (err) {
    logger.error("[api/user/history] service role client", err);
    return null;
  }
}

/**
 * Diagnostic history: own rows for normal users; paginated global rows for master admin (service role + AAL2).
 * Email is taken exclusively from the Supabase session — never from the client.
 */
export async function GET(request: NextRequest) {
  try {
    let supabase: SupabaseClient;
    try {
      supabase = await createClient();
    } catch (err) {
      logger.error("[api/user/history] Supabase server client", err);
      return NextResponse.json(
        { ok: false, error: "supabase_env_missing" },
        { status: 503 },
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isAuthDisabled()) {
      const service = getServiceRoleClientOrNull();
      const devId = devAnonymousUserId();
      if (!service || !devId) {
        return NextResponse.json({
          ok: true,
          viewer: { role: "user" } satisfies HistoryViewer,
          rows: [],
          offline: true,
        });
      }

      const result = await queryRowsForUser(service, devId);
      if (result.error) {
        return NextResponse.json(
          { ok: false, error: result.error },
          { status: 500 },
        );
      }

      return NextResponse.json({
        ok: true,
        viewer: { role: "user" } satisfies HistoryViewer,
        rows: result.rows,
      });
    }

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    if (isAdmin(user.email)) {
      const guard = await requireAdminWithMfa(supabase);
      if (!guard.ok) return guard.response;

      const service = getServiceRoleClientOrNull();
      if (!service) {
        return NextResponse.json(
          {
            ok: false,
            error: "admin_requires_service_role",
            detail:
              "Set SUPABASE_SERVICE_ROLE_KEY on the server to enable cross-tenant history.",
          },
          { status: 503 },
        );
      }

      const { page, pageSize, offset } = parseAdminPagination(
        request.nextUrl.searchParams,
      );

      const result = await queryRowsAdminPage(service, pageSize, offset);
      if (result.error) {
        return NextResponse.json(
          { ok: false, error: result.error },
          { status: 500 },
        );
      }

      const pagination: HistoryPagination = {
        page,
        pageSize,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
      };

      return NextResponse.json({
        ok: true,
        viewer: { role: "admin" } satisfies HistoryViewer,
        rows: result.rows,
        pagination,
      });
    }

    const result = await queryRowsForUser(supabase, user.id);
    if (result.error) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      viewer: { role: "user" } satisfies HistoryViewer,
      rows: result.rows,
    });
  } catch (err) {
    logger.error("[api/user/history] GET uncaught", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
