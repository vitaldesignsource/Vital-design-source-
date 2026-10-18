import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app";
import { openStore, type Store } from "../server/store";
import { inquirySchema } from "../src/lib/inquiry";
import { OFFICIAL_SITE_URL } from "../server/config";

const valid = {
  name: "Test Person",
  email: "test@example.com",
  company: "Test Company",
  type: "Website & development",
  budget: "Not sure yet",
  details: "This is a test inquiry about a website project.",
  website: "",
  consent: true,
};
const secret = "testing-secret-with-at-least-32-random-characters";
let store: Store;
let server: Server;
let base: string;

beforeEach(async () => {
  store = openStore(":memory:", secret);
  server = createServer(
    createApp({ store, siteUrl: "https://studio.example", production: true }),
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Test server failed to bind.");
  base = `http://127.0.0.1:${address.port}`;
});
afterEach(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  store.close();
});

const post = (body: unknown = valid, headers: Record<string, string> = {}) =>
  fetch(`${base}/api/inquiry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://studio.example",
      ...headers,
    },
    body: JSON.stringify(body),
  });

describe("inquiry boundary", () => {
  it("persists a valid inquiry before acknowledging receipt", async () => {
    const response = await post();
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
    expect(store.pending()).toHaveLength(1);
    expect(store.pending()[0].email).toBe(valid.email);
    expect(store.pending()[0]).not.toHaveProperty("website");
    expect(store.pending()[0]).not.toHaveProperty("ip");
  });
  it.each([
    { consent: false },
    { email: "x\r\nBcc:test@example.com" },
    { details: "short" },
    { name: " " },
    { type: "unrecognized" },
    { extra: "not allowed" },
  ])("rejects invalid fields: %j", async (fields) => {
    expect((await post({ ...valid, ...fields })).status).toBe(400);
    expect(store.pending()).toHaveLength(0);
  });
  it("rejects missing and foreign origins", async () => {
    expect((await post(valid, { Origin: "" })).status).toBe(403);
    expect(
      (await post(valid, { Origin: "https://attacker.example" })).status,
    ).toBe(403);
    expect((await post(valid, { "Sec-Fetch-Site": "cross-site" })).status).toBe(
      403,
    );
    expect(store.pending()).toHaveLength(0);
  });
  it("rejects other content types and methods", async () => {
    expect((await post(valid, { "Content-Type": "text/plain" })).status).toBe(
      415,
    );
    const response = await fetch(`${base}/api/inquiry`);
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });
  it("silently discards honeypot submissions", async () => {
    expect(
      (await post({ ...valid, website: "https://spam.example" })).status,
    ).toBe(200);
    expect(store.pending()).toHaveLength(0);
  });
  it("caps payloads and handles malformed JSON", async () => {
    expect((await post({ ...valid, details: "a".repeat(20000) })).status).toBe(
      413,
    );
    expect(
      (
        await fetch(`${base}/api/inquiry`, {
          method: "POST",
          headers: {
            Origin: "https://studio.example",
            "Content-Type": "application/json",
          },
          body: "{",
        })
      ).status,
    ).toBe(400);
  });
  it("rate limits repeated email submissions despite spoofed forwarded addresses", async () => {
    for (let i = 0; i < 5; i++)
      expect(
        (await post(valid, { "X-Forwarded-For": `192.0.2.${i}` })).status,
      ).toBe(201);
    const response = await post();
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(store.pending()).toHaveLength(5);
  });
  it("accepts distinct visitors sharing one reverse-proxy address", async () => {
    for (let visitor = 0; visitor < 6; visitor++)
      expect(
        (await post({ ...valid, email: `visitor${visitor}@example.com` }))
          .status,
      ).toBe(201);
    expect(store.pending()).toHaveLength(6);
  });
  it("counts case and whitespace variants toward the same email limit", async () => {
    for (const email of [
      "test@example.com",
      "TEST@example.com",
      "Test@Example.Com",
      " test@example.com ",
      "test@EXAMPLE.com",
    ])
      expect((await post({ ...valid, email })).status).toBe(201);
    expect((await post({ ...valid, email: "TEST@EXAMPLE.COM" })).status).toBe(
      429,
    );
    expect(store.pending()).toHaveLength(5);
  });
  it("caps malformed submissions per network despite spoofed forwarding headers", async () => {
    for (let attempt = 0; attempt < 60; attempt++)
      expect(
        (
          await post(
            { ...valid, details: "short" },
            { "X-Forwarded-For": `192.0.2.${attempt}` },
          )
        ).status,
      ).toBe(400);
    const response = await post(valid, { "X-Forwarded-For": "198.51.100.1" });
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(store.pending()).toHaveLength(0);
    expect(
      store.db.prepare("SELECT count(*) AS count FROM rate_limits").get(),
    ).toEqual({ count: 1 });
  });
  it("accepts only the official apex and www origins for the official deployment", async () => {
    const officialServer = createServer(
      createApp({ store, siteUrl: OFFICIAL_SITE_URL, production: true }),
    );
    await new Promise<void>((resolve) =>
      officialServer.listen(0, "127.0.0.1", resolve),
    );
    try {
      const address = officialServer.address();
      if (!address || typeof address === "string")
        throw new Error("Official-origin test server failed to bind.");
      const officialPost = (origin: string) =>
        fetch(`http://127.0.0.1:${address.port}/api/inquiry`, {
          method: "POST",
          headers: {
            Origin: origin,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(valid),
        });
      expect((await officialPost(OFFICIAL_SITE_URL)).status).toBe(201);
      expect(
        (await officialPost("https://www.vitaldesignsource.com")).status,
      ).toBe(201);
      expect(
        (await officialPost("https://vitaldesignsource.com.attacker.example"))
          .status,
      ).toBe(403);
      expect(
        (await officialPost("https://other.vitaldesignsource.com")).status,
      ).toBe(403);
      expect(
        (await post(valid, { Origin: "https://www.vitaldesignsource.com" }))
          .status,
      ).toBe(403);
      expect(store.pending()).toHaveLength(2);
    } finally {
      await new Promise<void>((resolve, reject) =>
        officialServer.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
  it("applies production security headers without permissive script policy", async () => {
    const response = await fetch(`${base}/api/health`);
    expect(response.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers.get("content-security-policy")).not.toContain(
      "unsafe-inline",
    );
    expect(response.headers.get("strict-transport-security")).toContain(
      "max-age=31536000",
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("permissions-policy")).toContain("camera=()");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-powered-by")).toBeNull();
  });
});

