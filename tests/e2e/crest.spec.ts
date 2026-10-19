import { test, expect } from "@playwright/test";

test("keeps the vector identity and navigation usable without WebGL", async ({
  page,
  request,
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
  await expect(crest).toHaveAttribute("data-finish", "silver-translucent");
  await expect(crest.locator("img")).toHaveAttribute(
    "src",
    "/assets/brand/vital-crest-aurora.svg",
  );
  await expect(crest.locator("img")).toBeVisible();
  await expect
    .poll(() =>
      crest
        .locator("img")
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  const response = await request.get("/assets/brand/vital-crest-aurora.svg");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
  const alpha = await page.evaluate(
    (svg) => {
      const document = new DOMParser().parseFromString(svg, "image/svg+xml");
      return {
        paths: Array.from(document.querySelectorAll("path"), (path) => ({
          face: Number(path.getAttribute("fill-opacity") ?? 1),
          edge: Number(path.getAttribute("stroke-opacity") ?? 1),
        })),
        overallOpacity: Array.from(
          document.querySelectorAll("[opacity]"),
          (element) => Number(element.getAttribute("opacity")),
        ),
        fillStops: Array.from(
          document.querySelectorAll("#silver stop"),
          (stop) => Number(stop.getAttribute("stop-opacity") ?? 1),
        ),
        overrides: document.querySelectorAll(
          "style, [style], mask, [mask], filter, [filter]",
        ).length,
      };
    },
    await response.text(),
  );
  expect(alpha.paths).toHaveLength(24);
  expect(alpha.overrides).toBe(0);
  expect(alpha.fillStops.length).toBeGreaterThan(0);
  expect(
    [...alpha.overallOpacity, ...alpha.fillStops].every(
      (opacity) => opacity === 1,
    ),
  ).toBe(true);
  const translucentPaths = new Set([7, 8, 18, 19, 20, 21, 22, 23]);
  for (const [index, path] of alpha.paths.entries()) {
    for (const opacity of [path.face, path.edge]) {
      if (translucentPaths.has(index)) {
        expect(opacity).toBeGreaterThanOrEqual(0.8);
        expect(opacity).toBeLessThan(1);
      } else {
        expect(opacity).toBe(1);
      }
    }
  }
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

test("pauses the silver sheen, resumes its progress, and settles after one pass", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "The shared sheen lifecycle only needs one browser journey.",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const available = await page.evaluate(() =>
    Boolean(document.createElement("canvas").getContext("webgl2")),
  );
  test.skip(!available, "WebGL 2 is unavailable in this browser.");
  const crest = page.locator(".crest-sculpture");
  await expect(crest).toHaveAttribute("data-renderer", "webgl");
  await expect(crest).toHaveAttribute("data-finish", "silver-translucent");
  await expect(crest).toHaveAttribute("data-sheen", "paused");
  const glHealth = () =>
    crest.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
      const gl = canvas.getContext("webgl2");
      return { lost: gl?.isContextLost(), error: gl?.getError() };
    });
  expect(await glHealth()).toEqual({ lost: false, error: 0 });

  // React to rendered progress in the browser: protocol round trips must not
  // consume this finite pass while a software GPU is busy drawing it.
  const lifecycle = await crest.evaluate(async (element) => {
    const read = () => ({
      state: (element as HTMLElement).dataset.sheen,
      progress: Number((element as HTMLElement).dataset.sheenProgress),
    });
    type Snapshot = ReturnType<typeof read>;
    const waitFor = (
      label: string,
      predicate: (value: Snapshot) => boolean,
      timeout = 5000,
    ) =>
      new Promise<Snapshot>((resolve, reject) => {
        const observer = new MutationObserver(check);
        const timer = setTimeout(() => {
          observer.disconnect();
          reject(new Error(`${label}: ${JSON.stringify(read())}`));
        }, timeout);
        function check() {
          const value = read();
          if (!predicate(value)) return;
          clearTimeout(timer);
          observer.disconnect();
          resolve(value);
        }
        observer.observe(element, {
          attributes: true,
          attributeFilter: ["data-sheen", "data-sheen-progress"],
        });
        check();
      });
    const delay = () => new Promise((resolve) => setTimeout(resolve, 250));
    const toggle = (name: string) => {
      const button = document.querySelector<HTMLButtonElement>(
        `button[aria-label="${name} hero motion"]`,
      );
      if (!button) throw new Error(`Missing ${name} hero motion button.`);
      button.click();
    };
    const scroll = (selector: string) =>
      document
        .querySelector(selector)!
        .scrollIntoView({ behavior: "instant", block: "start" });
    const holds: Array<{ reason: string; before: Snapshot; after: Snapshot }> =
      [];
    const resumes: Array<{
      reason: string;
      minimum: number;
      first: Snapshot;
      advanced: Snapshot;
    }> = [];
    const hold = async (reason: string) => {
      const before = await waitFor(reason, (value) => value.state === "paused");
      await delay();
      const after = read();
      holds.push({ reason, before, after });
      return after.progress;
    };
    const advance = async (reason: string, minimum: number) => {
      const first = await waitFor(reason, (value) => value.state === "running");
      const advanced = await waitFor(
        reason,
        (value) =>
          value.progress > first.progress + 0.01 || value.state === "settled",
      );
      resumes.push({ reason, minimum, first, advanced });
    };
    const initial = read();
    toggle("Resume");
    await advance("explicit play", 0);
    toggle("Pause");
    const manualPause = await hold("manual pause");
    scroll("#contact");
    await hold("manual pause offscreen");
    scroll(".hero");
    await hold("manual pause on return");
    toggle("Resume");
    await advance("manual resume", manualPause);
    scroll("#contact");
    const offscreenPause = await hold("automatic offscreen pause");
    scroll(".hero");
    await advance("offscreen resume", offscreenPause);
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    const hiddenPause = await hold("hidden document pause");
    Reflect.deleteProperty(document, "hidden");
    Reflect.deleteProperty(document, "visibilityState");
    document.dispatchEvent(new Event("visibilitychange"));
    await advance("foreground resume", hiddenPause);
    const settled = await waitFor(
      "finite pass completion",
      (value) => value.state === "settled",
      12_000,
    );
    toggle("Pause");
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    toggle("Resume");
    // Allow the control's React updates to commit, but never wait out a replay.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const afterToggle = read();
    await delay();
    return {
      initial,
      holds,
      resumes,
      manualPause,
      settled,
      afterToggle,
      final: read(),
    };
  });
  expect(lifecycle.initial).toEqual({ state: "paused", progress: 0 });
  for (const hold of lifecycle.holds) {
    expect(hold.after, hold.reason).toEqual(hold.before);
    expect(hold.before.state, hold.reason).toBe("paused");
    expect(hold.before.progress, hold.reason).toBeLessThan(1);
  }
  for (const hold of lifecycle.holds.filter(({ reason }) =>
    reason.startsWith("manual"),
  ))
    expect(hold.after.progress, hold.reason).toBe(lifecycle.manualPause);
  for (const resume of lifecycle.resumes) {
    expect(resume.first.progress, resume.reason).toBeGreaterThanOrEqual(
      resume.minimum,
    );
    expect(resume.advanced.progress, resume.reason).toBeGreaterThan(
      resume.first.progress,
    );
    expect(resume.advanced.progress, resume.reason).toBeLessThanOrEqual(1);
  }
  for (const settled of [
    lifecycle.settled,
    lifecycle.afterToggle,
    lifecycle.final,
  ])
    expect(settled).toEqual({ state: "settled", progress: 1 });
  expect(await glHealth()).toEqual({ lost: false, error: 0 });
  expect(errors).toEqual([]);
});
