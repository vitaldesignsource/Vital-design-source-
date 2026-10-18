import { describe, expect, it } from "vitest";
import { join, resolve } from "node:path";
import {
  getDatabasePath,
  getSiteUrl,
  isProduction,
  OFFICIAL_SITE_URL,
} from "../server/config";

describe("deployment defaults", () => {
  it("uses the official HTTPS origin and production security without environment setup", () => {
    expect(isProduction({})).toBe(true);
    expect(getSiteUrl({})).toBe("https://vitaldesignsource.com");
    expect(OFFICIAL_SITE_URL).toBe("https://vitaldesignsource.com");
    expect(getSiteUrl({ NODE_ENV: "", SITE_URL: "  " })).toBe(
      OFFICIAL_SITE_URL,
    );
  });

  it("keeps default production storage in private user data outside the release", () => {
    const home = resolve("/private/account-home");
    const expected = join(
      home,
      ".local/share/vital-design-source/inquiries.sqlite",
    );
    expect(getDatabasePath({}, home)).toBe(expected);
    expect(getDatabasePath({ DATABASE_PATH: " " }, home)).toBe(expected);
    expect(
      getDatabasePath(
        { DATABASE_PATH: "/private/volume/inquiries.sqlite" },
        home,
      ),
    ).toBe("/private/volume/inquiries.sqlite");
  });

  it("retains explicit local development and storage overrides", () => {
    expect(isProduction({ NODE_ENV: "development" })).toBe(false);
    expect(isProduction({ NODE_ENV: "test" })).toBe(false);
    expect(getSiteUrl({ NODE_ENV: "development", PORT: "5173" })).toBe(
      "http://localhost:5173",
    );
    expect(getDatabasePath({ NODE_ENV: "development" })).toBe(
      resolve("data/inquiries.sqlite"),
    );
    expect(getDatabasePath({ DATABASE_PATH: ":memory:" })).toBe(":memory:");
    expect(getSiteUrl({ SITE_URL: "https://preview.example/" })).toBe(
      "https://preview.example",
    );
  });

  it.each([
    "http://studio.example",
    "https://localhost",
    "https://127.0.0.1",
    "https://[::1]",
    "https://studio.example/path",
    "https://studio.example/?query=1",
    "https://studio.example/#fragment",
    "https://user:password@studio.example",
    "file:///private/data",
    "not a URL",
  ])("rejects an invalid explicit production origin: %s", (SITE_URL) => {
    expect(() => getSiteUrl({ SITE_URL })).toThrow();
  });
});
