import nodemailer from "nodemailer";
import type { Store } from "./store";

export const DEFAULT_INQUIRY_RECIPIENT = "Vitaldesignsource@gmail.com";

export function createNotifier(
  store: Store,
  env: NodeJS.ProcessEnv = process.env,
) {
  const host = env.SMTP_HOST?.trim();
  const user = env.SMTP_USER?.trim();
  // Preserve the provider's password exactly, including intentional spaces.
  const password = env.SMTP_PASS;
  const from = env.INQUIRY_FROM?.trim();
  const to = env.INQUIRY_TO?.trim() || DEFAULT_INQUIRY_RECIPIENT;
  const port = Number(env.SMTP_PORT?.trim() || 465);
  const configured =
    Boolean(host && user && password?.trim() && from) &&
    Number.isInteger(port) &&
    port >= 1 &&
    port <= 65535;
  if (!configured) return { configured: false, flush: async () => {} };
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass: password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  let running = false;
  return {
    configured: true,
    async flush() {
      if (running) return;
      running = true;
      try {
        for (const inquiry of store.pending()) {
          await transport.sendMail({
            from,
            to,
            replyTo: inquiry.email,
            subject: "New Vital Design Source project inquiry",
            messageId: `<${inquiry.id}@vital-inquiries.local>`,
            text: [
              `Reference: ${inquiry.id}`,
              `Received: ${new Date(inquiry.created_at).toISOString()}`,
              `Name: ${inquiry.name}`,
              `Email: ${inquiry.email}`,
              `Company: ${inquiry.company || "Not provided"}`,
              `Project: ${inquiry.type}`,
              `Budget: ${inquiry.budget}`,
              "",
              inquiry.details,
            ].join("\n"),
          });
          store.markNotified(inquiry.id);
        }
      } catch {
        // Never log message content, email addresses, credentials, or provider errors.
        console.error(
          "Inquiry notification delivery failed. Saved inquiries remain queued for retry.",
        );
      } finally {
        running = false;
      }
    },
  };
}
