import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNotifier } from "../server/notifications";
import { openStore, type Store } from "../server/store";
import { inquirySchema } from "../src/lib/inquiry";

const { createTransport, sendMail } = vi.hoisted(() => {
  const sendMail =
    vi.fn<(message: Record<string, unknown>) => Promise<unknown>>();
  return {
    sendMail,
    createTransport: vi.fn(() => ({ sendMail })),
  };
});

vi.mock("nodemailer", () => ({ default: { createTransport } }));

const recipient = "Vitaldesignsource@gmail.com";
const configuredEnv: NodeJS.ProcessEnv = {
  SMTP_HOST: "smtp.example.test",
  SMTP_USER: "sender@example.test",
  SMTP_PASS: "private-test-password",
  INQUIRY_FROM: "Vital Design Source <sender@example.test>",
};
const inquiry = inquirySchema.parse({
  name: "Test Visitor",
  email: "visitor@example.test",
  company: "Example Studio",
  type: "Intelligent automation",
  budget: "Not sure yet",
  details:
    "Please help organize incoming service requests.\n\nWorkflow example: Service request\nKeep a person in control of the handoff.",
  website: "",
  consent: true,
});

let store: Store;

beforeEach(() => {
  vi.clearAllMocks();
  sendMail.mockReset();
  sendMail.mockResolvedValue({ accepted: [recipient], rejected: [] });
  store = openStore(":memory:");
});

afterEach(() => {
  store.close();
  vi.restoreAllMocks();
});

describe("inquiry email delivery", () => {
  it.each([undefined, "", " \t "])(
    "forwards to the studio inbox when INQUIRY_TO is unset or blank (%j)",
    async (INQUIRY_TO) => {
      store.save(inquiry);
      const notifier = createNotifier(store, { ...configuredEnv, INQUIRY_TO });
      expect(notifier.configured).toBe(true);
      await notifier.flush();
      expect(sendMail).toHaveBeenCalledOnce();
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: recipient }),
      );
    },
  );

  it("honors an explicit trimmed recipient override", async () => {
    store.save(inquiry);
    const notifier = createNotifier(store, {
      ...configuredEnv,
      INQUIRY_TO: "  another-inbox@example.test  ",
    });
    await notifier.flush();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "another-inbox@example.test" }),
    );
  });

  it("sends every inquiry field and its chosen context with a safe sender and reply address", async () => {
    const id = store.save(inquiry);
    const saved = store.pending()[0];
    const notifier = createNotifier(store, configuredEnv);
    await notifier.flush();
    expect(sendMail).toHaveBeenCalledWith({
      from: configuredEnv.INQUIRY_FROM,
      to: recipient,
      replyTo: inquiry.email,
      subject: "New Vital Design Source project inquiry",
      messageId: `<${id}@vital-inquiries.local>`,
      text: [
        `Reference: ${id}`,
        `Received: ${new Date(saved.created_at).toISOString()}`,
        `Name: ${inquiry.name}`,
        `Email: ${inquiry.email}`,
        `Company: ${inquiry.company}`,
        `Project: ${inquiry.type}`,
        `Budget: ${inquiry.budget}`,
        "",
        inquiry.details,
      ].join("\n"),
    });
    expect(store.pending()).toHaveLength(0);
    const row = store.db
      .prepare("SELECT notified_at FROM inquiries WHERE id = ?")
      .get(id) as { notified_at: number };
    expect(row.notified_at).toBeGreaterThan(0);
    await notifier.flush();
    expect(sendMail).toHaveBeenCalledOnce();
  });

  it("identifies an omitted optional company without dropping the inquiry", async () => {
    store.save({ ...inquiry, company: "" });
    await createNotifier(store, configuredEnv).flush();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("Company: Not provided"),
      }),
    );
  });

  it("keeps rejected delivery queued and retries the same reference without exposing provider errors", async () => {
    const id = store.save(inquiry);
    const providerError = new Error(
      "Provider failure with private-test-password and visitor@example.test",
    );
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    sendMail.mockRejectedValueOnce(providerError);
    const notifier = createNotifier(store, configuredEnv);

    await expect(notifier.flush()).resolves.toBeUndefined();
    expect(store.pending()).toHaveLength(1);
    expect(store.pending()[0].notified_at).toBeNull();
    expect(errorLog).toHaveBeenCalledExactlyOnceWith(
      "Inquiry notification delivery failed. Saved inquiries remain queued for retry.",
    );
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain(
      providerError.message,
    );
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain(inquiry.email);

    await notifier.flush();
    expect(sendMail).toHaveBeenCalledTimes(2);
    for (const [message] of sendMail.mock.calls) {
      expect(message.messageId).toBe(`<${id}@vital-inquiries.local>`);
      expect(message.to).toBe(recipient);
    }
    expect(store.pending()).toHaveLength(0);
  });

  it("marks delivery only after acceptance and prevents overlapping flushes", async () => {
    store.save(inquiry);
    let acceptDelivery!: (value: unknown) => void;
    sendMail.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          acceptDelivery = resolve;
        }),
    );
    const notifier = createNotifier(store, configuredEnv);
    const firstFlush = notifier.flush();
    expect(sendMail).toHaveBeenCalledOnce();
    expect(store.pending()).toHaveLength(1);
    expect(store.pending()[0].notified_at).toBeNull();

    await notifier.flush();
    expect(sendMail).toHaveBeenCalledOnce();
    acceptDelivery({ accepted: [recipient], rejected: [] });
    await firstFlush;
    expect(store.pending()).toHaveLength(0);
    await notifier.flush();
    expect(sendMail).toHaveBeenCalledOnce();
  });

  it("drains previously saved inquiries through the same configured destination", async () => {
    store.save(inquiry);
    store.save({ ...inquiry, email: "second-visitor@example.test" });
    const notifier = createNotifier(store, configuredEnv);
    await notifier.flush();
    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail.mock.calls.map(([message]) => message.replyTo)).toEqual([
      inquiry.email,
      "second-visitor@example.test",
    ]);
    expect(
      sendMail.mock.calls.every(([message]) => message.to === recipient),
    ).toBe(true);
    expect(store.pending()).toHaveLength(0);
  });
});

