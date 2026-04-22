import {
  CANONICAL_MASTER_EMAIL,
  isCanonicalMasterEmail,
} from "@/lib/auth/canonical-master";

/**
 * E-mail master único do produto (canónico).
 * Qualquer outro e-mail deve seguir o fluxo convencional.
 */
export { CANONICAL_MASTER_EMAIL };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Sessão / utilizador corresponde ao master (admin APIs, flags). */
export function isMasterAccountEmail(email: string | null | undefined): boolean {
  if (email == null || email === "") return false;
  const e = normalizeEmail(email);
  return isCanonicalMasterEmail(e);
}

/**
 * E-mail do pedido de login corresponde à conta master (mesmo critério que `isMasterAccountEmail`).
 */
export function isMasterLoginRequestEmail(email: string): boolean {
  return isMasterAccountEmail(email);
}
