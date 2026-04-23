import { isAuthDisabled } from "@/lib/auth-mode";
import { jsonRateLimitOrNull } from "@/lib/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Onboarding profile save.
 *
 * - `name` (mapeado para `profiles.full_name`) é o único campo obrigatório.
 * - `profession` e `phone` são opcionais (strings curtas, livres).
 * - Upsert no próprio registo em `public.profiles` (RLS: `id = auth.uid()`).
 *
 * Usado pela tela /onboarding antes do primeiro diagnóstico.
 */

const bodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o seu nome.")
    .max(120, "Nome demasiado longo."),
  profession: z
    .string()
    .trim()
    .max(120, "Profissão demasiado longa.")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(40, "Telefone demasiado longo.")
    .optional()
    .or(z.literal("")),
});

function nullIfEmpty(v: string | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

export async function POST(request: Request) {
  if (isAuthDisabled()) {
    const limited = await jsonRateLimitOrNull(request, "api/user/profile");
    if (limited) return limited;
    return NextResponse.json({ ok: true, dev: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const limited = await jsonRateLimitOrNull(request, "api/user/profile", {
    userId: user?.id ?? null,
  });
  if (limited) return limited;

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "validation",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { name, profession, phone } = parsed.data;

  // Prefer service-role write (server-only) to avoid RLS drift between
  // environments; we still scope the write to the authenticated `user.id`.
  const service = createServiceRoleClient();
  const writer = service ?? supabase;

  const basePayload = {
    id: user.id,
    full_name: name.trim(),
  };
  const fullPayload = {
    ...basePayload,
    profession: nullIfEmpty(profession),
    phone: nullIfEmpty(phone),
  };

  let { error } = await writer.from("profiles").upsert(fullPayload);

  // Backward compatibility: some environments may not yet have onboarding
  // columns (`profession` / `phone`). Retry with the minimum schema.
  if (
    error &&
    /column .* (profession|phone) .* does not exist|schema cache/i.test(
      error.message,
    )
  ) {
    ({ error } = await writer.from("profiles").upsert(basePayload));
  }

  if (error) {
    // Last-resort fallback: persist onboarding fields on auth metadata so the
    // user can still progress even if `public.profiles` is misconfigured.
    if (service) {
      const { error: metaError } = await service.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...(user.user_metadata ?? {}),
            full_name: name.trim(),
            profession: nullIfEmpty(profession),
            phone: nullIfEmpty(phone),
          },
        },
      );
      if (!metaError) {
        console.warn("[onboarding] profiles write failed; saved metadata fallback", {
          userId: user.id,
          detail: error.message,
        });
        return NextResponse.json({ ok: true, fallback: "auth_metadata" });
      }
    }
    console.error("[onboarding] failed to persist profile", {
      userId: user.id,
      detail: error.message,
    });
    return NextResponse.json(
      { ok: false, error: "db_error", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
