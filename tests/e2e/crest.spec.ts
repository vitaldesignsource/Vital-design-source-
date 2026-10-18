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
