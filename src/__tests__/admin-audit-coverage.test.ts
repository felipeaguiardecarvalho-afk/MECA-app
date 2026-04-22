/**
 * Static regression: every privileged admin route must emit an audit event.
 *
 * Mocking each route end-to-end (puppeteer for PDF, full Supabase auth for
 * unlock/overview) is disproportionately expensive for a single invariant.
 * Instead, we read the source of every admin route handler and assert that
 * (a) it imports `logAdminAction` from `@/lib/admin-audit-log`, and
 * (b) it calls `logAdminAction(` at least once.
 *
 * If you add a new file under `src/app/api/admin/**` you must either:
 *   - audit-log it (preferred), or
 *   - add it to `EXEMPT_ROUTES` below with a comment explaining why.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ADMIN_API_DIR = path.resolve(
  __dirname,
  "..",
  "app",
  "api",
  "admin",
);

const REPORT_GENERATE = path.resolve(
  __dirname,
  "..",
  "app",
  "api",
  "report",
  "generate",
  "route.ts",
);

/**
 * Routes that are intentionally read-only and have no admin-side effect worth
 * auditing (today, none — every admin endpoint mutates or exfiltrates user
 * data). Add entries with a justification comment if needed.
 */
const EXEMPT_ROUTES = new Set<string>([
  // e.g. "src/app/api/admin/health/route.ts" — pure liveness probe
]);

function listRouteFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...listRouteFiles(full));
    } else if (entry === "route.ts" || entry === "route.tsx") {
      out.push(full);
    }
  }
  return out;
}

function readRoute(file: string): string {
  return readFileSync(file, "utf8");
}

describe("admin audit coverage", () => {
  const adminRoutes = listRouteFiles(ADMIN_API_DIR);

  it("finds at least one admin route to audit (sanity check)", () => {
    expect(adminRoutes.length).toBeGreaterThan(0);
  });

  for (const file of adminRoutes) {
    const rel = path.relative(path.resolve(__dirname, "..", ".."), file);
    const exempt = EXEMPT_ROUTES.has(rel.replace(/\\/g, "/"));
    if (exempt) continue;

    it(`${rel} calls logAdminAction`, () => {
      const src = readRoute(file);
      expect(src).toMatch(/from\s+["']@\/lib\/admin-audit-log["']/);
      expect(src).toMatch(/\blogAdminAction\s*\(/);
    });
  }

  it("report/generate (PDF export) calls logAdminAction", () => {
    // Not under /api/admin but is privileged: it allows the master admin to
    // export any user's diagnostic as a PDF, which is at least as sensitive
    // as anything in /api/admin/*.
    const src = readRoute(REPORT_GENERATE);
    expect(src).toMatch(/from\s+["']@\/lib\/admin-audit-log["']/);
    expect(src).toMatch(/\blogAdminAction\s*\(/);
  });
});
