/**
 * Dev-only hints for magic-link outbound mail. Production uses the same transports
 * but does not spam the console on boot.
 */
export function isMagicLinkOutboundConfigured(): boolean {
  const gmail = Boolean(
    process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim(),
  );
  const resend = Boolean(process.env.RESEND_API_KEY?.trim());
  return gmail || resend;
}

export function logDevMagicLinkEmailBootStatus(): void {
  if (process.env.NODE_ENV === "production") return;

  if (isMagicLinkOutboundConfigured()) {
    const modes: string[] = [];
    if (
      process.env.GMAIL_USER?.trim() &&
      process.env.GMAIL_APP_PASSWORD?.trim()
    ) {
      modes.push("Gmail SMTP");
    }
    if (process.env.RESEND_API_KEY?.trim()) {
      modes.push("Resend");
    }
    console.info(`[email] Magic link outbound: ${modes.join(" + ")}`);
    return;
  }

  console.warn(
    "[email] Magic link: set RESEND_API_KEY or GMAIL_USER + GMAIL_APP_PASSWORD in .env.local — otherwise no real emails in dev (see .env.example).",
  );
}
