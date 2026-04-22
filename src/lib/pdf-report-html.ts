import { readFileSync } from "node:fs";
import { join } from "node:path";
import sanitizeHtml from "sanitize-html";

let cachedChartUmd: string | null = null;

/**
 * Chart.js UMD bundle served from /public/vendor (no CDN).
 * Escapes any `</script>` sequence so the bundle can be inlined safely.
 */
export function getChartUmdInline(): string {
  if (!cachedChartUmd) {
    const p = join(process.cwd(), "public", "vendor", "chart.umd.min.js");
    cachedChartUmd = readFileSync(p, "utf8").replace(
      /<\/script>/gi,
      "<\\/script>",
    );
  }
  return cachedChartUmd;
}

/** Plain-text / untrusted fragments: strip tags, entity-encode for HTML. */
export function sanitizePdfText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

/**
 * Full PDF HTML document: server-built template + trusted Chart bundle.
 * Allows all tags/attrs (trusted generator), blocks dangerous URL protocols.
 */
export function sanitizePdfHtmlDocument(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: false,
    allowedAttributes: false,
    allowVulnerableTags: true,
    allowProtocolRelative: false,
  });
}
