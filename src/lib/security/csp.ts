/**
 * Content-Security-Policy builder — nonce-based styles + img allow-list.
 *
 * Design notes:
 *
 * 1. Nonces are generated per request in `src/middleware.ts` and passed via
 *    the `x-nonce` request header. Next.js auto-attaches the nonce to its
 *    own framework `<script>` tags when it sees one in the CSP header.
 *
 * 2. Styles are split along the CSP Level 3 directives to avoid keeping
 *    `'unsafe-inline'` for the actual XSS vector:
 *
 *      - `style-src-elem`  (governs `<style>` and `<link rel=stylesheet>`):
 *           nonce-only in production. This blocks any injected `<style>`
 *           (the real XSS surface) unless it carries our per-request nonce.
 *           The app ships zero authored inline `<style>` tags, so this is
 *           enforced without exceptions in prod.
 *
 *      - `style-src-attr`  (governs `style=""` HTML attributes):
 *           `'unsafe-inline'`. The app uses React's `style={{...}}` prop
 *           extensively (dashboards, recharts, arquétipos — ~100+ sites).
 *           These become `style=""` attributes, which are React-controlled
 *           objects rather than parsed strings — not a classic XSS vector,
 *           and modern browsers no longer execute CSS expressions.
 *           Hashing each inline style is not scalable.
 *
 *      - `style-src`       (legacy fallback for browsers without L3):
 *           keeps `'self' 'nonce-…' https://fonts.googleapis.com`. Browsers
 *           that don't understand `style-src-elem` / `style-src-attr` fall
 *           back here. Inline `<style>` requires the nonce. Inline style
 *           attributes won't work on those legacy browsers — accepted
 *           trade-off (CSP L3 ships in Chrome/Edge/Firefox/Safari since
 *           2020–2021).
 *
 * 3. Development keeps `'unsafe-inline'` and `'unsafe-eval'` for scripts,
 *    plus `'unsafe-inline'` for `style-src-elem`, so that React Fast
 *    Refresh and webpack's `style-loader` HMR — which inject unnonced
 *    `<style>` tags on every hot update — do not get blocked. Production
 *    never ships these tokens.
 *
 * 4. `img-src` hardening (no wildcard `https:`, no `blob:`) is preserved
 *    from the earlier change.
 */

const isProdDefault = process.env.NODE_ENV === "production";

function supabaseConnectSrc(): string {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!u) return "https://*.supabase.co wss://*.supabase.co";
  try {
    const host = new URL(u).host;
    return `https://${host} wss://${host}`;
  } catch {
    return "https://*.supabase.co wss://*.supabase.co";
  }
}

function imgSrcExtraHosts(): string[] {
  const raw = process.env.NEXT_PUBLIC_IMG_CSP_HOSTS?.trim();
  if (!raw) return [];
  const out: string[] = [];
  for (const token of raw.split(/[\s,]+/).filter(Boolean)) {
    if (!/^https:\/\/[^\s*]+$/.test(token)) {
      console.warn(
        `[csp] img-src: ignoring invalid host "${token}" ` +
          `(must be a concrete https:// origin, no wildcards, no schemes other than https).`,
      );
      continue;
    }
    out.push(token);
  }
  return out;
}

export function buildImgSrc(): string {
  const allow = ["'self'", "data:", ...imgSrcExtraHosts()];
  return `img-src ${allow.join(" ")}`;
}

/**
 * Base62-ish 22-char nonce (>128 bits of entropy) from 16 random bytes,
 * base64url-encoded and padding-stripped. Safe for Edge runtime.
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  // btoa → base64; convert to base64url and drop `=`.
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Rejects obviously malformed nonces before splicing into the CSP header.
 * Defensive: the nonce always comes from `generateNonce`, but a caller who
 * builds a CSP from an untrusted source would otherwise be able to break
 * out of the directive with whitespace or quotes.
 */
const NONCE_SHAPE = /^[A-Za-z0-9_-]{16,128}$/;

export interface BuildCspOptions {
  /** Defaults to `process.env.NODE_ENV === "production"`. */
  isProd?: boolean;
}

export function buildCsp(nonce: string, opts: BuildCspOptions = {}): string {
  if (!NONCE_SHAPE.test(nonce)) {
    throw new Error(
      "[csp] buildCsp called with invalid nonce; refusing to emit CSP header.",
    );
  }
  const isProd = opts.isProd ?? isProdDefault;
  const connect = supabaseConnectSrc();
  const nonceToken = `'nonce-${nonce}'`;

  // Scripts: nonce-based in prod; dev adds unsafe-eval/inline for HMR & React Fast Refresh.
  const scriptSrc = isProd
    ? `'self' ${nonceToken}`
    : `'self' ${nonceToken} 'unsafe-eval' 'unsafe-inline'`;

  // style-src-elem: nonce-only in prod. Dev also allows 'unsafe-inline' because
  // webpack style-loader HMR injects unnonced <style> tags per update.
  const styleSrcElem = isProd
    ? `'self' ${nonceToken} https://fonts.googleapis.com`
    : `'self' ${nonceToken} 'unsafe-inline' https://fonts.googleapis.com`;

  // Legacy fallback for browsers without CSP L3 -elem/-attr. Still no
  // 'unsafe-inline' in prod — <style> must carry the nonce.
  const styleSrcLegacy = isProd
    ? `'self' ${nonceToken} https://fonts.googleapis.com`
    : `'self' ${nonceToken} 'unsafe-inline' https://fonts.googleapis.com`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrcLegacy}`,
    `style-src-elem ${styleSrcElem}`,
    `style-src-attr 'unsafe-inline'`,
    buildImgSrc(),
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' ${connect}`,
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
