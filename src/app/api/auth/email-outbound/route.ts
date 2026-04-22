import { isMagicLinkOutboundConfigured } from "@/lib/email/email-config";
import { NextResponse } from "next/server";

/**
 * Indica se o servidor tem Gmail ou Resend configurado para magic link.
 * Não expõe segredos — só um booleano para o aviso de desenvolvimento no /login.
 */
export async function GET() {
  return NextResponse.json({
    outboundConfigured: isMagicLinkOutboundConfigured(),
  });
}
