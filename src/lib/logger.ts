/**
 * Central structured logger with PII redaction.
 *
 * Every server-side `console.*` path that may touch user data MUST route
 * through this module. Hosting providers (Vercel, Fly, AWS CloudWatch, …)
 * retain stdout/stderr indefinitely, so leaked e-mails, user UUIDs, auth
 * tokens or magic-link URLs become a compliance + breach surface.
 *
 * Redaction strategy
 *  - `maskEmail` — `local.replace(/(.{2}).+(@.+)/, "$1***$2")` when the local
 *    part has 3+ characters; otherwise a short safe fallback. Domain kept for
 *    triage; no full mailbox in logs.
 *  - `maskUserId` / `maskIp` — UUID / IP shapes without identifying values.
 *  - `redactString` — regex scrub for free-text (Error messages, stacks,
 *    log lines assembled by upstream libraries). Catches emails, JWTs,
 *    `Bearer …` headers, Supabase auth query params (`code=`,
 *    `token_hash=`, `access_token=`, …) and bare UUIDs.
 *  - `redact` — recursive object walker. For known sensitive keys
 *    (`email`, `user_id`, `token`, `password`, `cookie`, …) it swaps the
 *    value for a masked / `<redacted>` placeholder; for everything else it
 *    recurses and applies `redactString` to any string it finds.
 *  - `logger.error / warn / info / debug` — thin wrappers around
 *    `console.*` that pipe every argument through `redact` before it
 *    reaches the runtime.
 *
 * Enforced by `src/__tests__/logger.test.ts`.
 */

export function maskEmail(email: string | null | undefined): string {
  if (email == null || typeof email !== "string") return "<redacted>";
  const trimmed = email.trim();
  if (!trimmed) return "<redacted>";
  const at = trimmed.indexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return "<redacted>";
  const domain = trimmed.slice(at + 1);
  if (!/^[^\s@]+\.[^\s@]+$/.test(domain)) return "<redacted>";

  const replaced = trimmed.replace(/(.{2}).+(@.+)/, "$1***$2");
  if (replaced !== trimmed) return replaced;

  if (at === 1) return `${trimmed.slice(0, 1)}***${trimmed.slice(at)}`;
  if (at === 2) return `${trimmed.slice(0, 2)}***${trimmed.slice(at)}`;
  return "<redacted>";
}

export function maskUserId(id: string | null | undefined): string {
  if (!id || typeof id !== "string") return "<redacted>";
  const trimmed = id.trim();
  if (trimmed.length <= 8) return "<redacted>";
  return `${trimmed.slice(0, 8)}…`;
}