describe("private storage", () => {
  it.each([undefined, "", "   "])(
    "keeps an automatic rate-limit secret across restarts for an unset or blank override",
    (override) => {
      const directory = mkdtempSync(join(tmpdir(), "vital-auto-secret-"));
      const path = join(directory, "inquiries.sqlite");
      const now = Date.now();
      let persistent: Store | undefined;
      try {
        persistent = openStore(path, override);
        for (let attempt = 0; attempt < 5; attempt++)
          expect(persistent.consumeRateLimit("192.0.2.1", now).allowed).toBe(
            true,
          );
        expect(statSync(path).mode & 0o777).toBe(0o600);
        expect(
          persistent.db
            .prepare(
              "SELECT count(*) AS count FROM app_settings WHERE key = 'rate_limit_secret' AND length(value) = 64",
            )
            .get(),
        ).toEqual({ count: 1 });
        persistent.close();
        persistent = undefined;
        persistent = openStore(path, override);
        expect(persistent.consumeRateLimit("192.0.2.1", now).allowed).toBe(
          false,
        );
      } finally {
        persistent?.close();
        rmSync(directory, { recursive: true, force: true });
      }
    },
  );
  it("shares its automatic secret between independent open database handles", () => {
    const directory = mkdtempSync(join(tmpdir(), "vital-shared-secret-"));
    const path = join(directory, "inquiries.sqlite");
    const now = Date.now();
    let first: Store | undefined;
    let second: Store | undefined;
    try {
      first = openStore(path);
      second = openStore(path);
      for (let attempt = 0; attempt < 5; attempt++) {
        const connection = attempt % 2 === 0 ? first : second;
        expect(connection.consumeRateLimit("192.0.2.1", now).allowed).toBe(
          true,
        );
      }
      expect(second.consumeRateLimit("192.0.2.1", now).allowed).toBe(false);
      expect(
        first.db.prepare("SELECT count(*) AS count FROM rate_limits").get(),
      ).toEqual({ count: 1 });
    } finally {
      second?.close();
      first?.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
  it("honors an explicit rate-limit secret without storing the override", () => {
    const directory = mkdtempSync(join(tmpdir(), "vital-secret-override-"));
    const path = join(directory, "inquiries.sqlite");
    const now = Date.now();
    let persistent: Store | undefined;
    try {
      persistent = openStore(path, secret);
      for (let attempt = 0; attempt < 5; attempt++)
        expect(persistent.consumeRateLimit("192.0.2.1", now).allowed).toBe(
          true,
        );
      expect(
        persistent.db
          .prepare("SELECT count(*) AS count FROM app_settings")
          .get(),
      ).toEqual({ count: 0 });
      persistent.close();
      persistent = undefined;
      persistent = openStore(path, secret);
      expect(persistent.consumeRateLimit("192.0.2.1", now).allowed).toBe(false);
    } finally {
      persistent?.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
  it("rejects a weak explicit rate-limit secret", () => {
    expect(() => openStore(":memory:", "too-short")).toThrow(
      "RATE_LIMIT_SECRET must contain at least 32 characters.",
    );
  });
  it("fails closed when its stored automatic secret is corrupt", () => {
    const directory = mkdtempSync(join(tmpdir(), "vital-corrupt-secret-"));
    const path = join(directory, "inquiries.sqlite");
    const persistent = openStore(path);
    try {
      persistent.db
        .prepare("UPDATE app_settings SET value = ? WHERE key = ?")
        .run("invalid", "rate_limit_secret");
      persistent.close();
      expect(() => openStore(path)).toThrow(
        "The stored rate-limit secret is invalid.",
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
  it("survives a restart with restricted file permissions", () => {
    const directory = mkdtempSync(join(tmpdir(), "vital-store-"));
    const path = join(directory, "inquiries.sqlite");
    try {
      let persistent = openStore(path, secret);
      const parsed = inquirySchema.parse(valid);
      persistent.save(parsed);
      persistent.close();
      persistent = openStore(path, secret);
      expect(persistent.pending()).toHaveLength(1);
      expect(statSync(path).mode & 0o777).toBe(0o600);
      persistent.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
  it("removes expired inquiries and expired network hashes", () => {
    const id = store.save(inquirySchema.parse(valid));
    store.db
      .prepare("UPDATE inquiries SET created_at = ? WHERE id = ?")
      .run(Date.now() - 181 * 86400000, id);
    store.consumeRateLimit("192.0.2.1", Date.now() - 3600001);
    store.prune();
    expect(store.pending()).toHaveLength(0);
    expect(store.db.prepare("SELECT * FROM rate_limits").all()).toHaveLength(0);
  });
  it("resets a rate limit after one hour and stores only keyed hashes", () => {
    const now = Date.now();
    for (let i = 0; i < 5; i++)
      expect(store.consumeRateLimit("192.0.2.1", now).allowed).toBe(true);
    expect(store.consumeRateLimit("192.0.2.1", now).allowed).toBe(false);
    expect(store.consumeRateLimit("192.0.2.1", now + 3600001).allowed).toBe(
      true,
    );
    const row = store.db.prepare("SELECT key FROM rate_limits").get() as {
      key: string;
    };
    expect(row.key).toMatch(/^[0-9a-f]{64}$/);
    expect(row.key).not.toContain("192.0.2.1");
  });
});
