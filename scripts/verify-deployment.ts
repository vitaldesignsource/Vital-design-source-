import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

// Exercise a real production-only checkout without copying local configuration,
// generated output, credentials, or inquiry data into the disposable fixture.
const repository = fileURLToPath(new URL("../", import.meta.url));
const fixture = mkdtempSync(join(tmpdir(), "vital-deployment-"));
const app = join(fixture, "app");
const home = join(fixture, "home");
const launch = join(fixture, "launch");
const database = join(
  home,
  ".local",
  "share",
  "vital-design-source",
  "inquiries.sqlite",
);
const officialOrigin = "https://vitaldesignsource.com";
const configurationKeys = [
  "NODE_ENV",
  "SITE_URL",
  "RATE_LIMIT_SECRET",
  "DATABASE_PATH",
  "HOST",
  "PORT",
  "TRUST_PROXY",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "INQUIRY_FROM",
  "INQUIRY_TO",
];
const environment: NodeJS.ProcessEnv = { ...process.env, HOME: home };
for (const key of configurationKeys) delete environment[key];
let server: ChildProcess | undefined;
let serverOutput = "";
let port: number;
const pause = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function run(
  label: string,
  executable: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
) {
  const result = spawnSync(executable, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: 120000,
    maxBuffer: 4 * 1024 * 1024,
  });
  // Keep subprocess output private, including the operator CLI's inquiry rows.
  assert(
    !result.error && result.status === 0,
    `${label} failed (exit status ${result.status ?? "unavailable"}).`,
  );
  return result.stdout;
}

const request = (path: string, init?: RequestInit) =>
  fetch(`http://127.0.0.1:${port}${path}`, {
    ...init,
    signal: AbortSignal.timeout(1000),
  });

const requireReturned = "Deployment entry returned synchronously from require.";

async function start(
  env: NodeJS.ProcessEnv,
  mode: "require" | "direct" = "require",
) {
  serverOutput = "";
  const entry = join(app, "server.js");
  // Hostinger's managed loader calls require(), so top-level-await entry
  // graphs must fail this check even when direct `node server.js` succeeds.
  const args =
    mode === "require"
      ? [
          "-e",
          `require(process.argv[1]); console.info(${JSON.stringify(requireReturned)});`,
          entry,
        ]
      : [entry];
  server = spawn(process.execPath, args, {
    cwd: launch,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const capture = (data: Buffer) => {
    serverOutput = (serverOutput + data.toString()).slice(-65536);
  };
  server.stdout?.on("data", capture);
  server.stderr?.on("data", capture);
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    assert(
      server.exitCode === null && server.signalCode === null,
      "Production entry exited before becoming healthy.",
    );
    try {
      if (
        (await request("/api/health")).ok &&
        (mode === "direct" || serverOutput.includes(requireReturned))
      )
        return;
    } catch {
      // The build completes before the production server opens its port.
    }
    await pause(100);
  }
  throw new Error("Production entry did not become healthy within 30 seconds.");
}

async function stop() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  const exited = once(server, "exit");
  server.kill("SIGTERM");
  const timeout = setTimeout(() => server?.kill("SIGKILL"), 3000);
  try {
    await exited;
  } finally {
    clearTimeout(timeout);
  }
}

async function verifySite() {
  const response = await request("/");
  assert.equal(response.status, 200, "The home page loads.");
  const html = await response.text();
  assert(html.includes("<main"), "The home page is pre-rendered.");
  assert(html.includes("Design with a pulse."), "Official content is present.");
  assert(!html.includes("<!--app-html-->"), "No source placeholder is served.");
  for (const metadata of [
    `<link rel="canonical" href="${officialOrigin}/"`,
    `<meta property="og:url" content="${officialOrigin}/"`,
    `<meta property="og:image" content="${officialOrigin}/assets/og-neural.jpg"`,
    '<meta name="robots" content="index,follow"',
    `${officialOrigin}/#organization`,
  ])
    assert(
      html.includes(metadata),
      "Production metadata uses the official URL.",
    );
  const javascript = html.match(/src="([^"]+\.js)"/)?.[1];
  const stylesheet = html.match(/href="([^"]+\.css)"/)?.[1];
  assert(javascript && stylesheet, "Built JavaScript and CSS are referenced.");
  for (const [path, mime] of [
    [javascript, /javascript/],
    [stylesheet, /text\/css/],
    ["/assets/brand/vital-logo-original.webp", /image\/webp/],
  ] as const) {
    const asset = await request(path);
    assert.equal(asset.status, 200, "A production asset loads.");
    assert.match(asset.headers.get("content-type") || "", mime);
  }
  const sitemap = await request("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  assert((await sitemap.text()).includes(`<loc>${officialOrigin}/</loc>`));
  const robots = await request("/robots.txt");
  assert.equal(robots.status, 200);
  assert(
    (await robots.text()).includes(`Sitemap: ${officialOrigin}/sitemap.xml`),
  );
  const health = await request("/api/health");
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { ok: true });
  assert.match(
    health.headers.get("content-security-policy") || "",
    /frame-ancestors 'none'/,
  );
  assert.match(
    health.headers.get("strict-transport-security") || "",
    /max-age=31536000/,
  );
  assert.equal(health.headers.get("x-content-type-options"), "nosniff");
  for (const path of [
    "/src/main.tsx",
    "/server.js",
    "/server/index.ts",
    "/site.config.json",
    "/.env",
    "/data/inquiries.sqlite",
    "/.local/share/vital-design-source/inquiries.sqlite",
  ])
    assert.equal(
      (await request(path)).status,
      404,
      "Private source is not served.",
    );
}

