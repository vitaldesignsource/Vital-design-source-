import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("renders all six projects with working views, filters, and secure links", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Make your presence felt.",
  );
  await expect(page.locator(".project")).toHaveCount(6);
  for (const link of await page.locator(".project a").all()) {
    expect(await link.getAttribute("href")).toMatch(/^https:\/\//);
    expect(await link.getAttribute("target")).toBe("_blank");
    expect(await link.getAttribute("rel")).toContain("noopener");
    expect(await link.getAttribute("rel")).toContain("noreferrer");
  }
  const galleryView = page.getByRole("button", { name: "Gallery view" });
  const listView = page.getByRole("button", { name: "List view" });
  const projectPresentation = page.locator(".project-grid");
  await expect(galleryView).toHaveAttribute("aria-pressed", "true");
  await expect(listView).toHaveAttribute("aria-pressed", "false");
  await expect(projectPresentation).toHaveAttribute("data-view", "gallery");
  await listView.click();
  await expect(listView).toHaveAttribute("aria-pressed", "true");
  await expect(galleryView).toHaveAttribute("aria-pressed", "false");
  await expect(projectPresentation).toHaveAttribute("data-view", "list");
  await expect(page.locator(".project")).toHaveCount(6);
  await expect(
    page.locator(".project-hidden-forces .project-preview-note"),
  ).toHaveText("Project artwork · private release");
  await expect(
    page.locator(".project-hidden-forces .project-preview-note"),
  ).toBeVisible();
  await expect(
    page.locator(".project-pigeonshield .project-preview-note"),
  ).toHaveText("Website source preview");
  await expect(
    page.locator(".project-pigeonshield .project-preview-note"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Culture & ideas", exact: true })
    .click();
  await expect(page.locator(".project")).toHaveCount(3);
  await expect(page.locator(".work-count")).toContainText("03 projects");
  await expect(projectPresentation).toHaveAttribute("data-view", "list");
  await expect(listView).toHaveAttribute("aria-pressed", "true");
  await galleryView.click();
  await expect(projectPresentation).toHaveAttribute("data-view", "gallery");
  await expect(galleryView).toHaveAttribute("aria-pressed", "true");
  await expect(listView).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".project")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Brands & business", exact: true })
    .click();
  await expect(page.locator(".project")).toHaveCount(3);
  await page.getByRole("button", { name: "All projects" }).click();
  await expect(page.locator(".project")).toHaveCount(6);
  expect(errors).toEqual([]);
});

test("has accessible service disclosure panels", async ({ page }) => {
  await page.goto("/");
  const seo = page.getByRole("button", { name: "04 SEO" });
  await seo.click();
  await expect(seo).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Built to be discovered.")).toBeVisible();
  await seo.click();
  await expect(seo).toHaveAttribute("aria-expanded", "false");
});

test("validates, submits, and announces a real persisted inquiry", async ({
  page,
}) => {
  await page.goto("/#contact");
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(page.getByLabel("Your name *")).toBeFocused();
  await page.getByLabel("Your name *").fill("Browser Test");
  await page.getByLabel("Email address *").fill("browser-test@example.com");
  await page
    .getByLabel("A little about your idea *")
    .fill("An automated local test of the project inquiry workflow.");
  await page.getByRole("checkbox").check();
  const response = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/inquiry") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  expect((await response).status()).toBe(201);
  await expect(
    page.getByRole("heading", { name: "Message received." }),
  ).toBeVisible();
  await expect(page.locator(".form-success")).toBeFocused();
});

test("preserves input and offers a retry after a network error", async ({
  page,
}) => {
  await page.route("**/api/inquiry", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "Please try again shortly." }),
    }),
  );
  await page.goto("/#contact");
  await page.getByLabel("Your name *").fill("Retry Test");
  await page.getByLabel("Email address *").fill("retry@example.com");
  await page
    .getByLabel("A little about your idea *")
    .fill("A project inquiry that should remain after an error.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Please try again shortly.",
  );
  await expect(page.getByLabel("Your name *")).toHaveValue("Retry Test");
  await expect(
    page.getByRole("button", { name: "Send inquiry", exact: true }),
  ).toBeEnabled();
});

test("meets automated WCAG checks on home and privacy", async ({ page }) => {
  for (const path of ["/", "/privacy"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  }
});

test("serves metadata, a real 404, sitemap, robots, and responsive assets", async ({
  page,
  request,
}) => {
  const response = await request.get("/");
  const html = await response.text();
  expect(html).toContain("Aetherica Podcast");
  expect(html).toContain("application/ld+json");
  expect(html).toContain("og:image");
  expect(html).toContain('rel="canonical"');
  expect((await request.get("/missing-page")).status()).toBe(404);
  expect((await request.get("/privacy")).status()).toBe(200);
  expect(
    (await request.get("/sitemap.xml")).headers()["content-type"],
  ).toContain("xml");
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "User-agent: *",
  );
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  for (const image of await page.locator(".project img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
  }
  const crest = page.locator(".footer-crest img");
  await crest.scrollIntoViewIfNeeded();
  await expect
    .poll(() => crest.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
});

test("honors reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page
      .locator(".hero-art img")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
});

test("mobile navigation traps focus, closes on Escape, and follows anchors", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile navigation only");
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await menu.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(menu).toBeFocused();
  await menu.click();
  await page
    .getByRole("navigation", { name: "Mobile", exact: true })
    .getByRole("link", { name: /Services/ })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(/#services$/);
  await expect(page.locator("#services")).toBeInViewport();
});
