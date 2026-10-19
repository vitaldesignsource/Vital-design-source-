import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer, request, type Server } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createApp } from "../server/app";
import { openStore, type Store } from "../server/store";
import { projects } from "../src/lib/content";
import {
  getProjectFromPath,
  projectPath,
  projectRoutes,
} from "../src/lib/project-routes";

describe("project path contract", () => {
  it("resolves every known project with one optional trailing slash", () => {
    expect(projectRoutes).toHaveLength(8);
    expect(new Set(projectRoutes.map((route) => route.path)).size).toBe(8);
    for (const project of projects) {
      const path = `/work/${project.id}`;
      expect(projectPath(project)).toBe(path);
      expect(getProjectFromPath(path)).toBe(project);
      expect(getProjectFromPath(`${path}/`)).toBe(project);
    }
  });

  it.each([
    "/",
    "/work",
    "/work/",
    "/work/unknown",
    "/work/AETHERICA",
    "/work/aetherica//",
    "/work//aetherica",
    "/work/aetherica/index.html",
    "/work/aetherica?preview=1",
    "/work/aetherica#preview",
    "/work/%61etherica",
    "/work/../work/aetherica",
    "/work/%2e%2e/work/aetherica",
    "/work/aetherica/../astera",
    "https://vitaldesignsource.com/work/aetherica",
  ])("rejects unknown or noncanonical input: %s", (path) => {
    expect(getProjectFromPath(path)).toBeUndefined();
  });
});

describe("generated project route boundary", () => {
  let directory: string;
  let server: Server;
  let store: Store;
  let base: string;
  const homeSchema = JSON.stringify({ "@type": "WebSite", name: "Studio" });
  const foreignSchema = JSON.stringify({ "@type": "WebPage", name: "Private" });
  const projectSchemas = projects.map((project) =>
    JSON.stringify({ "@type": "CreativeWork", name: project.name }),
  );
  const hash = (schema: string) =>
    `'sha256-${createHash("sha256").update(schema).digest("base64")}'`;
  const html = (name: string, schema?: string) =>
    `<!doctype html><html lang="en"><head><title>${name}</title>${schema ? `<script type="application/ld+json">${schema}</script>` : ""}</head><body><h1>${name}</h1></body></html>`;

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), "vital-project-routes-"));
    const write = (file: string, value: string) => {
      const target = join(directory, file);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, value);
    };
    write("index.html", html("Studio", homeSchema));
    write("privacy/index.html", html("Privacy notice"));
    write("404.html", html("Page not found"));
    for (const [index, project] of projects.entries())
      write(
        `work/${project.id}/index.html`,
        html(project.name, projectSchemas[index]),
      );
    // Fixtures deliberately include files that must never enter the public
    // project route or the JSON-LD hash allowlist.
    write("work/unknown/index.html", html("Private draft", foreignSchema));
    write("work/aetherica/private.json", '{"private":true}');
    write("work/source.ts", "private source");
    store = openStore(":memory:");
    server = createServer(
      createApp({
        store,
        distDir: directory,
        siteUrl: "https://studio.example",
        production: true,
      }),
    );
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Project route test server failed to bind.");
    base = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    store.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it("serves all eight exact project documents and their trailing-slash aliases", async () => {
    for (const project of projects) {
      for (const suffix of ["", "/", "?preview=1"]) {
        const response = await fetch(`${base}${projectPath(project)}${suffix}`);
        expect(response.status).toBe(200);
        expect(response.headers.get("cache-control")).toBe("no-cache");
        expect(response.headers.get("content-type")).toContain("text/html");
        expect(await response.text()).toContain(`<h1>${project.name}</h1>`);
      }
    }
    const head = await fetch(`${base}${projectPath(projects[0])}`, {
      method: "HEAD",
    });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");
  });

  it("authorizes only home and known project JSON-LD hashes without relaxing CSP", async () => {
    for (const path of [
      "/",
      "/api/health",
      ...projectRoutes.map((route) => route.path),
    ]) {
      const response = await fetch(`${base}${path}`);
      const policy = response.headers.get("content-security-policy") || "";
      const scriptSrc = policy
        .split(";")
        .find((part) => part.startsWith("script-src "));
      expect(scriptSrc).toBeDefined();
      const tokens = scriptSrc!.trim().split(/\s+/).slice(1);
      expect(new Set(tokens)).toEqual(
        new Set(["'self'", hash(homeSchema), ...projectSchemas.map(hash)]),
      );
      expect(policy).not.toContain("unsafe-inline");
      expect(policy).not.toContain(hash(foreignSchema));
      expect(policy).toContain("object-src 'none'");
      expect(policy).toContain("frame-ancestors 'none'");
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    }
  });

  it("returns the real 404 for unknown, private, encoded, and traversal project requests", async () => {
    const rawRequest = (path: string) =>
      new Promise<{ status: number | undefined; body: string }>(
        (resolve, reject) => {
          const req = request(`${base}/`, { path }, (response) => {
            let body = "";
            response.setEncoding("utf8");
            response.on("data", (chunk: string) => {
              body += chunk;
            });
            response.on("end", () =>
              resolve({ status: response.statusCode, body }),
            );
          });
          req.on("error", reject);
          req.end();
        },
      );
    for (const path of [
      "/work",
      "/work/unknown",
      "/work/unknown/index.html",
      "/work/aetherica/index.html",
      "/work/aetherica/private.json",
      "/work/source.ts",
      "/work/aetherica//",
      "/work/%61etherica",
      "/%77ork/aetherica/index.html",
      "/work%2faetherica/index.html",
      "/work/aetherica/../astera",
      "/work/%2e%2e/index.html",
      "/./work/aetherica/index.html",
      "/Work/aetherica",
      "/src/App.tsx",
      "/server/store.ts",
      "/data/inquiries.sqlite",
      "/.env",
    ]) {
      const response = await rawRequest(path);
      expect(response.status, path).toBe(404);
      expect(response.body, path).toContain("<h1>Page not found</h1>");
      expect(response.body, path).not.toContain("Private draft");
      expect(response.body, path).not.toContain('"private":true');
    }
    expect(
      (await fetch(`${base}${projectPath(projects[0])}`, { method: "POST" }))
        .status,
    ).toBe(404);
  });
});