const inquiry = {
  name: "Deployment Test",
  email: "deployment-test@example.invalid",
  company: "",
  type: "Website & development",
  budget: "Not sure yet",
  details: "Synthetic deployment verification of private inquiry persistence.",
  website: "",
  consent: true,
};
const submit = (origin: string) =>
  request("/api/inquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(inquiry),
  });

function inspectStore() {
  const store = new DatabaseSync(database, { readOnly: true });
  try {
    const count = store
      .prepare("SELECT COUNT(*) AS total FROM inquiries")
      .get()?.total;
    const secret = store
      .prepare("SELECT value FROM app_settings WHERE key = 'rate_limit_secret'")
      .get()?.value;
    assert(
      typeof secret === "string" && /^[0-9a-f]{64}$/.test(secret),
      "A private random rate-limit key is generated automatically.",
    );
    return { count, secret };
  } finally {
    store.close();
  }
}

try {
  mkdirSync(home, { mode: 0o700 });
  mkdirSync(launch);
  for (const path of [
    "package.json",
    "package-lock.json",
    "site.config.json",
    "server.js",
    "index.html",
    "vite.config.ts",
    "tsconfig.json",
    "src",
    "server",
    "public",
    "scripts/build.ts",
    "scripts/inquiries.ts",
  ])
    cpSync(join(repository, path), join(app, path), {
      recursive: true,
      filter: (source) =>
        ![".git", "data", "private", "node_modules"].includes(
          basename(source),
        ) &&
        !basename(source).startsWith(".env") &&
        !lstatSync(source).isSymbolicLink(),
    });
  run(
    "Production-only dependency installation",
    process.platform === "win32" ? "npm.cmd" : "npm",
    [
      "ci",
      "--omit=dev",
      "--no-audit",
      "--no-fund",
      "--cache",
      join(fixture, "npm-cache"),
    ],
    app,
    environment,
  );
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const address = reservation.address();
  assert(address && typeof address !== "string");
  port = address.port;
  await new Promise<void>((resolve, reject) =>
    reservation.close((error) => (error ? reject(error) : resolve())),
  );
  environment.PORT = String(port);
  environment.HOST = "127.0.0.1";
  assert(!existsSync(join(app, "dist")) && !existsSync(join(app, "build")));
  await start(environment);
  assert(
    serverOutput.includes(`portable Node server for ${officialOrigin}.`),
    "A source checkout builds automatically before serving requests.",
  );
  await verifySite();
  assert.equal((await submit("https://foreign.example")).status, 403);
  assert.equal((await submit(officialOrigin)).status, 201);
  assert.equal(inspectStore().count, 1, "An inquiry is saved before success.");
  for (let index = 1; index < 5; index++)
    assert.equal(
      (
        await submit(
          index === 1 ? "https://www.vitaldesignsource.com" : officialOrigin,
        )
      ).status,
      201,
    );
  const before = inspectStore();
  assert.equal(before.count, 5);
  assert.equal(statSync(database).mode & 0o777, 0o600);
  assert.equal(statSync(join(database, "..")).mode & 0o777, 0o700);
  await stop();

  const blankEnvironment: NodeJS.ProcessEnv = { ...environment };
  for (const key of configurationKeys)
    if (key !== "PORT") blankEnvironment[key] = "";
  // A domain change must rebuild metadata while preserving private inquiries.
  writeFileSync(
    join(app, "dist/build-config.json"),
    JSON.stringify({ siteUrl: "https://old.example" }),
  );
  const homePage = join(app, "dist/index.html");
  writeFileSync(
    homePage,
    readFileSync(homePage, "utf8").replaceAll(
      officialOrigin,
      "https://old.example",
    ),
  );
  await start(blankEnvironment);
  assert(
    serverOutput.includes(`portable Node server for ${officialOrigin}.`),
    "Mismatched build metadata is rebuilt automatically.",
  );
  await verifySite();
  const after = inspectStore();
  assert.equal(after.count, 5, "Saved inquiries survive restarting.");
  assert(
    before.secret === after.secret,
    "The private key survives restarting.",
  );
  const limited = await submit(officialOrigin);
  assert.equal(limited.status, 429, "Rate limits survive restarting.");
  assert(Number(limited.headers.get("retry-after")) > 0);
  assert.equal(inspectStore().count, 5);
  await stop();
  // Keep the standalone Node entry covered alongside the managed require loader.
  await start(blankEnvironment, "direct");
  await verifySite();
  assert.equal(inspectStore().count, 5);
  await stop();
  const output = run(
    "Default inquiry operator CLI",
    process.execPath,
    [join(app, "build/server/inquiries.mjs")],
    launch,
    blankEnvironment,
  );
  const rows: unknown = JSON.parse(output);
  assert(Array.isArray(rows) && rows.length === 5);
  assert(
    rows.every((row: Record<string, unknown>) => row.email === inquiry.email),
    "The operator CLI uses the same default private database.",
  );
  console.info(
    "Deployment verification passed: clean production install, synchronous managed loader, standalone entry, automatic build, default domain, secure inquiries, restart persistence, and operator access.",
  );
} finally {
  await stop();
  rmSync(fixture, { recursive: true, force: true });
}
