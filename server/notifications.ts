import nodemailer from "nodemailer";
import type { Store } from "./store";

export function createNotifier(
  store: Store,
  env: NodeJS.ProcessEnv = process.env,
) {
  const required = [
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS",
    "INQUIRY_FROM",
    "INQUIRY_TO",
  ] as const;
  const configured = required.every((key) => Boolean(env[key]));
  if (!configured) return { configured: false, flush: async () => {} };
  const port = Number(env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
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
            from: env.INQUIRY_FROM,
            to: env.INQUIRY_TO,
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
