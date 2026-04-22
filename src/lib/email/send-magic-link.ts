import { Resend } from "resend";
import nodemailer from "nodemailer";
import { readFileSync } from "node:fs";
import tls from "node:tls";
import { logger, maskEmail } from "@/lib/logger";

/** Resend “from”; override after verifying a domain in the Resend dashboard. */
function getResendFromAddress(): string {
  const raw = process.env.RESEND_FROM?.trim();
  if (raw) return raw;
  return "MECA <onboarding@resend.dev>";
}

function getGmailTransports(): nodemailer.Transporter[] {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) return [];

  const caFile = process.env.GMAIL_TLS_CA_FILE?.trim();
  const caBase64 = process.env.GMAIL_TLS_CA_PEM_BASE64?.trim();
  let customCa: string | undefined;
  if (caFile) {
    try {
      customCa = readFileSync(caFile, "utf8");
    } catch (error) {
      logger.warn("[magic-link] Could not read GMAIL_TLS_CA_FILE", {
        path: caFile,
        err: error,
      });
    }
  } else if (caBase64) {
    try {
      customCa = Buffer.from(caBase64, "base64").toString("utf8");
    } catch (error) {
      logger.warn("[magic-link] Could not decode GMAIL_TLS_CA_PEM_BASE64", {
        err: error,
      });
    }
  }

  // If we only pass a custom CA, Node replaces the default trust store and
  // smtp.gmail.com fails (public cert chain). Always keep Mozilla roots + optional corp CA.
  const caChain: string[] | undefined = customCa
    ? [...tls.rootCertificates, customCa]
    : undefined;
  const commonTls = {
    minVersion: "TLSv1.2" as const,
    rejectUnauthorized: true,
    ...(caChain ? { ca: caChain } : {}),
  };

  return [
    nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: commonTls,
    }),
    nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
      tls: commonTls,
    }),
  ];
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

export type SendMagicLinkResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendMagicLinkEmail(
  to: string,
  magicLinkUrl: string,
): Promise<SendMagicLinkResult> {
  const html = magicLinkTemplate(magicLinkUrl);

  // 1. Gmail SMTP (primary)
  const gmailTransports = getGmailTransports();

  logger.info("[magic-link] Gmail transports prepared", {
    transport_count: String(gmailTransports.length),
  });

  for (const gmail of gmailTransports) {
    const cfg = gmail.options as { port?: number };
    try {
      await gmail.sendMail({
        from: `MECA <${process.env.GMAIL_USER}>`,
        to,
        subject: "O seu link de acesso MECA",
        html,
      });
      return { ok: true };
    } catch (err) {
      logger.error("[magic-link] Gmail SMTP error", {
        recipient: maskEmail(to),
        smtp_port: String(cfg.port ?? "unknown"),
        err,
      });
    }
  }

  // 2. Resend fallback
  const resend = getResend();
  if (resend) {
    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to,
      subject: "O seu link de acesso MECA",
      html,
    });
    if (!error) {
      return { ok: true };
    }
    logger.error("[magic-link] Resend error", { recipient: maskEmail(to), error });
  }

  // 3. Dev fallback: treat as success so flows work without SMTP, but never log
  //    the one-shot URL (credential) or raw mailbox to stdout/stderr.
  if (process.env.NODE_ENV !== "production") {
    logger.info("[magic-link] DEV fallback — link not emailed (configure SMTP)", {
      recipient: maskEmail(to),
      url_length: String(magicLinkUrl.length),
    });
    return { ok: true };
  }

  return { ok: false, error: "Não foi possível enviar o email. Tente novamente." };
}

function magicLinkTemplate(url: string): string {
  return `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;padding:40px;border:1px solid #e5e7eb">
        <tr><td style="padding-bottom:24px">
          <p style="margin:0;font-size:22px;font-weight:700;color:#111827">MECA</p>
        </td></tr>
        <tr><td style="padding-bottom:16px">
          <p style="margin:0;font-size:16px;color:#374151">Clique no botão abaixo para entrar na sua conta MECA.</p>
        </td></tr>
        <tr><td style="padding-bottom:32px;text-align:center">
          <a href="${url}"
            style="display:inline-block;background:#111827;color:#ffffff;font-size:15px;font-weight:600;
                   padding:14px 32px;border-radius:8px;text-decoration:none">
            Entrar no MECA
          </a>
        </td></tr>
        <tr><td>
          <p style="margin:0;font-size:13px;color:#9ca3af">
            Se não pediu este link, pode ignorar este email. O link expira em 1 hora.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
