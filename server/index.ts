import "dotenv/config";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createApp } from "./app";
import { createNotifier } from "./notifications";
import { openStore } from "./store";

process.umask(0o077);
const production = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 3000);
const siteUrl = process.env.SITE_URL || `http://localhost:${port}`;
const secret =
  process.env.RATE_LIMIT_SECRET ||
  (production ? "" : randomBytes(32).toString("hex"));
if (!secret || secret.length < 32)
  throw new Error("Set RATE_LIMIT_SECRET to at least 32 random characters.");
const parsed = new URL(siteUrl);
if (
  production &&
  (parsed.protocol !== "https:" ||
    parsed.pathname !== "/" ||
    ["localhost", "127.0.0.1"].includes(parsed.hostname))
)
  throw new Error("Production SITE_URL must be the public HTTPS origin.");
const buildConfigPath = resolve("dist/build-config.json");
if (!existsSync(buildConfigPath))
  throw new Error("Run npm run build before starting the server.");
const buildConfig = JSON.parse(readFileSync(buildConfigPath, "utf8")) as {
  siteUrl: string;
};
if (production && buildConfig.siteUrl !== parsed.origin)
  throw new Error(
    "SITE_URL differs from the built metadata. Rebuild with the same SITE_URL.",
  );
const store = openStore(
  process.env.DATABASE_PATH || "./data/inquiries.sqlite",
  secret,
);
const notifier = createNotifier(store);
if (!notifier.configured)
  console.info(
    "Email notifications are off. Inquiries are saved privately; use npm run inquiries to review them.",
  );
const app = createApp({
  store,
  siteUrl,
  production,
  trustProxy: process.env.TRUST_PROXY === "1",
  onSaved: () => {
    void notifier.flush();
  },
});
const server = createServer(
  { requestTimeout: 30000, headersTimeout: 10000, maxHeaderSize: 16384 },
  app,
);
const maintenance = setInterval(() => {
  store.prune();
  void notifier.flush();
}, 60000);
maintenance.unref();
void notifier.flush();
server.listen(port, process.env.HOST || "0.0.0.0", () => {
  console.info(`Vital Design Source listening on port ${port}.`);
});
function shutdown() {
  clearInterval(maintenance);
  server.close(() => {
    store.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
