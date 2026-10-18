import process from "node:process";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";
import { config } from "dotenv";
import site from "./site.config.json" with { type: "json" };

if (Number(process.versions.node.split(".")[0]) !== 24)
  throw new Error(
    "Vital Design Source requires Node.js 24. Select 24.x in your hosting settings.",
  );

// Keep the same root when a host launches the entry from another directory.
process.chdir(fileURLToPath(new URL(".", import.meta.url)));
config({ quiet: true });
process.env.NODE_ENV ||= "production";

const fallback = ["development", "test"].includes(process.env.NODE_ENV)
  ? `http://localhost:${process.env.PORT?.trim() || "3000"}`
  : site.url;
const expectedOrigin = new URL(process.env.SITE_URL?.trim() || fallback).origin;
const artifacts = [
  "dist/index.html",
  "dist/build-config.json",
  "build/server/index.mjs",
  "build/server/inquiries.mjs",
];
let needsBuild = artifacts.some((path) => !existsSync(path));
if (!needsBuild) {
  try {
    needsBuild =
      JSON.parse(readFileSync("dist/build-config.json", "utf8")).siteUrl !==
      expectedOrigin;
  } catch {
    needsBuild = true;
  }
}

// Hosts with a build phase use the existing output. A fresh source checkout can
// also start directly; a failed build aborts startup instead of serving source.
if (needsBuild)
  execFileSync(process.execPath, ["--import", "tsx", "scripts/build.ts"], {
    stdio: "inherit",
  });

await import("./build/server/index.mjs");