export function maskIp(ip: string | null | undefined): string {
  if (!ip || typeof ip !== "string") return "<redacted>";
  const trimmed = ip.trim();
  if (!trimmed || trimmed === "unknown") return "unknown";
  const v4 = trimmed.match(/^(\d{1,3})\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
  if (v4) return `${v4[1]}.x.x.x`;
  if (trimmed.includes(":")) {
    const head = trimmed.split(":")[0] || "";
    return head ? `${head}:…` : "<redacted>";
  }
  return "<redacted>";
}

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const JWT_REGEX =
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const BEARER_REGEX = /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/-]+=*/gi;
const SECRET_QUERY_REGEX =
  /(token_hash|access_token|refresh_token|id_token|api[_-]?key|authorization|secret|otp|magic(?:_|-)?link|action(?:_|-)?link|code)=([^&\s"'<>]+)/gi;
const UUID_REGEX =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

export function redactString(s: string): string {
  if (!s) return s;
  return s
    .replace(EMAIL_REGEX, (m) => maskEmail(m))
    .replace(JWT_REGEX, "<redacted:jwt>")
    .replace(BEARER_REGEX, "<redacted:bearer>")
    .replace(SECRET_QUERY_REGEX, (_m, key) => `${key}=<redacted>`)
    .replace(UUID_REGEX, (m) => maskUserId(m));
}

/** Keys whose values are always sensitive regardless of their content. */
const ALWAYS_REDACT_KEYS = new Set<string>([
  "password",
  "token",
  "access_token",
  "accesstoken",
  "refresh_token",
  "refreshtoken",
  "id_token",
  "idtoken",
  "authorization",
  "api_key",
  "apikey",
  "secret",
  "magiclinkurl",
  "magic_link_url",
  "action_link",
  "actionlink",
  "token_hash",
  "tokenhash",
  "otp",
  "cookie",
  "set-cookie",
  "setcookie",
]);

/** Keys whose values are sensitive but should retain some shape for triage. */
const SHAPED_REDACT_KEYS = new Set<string>([
  "email",
  "admin_email",
  "adminemail",
  "target_user_email",
  "targetuseremail",
  "user_id",
  "userid",
  "target_user_id",
  "targetuserid",
  "admin_user_id",
  "adminuserid",
  "recipient",
  "ip",
  "x-forwarded-for",
  "xforwardedfor",
  "x-real-ip",
  "xrealip",
]);

const MAX_DEPTH = 8;

/**
 * `code` is overloaded: Supabase auth uses it for PKCE codes (>100 chars,
 * must be redacted); Postgres uses it for 5-char SQLSTATE identifiers
 * (`23505`, `42P01`, …) that are purely diagnostic and must stay.
 */
function isSuspiciousCode(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (value.length > 12) return true;
  return /[^A-Za-z0-9_]/.test(value);
}

function redactByKey(key: string, value: unknown): unknown {
  const lower = key.toLowerCase();
  if (ALWAYS_REDACT_KEYS.has(lower)) return "<redacted>";
  if (SHAPED_REDACT_KEYS.has(lower)) {
    if (typeof value !== "string") return "<redacted>";
    if (
      lower === "email" ||
      lower === "admin_email" ||
      lower === "adminemail" ||
      lower === "target_user_email" ||
      lower === "targetuseremail" ||
      lower === "recipient"
    ) {
      return maskEmail(value);
    }
    if (lower === "ip" || lower.startsWith("x-") || lower.startsWith("x"))
      return maskIp(value);
    return maskUserId(value);
  }
  if (lower === "code" && isSuspiciousCode(value)) return "<redacted>";
  return undefined;
}

export function redact<T>(input: T, depth = 0): T {
  if (input == null) return input;
  if (depth > MAX_DEPTH) return "<redacted:depth>" as unknown as T;
  if (typeof input === "string") return redactString(input) as unknown as T;
  if (typeof input === "number" || typeof input === "boolean") return input;
  if (typeof input !== "object") return input;

  if (input instanceof Error) {
    const err = input as Error & Record<string, unknown>;
    const out: Record<string, unknown> = {
      name: err.name,
      message: redactString(err.message || ""),
    };
    if (err.stack) out.stack = redactString(String(err.stack));
    for (const [k, v] of Object.entries(err)) {
      if (k === "name" || k === "message" || k === "stack") continue;
      const masked = redactByKey(k, v);
      out[k] = masked !== undefined ? masked : redact(v, depth + 1);
    }
    return out as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((v) => redact(v, depth + 1)) as unknown as T;
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const masked = redactByKey(key, value);
    if (masked !== undefined) {
      out[key] = masked;
      continue;
    }
    out[key] = redact(value, depth + 1);
  }
  return out as unknown as T;
}

type LogArgs = readonly unknown[];

function redactArgs(args: LogArgs): unknown[] {
  return args.map((a) => redact(a));
}

export const logger = {
  error(tag: string, ...args: LogArgs): void {
    console.error(redactString(tag), ...redactArgs(args));
  },
  warn(tag: string, ...args: LogArgs): void {
    console.warn(redactString(tag), ...redactArgs(args));
  },
  info(tag: string, ...args: LogArgs): void {
    console.info(redactString(tag), ...redactArgs(args));
  },
  debug(tag: string, ...args: LogArgs): void {
    if (process.env.NODE_ENV === "production") return;
    console.debug(redactString(tag), ...redactArgs(args));
  },
};
