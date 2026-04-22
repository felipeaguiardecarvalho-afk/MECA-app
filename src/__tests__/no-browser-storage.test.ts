import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Security invariant: no user data (PII or otherwise) may be persisted to
 * `sessionStorage` / `localStorage`. All diagnostic results, scores,
 * archetypes, user ids and emails must live server-side and be fetched on
 * demand (`GET /api/user/history`, etc).
 *
 * This test uses `git grep` to enforce the invariant at CI time. It fails
 * loudly if any file under `src/` reintroduces browser storage usage.
 *
 * The only allowed callers of these APIs are this test file itself (to
 * reference the banned identifiers) — nothing else in `src/` may mention
 * them.
 */

type Match = { file: string; line: number; text: string };

function runGitGrep(pattern: string): Match[] {
  const repoRoot = path.resolve(__dirname, "..", "..");
  try {
    const out = execFileSync(
      "git",
      [
        "-C",
        repoRoot,
        "grep",
        "-n",
        "--extended-regexp",
        pattern,
        "--",
        "src",
      ],
      { encoding: "utf8" },
    );
    return out
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [file, lineNumber, ...rest] = line.split(":");
        return {
          file: file.replace(/\\/g, "/"),
          line: Number(lineNumber),
          text: rest.join(":"),
        };
      });
  } catch (err) {
    const execErr = err as NodeJS.ErrnoException & {
      status?: number;
      stdout?: string;
    };
    if (execErr.status === 1) return [];
    throw err;
  }
}

describe("no browser storage for user data", () => {
  const selfRelative = "src/__tests__/no-browser-storage.test.ts";

  it("is running against a git working tree", () => {
    const repoRoot = path.resolve(__dirname, "..", "..");
    expect(existsSync(path.join(repoRoot, ".git"))).toBe(true);
  });

  it("no source file under src/ references sessionStorage", () => {
    const matches = runGitGrep("\\bsessionStorage\\b").filter(
      (m) => m.file !== selfRelative,
    );
    expect(
      matches,
      `Forbidden sessionStorage usage found:\n${matches
        .map((m) => `  ${m.file}:${m.line} → ${m.text.trim()}`)
        .join("\n")}`,
    ).toEqual([]);
  });

  it("no source file under src/ references localStorage", () => {
    const matches = runGitGrep("\\blocalStorage\\b").filter(
      (m) => m.file !== selfRelative,
    );
    expect(
      matches,
      `Forbidden localStorage usage found:\n${matches
        .map((m) => `  ${m.file}:${m.line} → ${m.text.trim()}`)
        .join("\n")}`,
    ).toEqual([]);
  });

  it("legacy PII storage modules are deleted", () => {
    const repoRoot = path.resolve(__dirname, "..", "..");
    expect(
      existsSync(path.join(repoRoot, "src/lib/meca-dashboard-scores.ts")),
    ).toBe(false);
    expect(
      existsSync(path.join(repoRoot, "src/lib/meca-offline-result.ts")),
    ).toBe(false);
  });

  it("legacy storage keys are no longer imported or referenced", () => {
    const bannedPatterns = [
      "DASHBOARD_BOOTSTRAP_KEY",
      "OFFLINE_RESULT_KEY_PREFIX",
      "meca_dashboard_bootstrap",
      "meca_row_",
      "readDashboardBootstrap",
      "clearDashboardBootstrap",
    ];
    for (const pattern of bannedPatterns) {
      const matches = runGitGrep(pattern).filter(
        (m) => m.file !== selfRelative,
      );
      expect(
        matches,
        `Banned identifier "${pattern}" still referenced in src/:\n${matches
          .map((m) => `  ${m.file}:${m.line} → ${m.text.trim()}`)
          .join("\n")}`,
      ).toEqual([]);
    }
  });
});
