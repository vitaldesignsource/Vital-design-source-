import { test, expect } from "@playwright/test";

test("keeps the vector identity and navigation usable without WebGL", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl") || type === "experimental-webgl")
        return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const crest = page.locator(".crest-sculpture");
  await expect(crest.locator("img")).toBeVisible();
  await expect
    .poll(() =>
      crest
        .locator("img")
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Pause hero motion" }).click();
  await expect(crest).toHaveAttribute("data-renderer", "vector");
  await page
    .locator(".hero-actions")
    .getByRole("link", { name: "Let’s create something" })
    .click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator("#contact")).toBeInViewport();
  expect(errors).toEqual([]);
});

test("respects reduced motion and supports optional 3D rendering and context loss", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const crest = page.locator(".crest-sculpture");
  await expect(
    page.getByRole("button", { name: "Resume hero motion" }),
  ).toBeVisible();
  const available = await page.evaluate(() =>
    Boolean(document.createElement("canvas").getContext("webgl2")),
  );
  if (available) {
    await expect(crest).toHaveAttribute("data-renderer", "webgl");
    await expect(crest).toHaveAttribute("data-motion", "paused");
    await page.getByRole("button", { name: "Resume hero motion" }).click();
    await expect(crest).toHaveAttribute("data-motion", "running");
    await page.getByRole("button", { name: "Pause hero motion" }).click();
    await expect(crest).toHaveAttribute("data-motion", "paused");
    await crest
      .locator("canvas")
      .dispatchEvent("webglcontextlost", { cancelable: true });
    await expect(crest).toHaveAttribute("data-renderer", "vector");
    await expect(crest.locator("img")).toBeVisible();
  } else {
    await expect(crest.locator("img")).toBeVisible();
    await expect(crest).toHaveAttribute("data-renderer", "vector");
  }
});

test("resolves a Retina crest clearly and bounds its framebuffer after resize", async ({
  browser,
  baseURL,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "This independent high-density context only needs to run once.",
  );
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    reducedMotion: "reduce",
  });
  try {
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    const available = await page.evaluate(() =>
      Boolean(document.createElement("canvas").getContext("webgl2")),
    );
    test.skip(!available, "WebGL 2 is unavailable in this browser.");

    const crest = page.locator(".crest-sculpture");
    await crest.scrollIntoViewIfNeeded();
    await expect(crest).toHaveAttribute("data-renderer", "webgl");
    await expect(crest).toHaveAttribute("data-motion", "paused");
    const canvas = crest.locator("canvas");
    const framebuffer = () =>
      canvas.evaluate((element: HTMLCanvasElement) => {
        const gl = element.getContext("webgl2");
        if (!gl) throw new Error("The crest has no WebGL 2 context.");
        const bounds = element.getBoundingClientRect();
        return {
          width: gl.drawingBufferWidth,
          height: gl.drawingBufferHeight,
          cssWidth: bounds.width,
          cssHeight: bounds.height,
          contextLost: gl.isContextLost(),
          error: gl.getError(),
          overflow: document.documentElement.scrollWidth - window.innerWidth,
        };
      });

    const mobile = await framebuffer();
    // Fine vector strokes need more than two physical pixels per CSS pixel.
    expect(mobile.width / mobile.cssWidth).toBeGreaterThan(2);
    expect(mobile.height / mobile.cssHeight).toBeGreaterThan(2);
    expect(mobile.contextLost).toBe(false);
    expect(mobile.error).toBe(0);
    expect(mobile.overflow).toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 1440, height: 1000 });
    await crest.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        canvas.evaluate((element: HTMLCanvasElement) => element.width),
      )
      .toBeGreaterThan(mobile.width);
    const desktop = await framebuffer();
    expect(desktop.cssWidth).toBeGreaterThan(mobile.cssWidth);
    expect(desktop.width).toBeGreaterThan(desktop.cssWidth);
    expect(desktop.height).toBeGreaterThan(desktop.cssHeight);
    expect(desktop.width * desktop.height).toBeLessThanOrEqual(2_400_000);
    expect(desktop.contextLost).toBe(false);
    expect(desktop.error).toBe(0);
    expect(desktop.overflow).toBeLessThanOrEqual(1);
    await expect(crest).toHaveAttribute("data-renderer", "webgl");
    await expect(crest).toHaveAttribute("data-motion", "paused");
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
