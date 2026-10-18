import { homedir } from "node:os";
import { join, resolve } from "node:path";
import site from "../site.config.json" with { type: "json" };

export const OFFICIAL_SITE_URL = site.url;

export function isProduction(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV !== "development" && env.NODE_ENV !== "test";
}

export function getSiteUrl(env: NodeJS.ProcessEnv = process.env) {
  const fallback = isProduction(env)
    ? OFFICIAL_SITE_URL
    : `http://localhost:${env.PORT?.trim() || "3000"}`;
  const parsed = new URL(env.SITE_URL?.trim() || fallback);
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password ||
    (isProduction(env) &&
      (parsed.protocol !== "https:" ||
        ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)))
  )
    throw new Error(
      "SITE_URL must be a plain origin; production requires a public HTTPS origin.",
    );
  return parsed.origin;
}

export function getDatabasePath(
  env: NodeJS.ProcessEnv = process.env,
  home = homedir(),
) {
  const configured = env.DATABASE_PATH?.trim();
  if (configured)
    return configured === ":memory:" ? configured : resolve(configured);
  return isProduction(env)
    ? join(home, ".local", "share", "vital-design-source", "inquiries.sqlite")
    : resolve("data/inquiries.sqlite");
}
