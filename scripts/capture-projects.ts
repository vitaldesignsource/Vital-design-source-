import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { projects } from "../src/lib/content";

// Refreshes actual public website previews. Run only when refreshing portfolio assets.
// NODE_USE_ENV_PROXY=1 lets Node honor a managed environment's proxy and CA trust.
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  headless: true,
});
await mkdir("source-assets/projects", { recursive: true });
try {
  const results = [];
  for (const project of projects) {
    if (project.previewLabel) {
      console.info(
        `Preserving ${project.name}: ${project.previewLabel}. See docs/assets.md.`,
      );
      continue;
    }
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1020 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    // Use Node's trusted fetch transport in environments where Chromium has a separate CA store.
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (!["GET", "HEAD"].includes(request.method())) {
        await route.abort();
        return;
      }
      try {
        const response = await fetch(request.url(), {
          method: request.method(),
          signal: AbortSignal.timeout(20000),
        });
        const headers = Object.fromEntries(response.headers);
        delete headers["content-encoding"];
        delete headers["content-length"];
        await route.fulfill({
          status: response.status,
          headers,
          body: Buffer.from(await response.arrayBuffer()),
        });
      } catch {
        await route.abort();
      }
    });
    try {
      await page.goto(project.url, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await page
        .waitForLoadState("networkidle", { timeout: 10000 })
        .catch(() => {});
      const title = await page.title();
      if (/robot challenge|just a moment|access denied|sign in/i.test(title)) {
        console.info(
          `Preserving ${project.name}: remote access gate detected.`,
        );
        continue;
      }
      await page.screenshot({
        path: `source-assets/projects/${project.image}.png`,
      });
      const result = {
        name: project.name,
        url: project.url,
        title,
        capturedAt: new Date().toISOString(),
      };
      results.push(result);
      console.info(result);
    } finally {
      await page.close();
    }
  }
  await writeFile(
    "source-assets/projects/capture-log.json",
    JSON.stringify(results, null, 2) + "\n",
  );
} finally {
  await browser.close();
}
