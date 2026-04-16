/** Partilhado cliente/servidor — sem `process.env` (seguro importar em Client Components). */
export const CANONICAL_MASTER_EMAIL = "felipe.aguiardecarvalho@gmail.com";

export function isCanonicalMasterEmail(email: string): boolean {
  return email.trim().toLowerCase() === CANONICAL_MASTER_EMAIL.toLowerCase();
}
