/**
 * Canonical site origin for metadata and redirects (Vercel sets VERCEL_URL).
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://meca.app).
 */
export function getSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel}`;
  }
  return "http://localhost:3000";
}

export function getMetadataBase(): URL {
  return new URL(`${getSiteOrigin()}/`);
}
