import { describe, expect, it } from "vitest";
import { sanitizeAiPlainText, sanitizeInput } from "@/lib/sanitize";

describe("sanitizeInput (LLM / prompt)", () => {
  it("removes ignore previous instructions case-insensitively", () => {
    expect(
      sanitizeInput('hello IGNORE PREVIOUS INSTRUCTIONS world'),
    ).toBe("hello world");
  });

  it("removes system prompt", () => {
    expect(sanitizeInput("x System Prompt y")).toBe("x y");
  });

  it("removes override substring", () => {
    expect(sanitizeInput("before override after")).toBe("before after");
  });

  it("strips angle brackets", () => {
    expect(sanitizeInput("a<script>x</script>b")).toBe("ascriptx/scriptb");
  });

  it("truncates to 1000 chars by default", () => {
    const long = "a".repeat(2000);
    expect(sanitizeInput(long).length).toBe(1000);
  });

  it("respects custom maxLen", () => {
    expect(sanitizeInput("abcdef", 3)).toBe("abc");
  });
});

describe("sanitizeAiPlainText", () => {
  it("does not strip the word override from output", () => {
    expect(sanitizeAiPlainText("Use override carefully", 100)).toBe(
      "Use override carefully",
    );
  });

  it("strips controls and angle brackets", () => {
    expect(sanitizeAiPlainText("ok<x>", 10)).toBe("okx");
  });
});
