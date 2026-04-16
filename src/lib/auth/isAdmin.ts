import { isMasterAccountEmail } from "@/lib/auth/master-login";

/**
 * Server-only admin check. E-mail master canónico ou `MASTER_ADMIN_EMAIL`.
 * Never accept email from the request body or client headers.
 */
export function isAdmin(email: string | null | undefined): boolean {
  return isMasterAccountEmail(email);
}
