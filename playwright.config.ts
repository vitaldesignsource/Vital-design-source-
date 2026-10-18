import { defineConfig, devices } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    // Exercise the production assets already built by validate. The portable
    // entry's clean-install/automatic-build path has its own deployment check.
    command: "node build/server/index.mjs",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: false,
    env: {
      NODE_ENV: "test",
      SITE_URL: "http://localhost:3000",
      DATABASE_PATH: join(tmpdir(), `vital-e2e-${randomUUID()}.sqlite`),
      RATE_LIMIT_SECRET: "automated-browser-tests-only-secret-32-chars",
    },
  },
});
