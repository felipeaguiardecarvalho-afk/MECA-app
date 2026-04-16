import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");

describe("styling system guardrails", () => {
  it("globals.css contains required Tailwind directives in order", () => {
    const css = readFileSync(join(root, "app", "globals.css"), "utf8");
    expect(css).toMatch(/@tailwind base;/);
    expect(css).toMatch(/@tailwind components;/);
    expect(css).toMatch(/@tailwind utilities;/);
    const idxBase = css.indexOf("@tailwind base;");
    const idxComp = css.indexOf("@tailwind components;");
    const idxUtil = css.indexOf("@tailwind utilities;");
    expect(idxBase).toBeLessThan(idxComp);
    expect(idxComp).toBeLessThan(idxUtil);
  });

  it("layout imports globals.css", () => {
    const layout = readFileSync(join(root, "app", "layout.tsx"), "utf8");
    expect(layout).toMatch(/import\s+["']\.\/globals\.css["']/);
  });
});
