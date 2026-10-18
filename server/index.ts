import "dotenv/config";
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createApp } from "./app";
import { createNotifier } from "./notifications";
import { openStore } from "./store";
import { getDatabasePath, getSiteUrl, isProduction } from "./config";

process.umask(0o077);
const production = isProduction();
const port = Number(process.env.PORT?.trim() || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT must be an integer between 1 and 65535.");
const siteUrl = getSiteUrl();
const parsed = new URL(siteUrl);
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
const store = openStore(getDatabasePath(), process.env.RATE_LIMIT_SECRET);
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
server.listen(port, process.env.HOST?.trim() || "0.0.0.0", () => {
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
