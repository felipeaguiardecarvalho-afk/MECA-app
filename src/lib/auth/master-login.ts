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
 * Pedido de login no formulário é o fluxo master (generateLink, sem OTP público).
 * Inclui o canónico e o opcional em env.
 */
export function isMasterLoginRequestEmail(email: string): boolean {
  return isMasterAccountEmail(email);
}