describe("private SMTP configuration", () => {
  it("trims configuration labels while preserving password bytes", async () => {
    const password = "  private test password  ";
    const notifier = createNotifier(store, {
      SMTP_HOST: "  smtp.example.test  ",
      SMTP_USER: "  sender@example.test  ",
      SMTP_PASS: password,
      INQUIRY_FROM: "  Vital Design Source <sender@example.test>  ",
    });
    expect(notifier.configured).toBe(true);
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.example.test",
        auth: { user: "sender@example.test", pass: password },
      }),
    );
    store.save(inquiry);
    await notifier.flush();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Vital Design Source <sender@example.test>",
      }),
    );
  });

  it.each([
    [undefined, 465, true, false],
    ["", 465, true, false],
    [" \t ", 465, true, false],
    ["465", 465, true, false],
    [" 587 ", 587, false, true],
  ])(
    "requires TLS with SMTP_PORT %j",
    (SMTP_PORT, port, secure, requireTLS) => {
      const notifier = createNotifier(store, {
        ...configuredEnv,
        SMTP_PORT: SMTP_PORT as string | undefined,
      });
      expect(notifier.configured).toBe(true);
      expect(createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port,
          secure,
          requireTLS,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          disableFileAccess: true,
          disableUrlAccess: true,
        }),
      );
    },
  );

  it.each(
    ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "INQUIRY_FROM"].flatMap((key) =>
      [undefined, "", " \t "].map((value) => [key, value] as const),
    ),
  )(
    "keeps inquiries queued when %s is missing or blank (%j)",
    async (key, value) => {
      store.save(inquiry);
      const notifier = createNotifier(store, {
        ...configuredEnv,
        [key]: value,
      });
      expect(notifier.configured).toBe(false);
      await expect(notifier.flush()).resolves.toBeUndefined();
      expect(createTransport).not.toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
      expect(store.pending()).toHaveLength(1);
    },
  );

  it.each(["0", "-1", "65536", "1.5", "not-a-port", "Infinity"])(
    "disables notifications without crashing or losing inquiries for invalid port %s",
    async (SMTP_PORT) => {
      store.save(inquiry);
      const notifier = createNotifier(store, { ...configuredEnv, SMTP_PORT });
      expect(notifier.configured).toBe(false);
      await expect(notifier.flush()).resolves.toBeUndefined();
      expect(createTransport).not.toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
      expect(store.pending()).toHaveLength(1);
    },
  );
});
