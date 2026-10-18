import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const decorSelector = ".aurora-backdrop, .section-contours, .signal-banner";

function animationTime(target: Locator) {
  return target.evaluate((element) => {
    const time = element.getAnimations()[0]?.currentTime;
    return typeof time === "number" ? time : 0;
  });
}

async function expectFrozen(target: Locator) {
  await expect
    .poll(() =>
      target.evaluate((element) =>
        element
          .getAnimations()
          .every(
            (animation) =>
              animation.playState === "paused" && !animation.pending,
          ),
      ),
    )
    .toBe(true);
  const time = await animationTime(target);
  await new Promise((resolve) => setTimeout(resolve, 250));
  expect(await animationTime(target)).toBeCloseTo(time, 0);
  return time;
}

async function expectProgress(target: Locator) {
  const time = await animationTime(target);
  await expect.poll(() => animationTime(target)).toBeGreaterThan(time + 60);
}

async function setHidden(page: Page, hidden: boolean) {
  await page.evaluate((value) => {
    if (value) {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
    } else {
      Reflect.deleteProperty(document, "hidden");
      Reflect.deleteProperty(document, "visibilityState");
    }
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

test.describe("atmosphere", () => {
  test.skip(
    ({ isMobile }) => isMobile,
    "Explicit narrow-screen contexts cover this feature once.",
  );

  test("keeps decorative SVGs local and completes section entrances only once", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const svgs = page.locator(decorSelector).locator("svg");
    await expect(svgs).toHaveCount(5);
    for (const svg of await svgs.all()) {
      await expect(svg).toHaveAttribute("focusable", "false");
      expect(
        await svg.evaluate((element) =>
          Boolean(element.closest('[aria-hidden="true"]')),
        ),
      ).toBe(true);
      await expect(
        svg.locator(
          "a, button, [tabindex]:not([tabindex='-1']), script, image, foreignObject",
        ),
      ).toHaveCount(0);
    }
    const definitions = await svgs.evaluateAll((elements) => {
      const ids: string[] = [];
      const references: string[] = [];
      for (const svg of elements) {
        for (const element of [svg, ...svg.querySelectorAll("*")]) {
          if (element.id) ids.push(element.id);
          for (const attribute of element.attributes) {
            if (["href", "xlink:href", "src"].includes(attribute.name))
              references.push(attribute.value);
            for (const match of attribute.value.matchAll(
              /url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g,
            ))
              references.push(match[1]);
          }
        }
      }
      return { ids, references };
    });
    expect(definitions.ids.length).toBeGreaterThan(0);
    expect(new Set(definitions.ids).size).toBe(definitions.ids.length);
    for (const reference of new Set(definitions.references)) {
      expect(reference).toMatch(/^#/);
      expect(definitions.ids).toContain(reference.slice(1));
    }

    const service = page.locator(".service").first();
    await expect(service).toHaveAttribute("data-reveal-state", "pending");
    await service.scrollIntoViewIfNeeded();
    await expect(service).toHaveAttribute("data-reveal-state", "visible");
    await expect(service).toHaveCSS("opacity", "1");
    await expect
      .poll(() => service.evaluate((element) => element.getAnimations().length))
      .toBe(0);
    await page.locator(".hero").scrollIntoViewIfNeeded();
    await expect(service).not.toBeInViewport();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    await service.scrollIntoViewIfNeeded();
    expect(
      await service.evaluate((element) => ({
        state: (element as HTMLElement).dataset.revealState,
        opacity: getComputedStyle(element).opacity,
        animations: element.getAnimations().length,
      })),
    ).toEqual({ state: "visible", opacity: "1", animations: 0 });
    const form = page.locator(".contact-form-wrap");
    await expect(form).toHaveAttribute("data-reveal-state", "pending");
    await page
      .getByLabel("Your name *")
      .evaluate((element: HTMLInputElement) =>
        element.focus({ preventScroll: true }),
      );
    await expect(form).toHaveAttribute("data-reveal-state", "visible");
    await expect(form).toHaveCSS("opacity", "1");

    const banner = page.locator(".signal-banner");
    await banner.scrollIntoViewIfNeeded();
    await expect(banner).toHaveAttribute("data-motion", "running");
    const passes = await banner.evaluate((element) =>
      element.getAnimations({ subtree: true }).map((animation) => ({
        iterations: animation.effect?.getTiming().iterations,
        end: Number(animation.effect?.getComputedTiming().endTime),
      })),
    );
    expect(passes.length).toBeGreaterThan(0);
    for (const pass of passes) {
      expect(pass.iterations).toBe(1);
      expect(pass.end).toBeLessThan(5000);
    }
    await expect(banner).toHaveAttribute("data-motion", "complete", {
      timeout: 6500,
    });
    await page.locator(".hero").scrollIntoViewIfNeeded();
    await banner.scrollIntoViewIfNeeded();
    await expect(banner).toHaveAttribute("data-motion", "complete");
  });

  test("freezes and resumes real hero animation while retaining manual motion intent", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    const hero = page.locator(".hero");
    const backdrop = page.locator(".aurora-backdrop");
    const ribbons = backdrop.locator(".aurora-ribbons");
    await expect(backdrop).toHaveAttribute("data-motion", "running");
    await expectProgress(ribbons);
    const runningTime = await animationTime(ribbons);
    await page
      .getByRole("button", { name: "Pause hero motion", exact: true })
      .click();
    await expect(backdrop).toHaveAttribute("data-motion", "paused");
    expect(await expectFrozen(ribbons)).toBeGreaterThanOrEqual(runningTime);
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expectFrozen(ribbons);
    await hero.scrollIntoViewIfNeeded();
    await expect(backdrop).toHaveAttribute("data-motion", "paused");
    await expectFrozen(ribbons);

    await page
      .getByRole("button", { name: "Resume hero motion", exact: true })
      .click();
    await expect(backdrop).toHaveAttribute("data-motion", "running");
    await expectProgress(ribbons);
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expect(backdrop).toHaveAttribute("data-motion", "paused");
    await expectFrozen(ribbons);
    await hero.scrollIntoViewIfNeeded();
    await expect(backdrop).toHaveAttribute("data-motion", "running");
    await expectProgress(ribbons);
    await setHidden(page, true);
    await expect(backdrop).toHaveAttribute("data-motion", "paused");
    await expectFrozen(ribbons);
    await setHidden(page, false);
    await expect(backdrop).toHaveAttribute("data-motion", "running");
    await expectProgress(ribbons);
    expect(errors).toEqual([]);
  });

  test("keeps narrow-screen content visible and ambient art static for motion and data preferences", async ({
    browser,
    baseURL,
  }) => {
    for (const preference of [
      { width: 320, reducedMotion: "reduce", saveData: false },
      { width: 390, reducedMotion: "no-preference", saveData: true },
    ] as const) {
      const context = await browser.newContext({
        baseURL,
        viewport: { width: preference.width, height: 844 },
        reducedMotion: preference.reducedMotion,
      });
      try {
        if (preference.saveData) {
          await context.addInitScript(() => {
            Object.defineProperty(navigator, "connection", {
              configurable: true,
              value: Object.assign(new EventTarget(), { saveData: true }),
            });
          });
        }
        const page = await context.newPage();
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto("/");
        await expect(page.locator(".aurora-backdrop")).toHaveAttribute(
          "data-motion",
          "paused",
        );
        await expectFrozen(page.locator(".aurora-ribbons"));
        await expect(page.locator(".signal-banner")).toHaveAttribute(
          "data-motion",
          "static",
        );
        await expect(page.locator('[data-reveal-state="pending"]')).toHaveCount(
          0,
        );
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const accessibility = await new AxeBuilder({ page })
          .include(".hero")
          .include("#work .section-heading")
          .include(".services-intro")
          .include(".contact-intro")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(accessibility.violations).toEqual([]);
        await page.locator(".lab-stage").scrollIntoViewIfNeeded();
        await expect(page.locator(".lab-stage")).toHaveAttribute(
          "data-motion",
          "paused",
        );
        await page.locator(".signal-banner").scrollIntoViewIfNeeded();
        await expect(page.locator(".signal-banner-copy")).toBeVisible();
        await expect(page.locator(".signal-banner")).toHaveAttribute(
          "data-motion",
          "static",
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth - innerWidth,
          ),
        ).toBeLessThanOrEqual(1);
        expect(errors).toEqual([]);
      } finally {
        await context.close();
      }
    }
  });

  test("preserves visible artwork and usable server-rendered content without JavaScript", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 1000 },
    });
    try {
      const page = await context.newPage();
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Ideas beyond ordinary.",
      );
      await expect(page.locator(".aurora-backdrop")).toHaveAttribute(
        "data-motion",
        "paused",
      );
      await expect(page.locator(".aurora-backdrop svg")).toBeVisible();
      await expect(page.locator('[data-reveal-state="pending"]')).toHaveCount(
        0,
      );
      await expect(page.locator(".project")).toHaveCount(8);
      await expect(page.locator(".section-contours")).toHaveCount(3);
      await page
        .locator(".hero-actions")
        .getByRole("link", { name: "Let’s create something", exact: true })
        .click();
      await expect(page).toHaveURL(/#contact$/);
      await expect(page.getByLabel("Your name *")).toBeVisible();
      await page.getByLabel("Your name *").fill("Static visitor");
      await expect(page.getByLabel("Your name *")).toHaveValue(
        "Static visitor",
      );
      await expect(page.locator(".signal-banner-copy")).toContainText(
        "Extraordinary possibilities.",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(1);
    } finally {
      await context.close();
    }
  });
});
