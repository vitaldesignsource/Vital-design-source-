import { DatabaseSync } from "node:sqlite";
import { chmodSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import type { Inquiry } from "../src/lib/inquiry";

const HOUR = 60 * 60 * 1000;
export const RETENTION_DAYS = 180;

export function openStore(file: string, rateLimitSecret?: string) {
  const override = rateLimitSecret?.trim() ? rateLimitSecret : undefined;
  if (override && override.length < 32)
    throw new Error("RATE_LIMIT_SECRET must contain at least 32 characters.");
  if (file !== ":memory:") {
    mkdirSync(dirname(resolve(file)), { recursive: true, mode: 0o700 });
  }
  const db = new DatabaseSync(file);
  let secret: string;
  try {
    if (file !== ":memory:") chmodSync(file, 0o600);
    db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY, created_at INTEGER NOT NULL,
      name TEXT NOT NULL, email TEXT NOT NULL, company TEXT NOT NULL,
      type TEXT NOT NULL, budget TEXT NOT NULL, details TEXT NOT NULL,
      consent_version TEXT NOT NULL, notified_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY, started_at INTEGER NOT NULL, count INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS inquiries_created ON inquiries(created_at);
  `);
    if (override) {
      secret = override;
    } else {
      // The database selects the winner when multiple processes initialize it.
      db.prepare(
        "INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)",
      ).run("rate_limit_secret", randomBytes(32).toString("hex"));
      const setting = db
        .prepare("SELECT value FROM app_settings WHERE key = ?")
        .get("rate_limit_secret") as { value: unknown } | undefined;
      if (
        typeof setting?.value !== "string" ||
        !/^[0-9a-f]{64}$/.test(setting.value)
      )
        throw new Error(
          "The stored rate-limit secret is invalid. Restore the private database from a trusted backup.",
        );
      secret = setting.value;
    }
  } catch (error) {
    db.close();
    throw error;
  }
  const prune = (now = Date.now()) => {
    db.prepare("DELETE FROM inquiries WHERE created_at < ?").run(
      now - RETENTION_DAYS * 86400000,
    );
    db.prepare("DELETE FROM rate_limits WHERE started_at < ?").run(now - HOUR);
  };
  prune();
  return {
    db,
    prune,
    consumeRateLimit(address: string, now = Date.now(), limit = 5) {
      const key = createHmac("sha256", secret).update(address).digest("hex");
      // One atomic upsert also works across processes sharing this SQLite file.
      const row = db
        .prepare(
          `INSERT INTO rate_limits(key, started_at, count) VALUES (?, ?, 1)
        ON CONFLICT(key) DO UPDATE SET
          count = CASE WHEN rate_limits.started_at <= ? THEN 1 ELSE rate_limits.count + 1 END,
          started_at = CASE WHEN rate_limits.started_at <= ? THEN excluded.started_at ELSE rate_limits.started_at END
        RETURNING count, started_at`,
        )
        .get(key, now, now - HOUR, now - HOUR) as {
        count: number;
        started_at: number;
      };
      return {
        allowed: row.count <= limit,
        retryAfter: Math.max(
          1,
          Math.ceil((row.started_at + HOUR - now) / 1000),
        ),
      };
    },
    save(inquiry: Inquiry) {
      const id = randomUUID();
      db.prepare(
        "INSERT INTO inquiries (id, created_at, name, email, company, type, budget, details, consent_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        id,
        Date.now(),
        inquiry.name,
        inquiry.email,
        inquiry.company,
        inquiry.type,
        inquiry.budget,
        inquiry.details,
        "2026-10-18",
      );
      return id;
    },
    pending() {
      return db
        .prepare(
          "SELECT * FROM inquiries WHERE notified_at IS NULL ORDER BY created_at LIMIT 50",
        )
        .all() as unknown as StoredInquiry[];
    },
    markNotified(id: string) {
      db.prepare("UPDATE inquiries SET notified_at = ? WHERE id = ?").run(
        Date.now(),
        id,
      );
    },
    close() {
      db.close();
    },
  };
}

export interface StoredInquiry {
  id: string;
  created_at: number;
  name: string;
  email: string;
  company: string;
  type: string;
  budget: string;
  details: string;
  consent_version: string;
  notified_at: number | null;
}
export type Store = ReturnType<typeof openStore>;
