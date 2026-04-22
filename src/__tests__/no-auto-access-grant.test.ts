import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Regression guard: no resurrect of silent auto-grant RPCs / bootstrap routes.
 * (O produto permite conta por e-mail sem código de organização; isto não
 * reintroduz `ensure_email_access_grant` nem `bootstrap-email-grant`.)
 */

const repoRoot = path.resolve(__dirname, "..", "..");

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readIfExists(p: string): Promise<string | null> {
  try {
    return await fs.readFile(p, "utf8");
  } catch {
    return null;
  }
}

describe("no-auto-access-grant policy", () => {
  it("does not ship the bootstrap-email-grant route", async () => {
    const legacyRoute = path.join(
      repoRoot,
      "src",
      "app",
      "api",
      "auth",
      "bootstrap-email-grant",
      "route.ts",
    );
    expect(await exists(legacyRoute)).toBe(false);
  });

  it("does not ship the ensure-email-access helper", async () => {
    const helper = path.join(
      repoRoot,
      "src",
      "lib",
      "auth",
      "ensure-email-access.ts",
    );
    expect(await exists(helper)).toBe(false);
  });

  it("middleware never calls an auto-grant helper", async () => {
    const mw = await readIfExists(path.join(repoRoot, "src", "middleware.ts"));
    expect(mw).not.toBeNull();
    expect(mw).not.toMatch(/ensureEmailAccessGrantIfNeeded/);
    expect(mw).not.toMatch(/ensure_email_access_grant/);
    expect(mw).not.toMatch(/bootstrap-email-grant/);
  });

  it("access-state route never calls an auto-grant helper", async () => {
    const route = await readIfExists(
      path.join(
        repoRoot,
        "src",
        "app",
        "api",
        "user",
        "access-state",
        "route.ts",
      ),
    );
    expect(route).not.toBeNull();
    expect(route).not.toMatch(/ensureEmailAccessGrantIfNeeded/);
    expect(route).not.toMatch(/ensure_email_access_grant/);
  });

  it("access-code page never calls the bootstrap endpoint", async () => {
    const pageFile = await readIfExists(
      path.join(repoRoot, "src", "app", "access-code", "page.tsx"),
    );
    expect(pageFile).not.toBeNull();
    expect(pageFile).not.toMatch(/bootstrap-email-grant/);
    expect(pageFile).not.toMatch(/ensure_email_access_grant/);
  });

  it("no source file imports the removed helper", async () => {
    const { execSync } = await import("node:child_process");
    const cmd =
      // Ripgrep is pre-installed in the workspace; `-l` yields only filenames.
      // If any file matches, this test fails.
      'rg -l --no-ignore-vcs "ensureEmailAccessGrantIfNeeded|bootstrap-email-grant" src';
    let output = "";
    try {
      output = execSync(cmd, {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch (err) {
      // rg exits with code 1 when there are no matches — that's the pass case.
      const e = err as { status?: number; stdout?: string };
      if (e.status === 1) {
        output = "";
      } else {
        output = (e.stdout ?? "").toString();
      }
    }
    expect(output.trim()).toBe("");
  });

  it("migration 0008 drops the auto-grant RPC", async () => {
    const migration = await readIfExists(
      path.join(
        repoRoot,
        "supabase",
        "migrations",
        "0008_drop_email_access_grant_bootstrap.sql",
      ),
    );
    expect(migration).not.toBeNull();
    expect(migration).toMatch(
      /drop\s+function\s+if\s+exists\s+public\.ensure_email_access_grant/i,
    );
  });
});
