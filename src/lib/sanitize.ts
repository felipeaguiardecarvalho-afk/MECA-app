/**
 * String hardening for LLM / prompt contexts.
 * Does not replace a full HTML sanitizer for rich markup — strips control chars
 * and angle brackets to reduce injection in plain-text prompts.
 */

const INJECTION_PHRASES = [
  "ignore previous instructions",
  "system prompt",
  "override",
] as const;

const DEFAULT_LLM_MAX = 1000;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Removes common prompt-injection substrings (case-insensitive), control
 * characters, `<`/`>` (HTML/script delimiter noise), collapses whitespace,
 * then truncates to `maxLen` (default 1000).
 */
export function sanitizeInput(input: string, maxLen = DEFAULT_LLM_MAX): string {
  if (typeof input !== "string") return "";
  let s = input.trim();
  for (const phrase of INJECTION_PHRASES) {
    const re = new RegExp(escapeRegExp(phrase), "gi");
    s = s.replace(re, " ");
  }
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  s = s.replace(/[<>]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s.slice(0, maxLen).trim();
}

/**
 * Post-model plain text: no injection-phrase stripping (could alter legitimate
 * copy); strips controls, angle brackets, hard cap.
 */
export function sanitizeAiPlainText(input: string, maxLen: number): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLen)
    .trim();
}
