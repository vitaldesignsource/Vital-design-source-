import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const expectedProjects = [
  { name: "Aetherica Podcast", url: "https://aethericapodcast.com" },
  {
    name: "The Architecture of Hidden Forces",
    url: "https://thearchitectureofhiddenforces.com",
  },
  { name: "Astera Roofing", url: "https://asteraroofing.com" },
  { name: "Sky Mathis", url: "https://skymathis.com" },
  { name: "3 Magi Press", url: "https://threemagipress.com" },
  { name: "PigeonShield", url: "https://pigeonshield.net" },
  { name: "OceanEmber", url: "https://oceanember.net" },
  { name: "7 Seas Trading", url: "https://7seastrading.net" },
];

test("renders all eight projects with working views, filters, and secure links", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Ideas beyond ordinary.",
  );
  await expect(page.locator(".project")).toHaveCount(8);
  await expect(
    page.getByRole("button", { name: "All projects" }).locator("sup"),
  ).toHaveText("08");
  await expect(page.locator(".work-count")).toHaveText("08 projects");
  for (const project of expectedProjects) {
    const link = page.getByRole("link", {
      name: `Visit ${project.name} (opens in a new tab)`,
      exact: true,
    });
    await expect(link).toHaveAttribute("href", project.url);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /\bnoopener\b/);
    await expect(link).toHaveAttribute("rel", /\bnoreferrer\b/);
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
  await expect(page.locator(".project")).toHaveCount(8);
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
  await expect(
    page.locator(".project-7-seas-trading .project-preview-note"),
  ).toHaveCount(0);
  await expect(page.locator(".project-7-seas-trading img")).toHaveAttribute(
    "alt",
    "7 Seas Trading website preview",
  );
  await expect(page.locator(".project-7-seas-trading img")).toHaveAttribute(
    "src",
    "/assets/projects/7-seas-trading-home-1200.webp",
  );
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
  await expect(page.locator(".project")).toHaveCount(5);
  await expect(page.locator(".work-count")).toHaveText("05 projects");
  await expect(page.locator(".project-ocean-ember")).toBeVisible();
  await expect(page.locator(".project-7-seas-trading")).toBeVisible();
  await page.getByRole("button", { name: "All projects" }).click();
  await expect(page.locator(".project")).toHaveCount(8);
  await expect(page.locator(".work-count")).toHaveText("08 projects");
  expect(errors).toEqual([]);
});

test("explores curated art directions, controls motion, and reaches contact", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#ai-studio");
  const lab = page.locator("#ai-studio");
  const stage = lab.locator(".lab-stage");
  const brief = lab.getByRole("status");
  const chrome = lab.getByRole("button", {
    name: "Liquid chrome",
    exact: true,
  });
  await expect(chrome).toHaveAttribute("aria-pressed", "true");
  await expect(stage).toHaveAttribute("data-direction", "chrome");
  await expect(stage).toHaveAttribute("data-motion", "running");
  await expect
    .poll(() =>
      stage
        .locator("img")
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);

  for (const direction of [
    {
      name: "Prismatic",
      id: "prismatic",
      title: "A different kind of energy.",
      description: "Iridescent color, light in motion, and expressive depth.",
    },
    {
      name: "Editorial",
      id: "editorial",
      title: "Clarity, with character.",
      description:
        "Graphic restraint, confident typography, and considered contrast.",
    },
  ]) {
    const option = lab.getByRole("button", {
      name: direction.name,
      exact: true,
    });
    await option.click();
    await expect(option).toHaveAttribute("aria-pressed", "true");
    await expect(chrome).toHaveAttribute("aria-pressed", "false");
    await expect(stage).toHaveAttribute("data-direction", direction.id);
    await expect(brief.getByRole("heading")).toHaveText(direction.title);
    await expect(brief).toContainText(direction.description);
    const accessibility = await new AxeBuilder({ page })
      .include("#ai-studio")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
  }

  await lab.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(stage).toHaveAttribute("data-motion", "paused");
  await lab.getByRole("button", { name: "Resume motion", exact: true }).click();
  await expect(stage).toHaveAttribute("data-motion", "running");
  await lab
    .getByRole("link", { name: "Explore this direction", exact: true })
    .click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator("#contact")).toBeInViewport();
});

test("has accessible service disclosure panels", async ({ page }) => {
  await page.goto("/#services");
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
  await page.getByLabel("What do you need?").selectOption("AI design & motion");
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
  const submitted = await response;
  expect(submitted.status()).toBe(201);
  expect(submitted.request().postDataJSON().type).toBe("AI design & motion");
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

test("serves accessible vector branding with finite crest animation", async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const home = page.locator(".site-header").getByRole("link", {
    name: "Vital Design Source home",
    exact: true,
  });
  await expect(home).toBeVisible();
  await expect(home).toHaveAttribute("href", "/#top");
  const crest = home.locator("svg.brand-crest");
  await expect(crest).toBeVisible();
  expect(await crest.locator("path").count()).toBeGreaterThan(0);
  await expect(
    page.locator(
      "svg.brand-crest image, svg.brand-crest script, svg.brand-crest noscript, svg.brand-crest foreignObject",
    ),
  ).toHaveCount(0);
  expect(await page.locator("svg.brand-crest").count()).toBeGreaterThanOrEqual(
    2,
  );
  const svgIds = await page
    .locator("svg.brand-crest[id], svg.brand-crest [id]")
    .evaluateAll((elements) => elements.map((element) => element.id));
  expect(new Set(svgIds).size).toBe(svgIds.length);

  const animation = await page
    .locator(".site-header .crest-glint")
    .first()
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        name: style.animationName,
        iterations: style.animationIterationCount.split(",").map(Number),
      };
    });
  expect(animation.name).not.toBe("none");
  expect(animation.iterations.every(Number.isFinite)).toBe(true);

  for (const filename of [
    "vital-crest.svg",
    "vital-crest-animated.svg",
    "vital-lockup.svg",
  ]) {
    const response = await request.get(`/assets/brand/${filename}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/svg+xml");
    const svg = await response.text();
    expect(svg).toMatch(/<svg\b/);
    expect(svg).toMatch(/<path\b/);
    expect(svg).not.toMatch(/<(?:image|script|noscript|foreignObject)\b/i);
    expect(svg).not.toMatch(
      /\b(?:href|src)\s*=\s*["']\s*(?:https?:|data:|\/\/)/i,
    );
    expect(svg).not.toMatch(/url\(\s*["']?\s*(?:https?:|data:|\/\/)/i);
    expect(svg).not.toMatch(/data:image\//i);
    if (filename === "vital-crest-animated.svg") {
      expect(svg).toMatch(/<animate(?:Transform|Motion)?\b/);
      expect(svg).not.toMatch(
        /\b(?:repeatCount|repeatDur|dur)\s*=\s*["']indefinite["']/i,
      );
    }
    if (filename === "vital-lockup.svg") {
      expect(svg).not.toMatch(/<text\b/);
    }
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
  const schemaScript = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  expect(schemaScript).not.toBeNull();
  const schema = JSON.parse(schemaScript![1]) as {
    "@graph": Array<{
      "@type": string;
      mainEntity?: {
        "@type": string;
        itemListElement: Array<{
          "@type": string;
          position: number;
          item: { "@type": string; name: string; url: string };
        }>;
      };
    }>;
  };
  const selectedWork = schema["@graph"].find(
    (entry) => entry["@type"] === "CollectionPage",
  )?.mainEntity;
  expect(selectedWork?.["@type"]).toBe("ItemList");
  const schemaProjects = selectedWork?.itemListElement || [];
  expect(schemaProjects).toHaveLength(8);
  expect(
    schemaProjects.map((entry) => ({
      name: entry.item.name,
      url: entry.item.url,
    })),
  ).toEqual(expectedProjects);
  for (const [index, entry] of schemaProjects.entries()) {
    expect(entry["@type"]).toBe("ListItem");
    expect(entry.position).toBe(index + 1);
    expect(entry.item["@type"]).toBe("CreativeWork");
  }
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
  const projectImages = page.locator(".project img");
  await expect(projectImages).toHaveCount(8);
  for (const image of await projectImages.all()) {
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
  await expect(page.locator(".lab-stage")).toHaveAttribute(
    "data-motion",
    "paused",
  );
  await expect(
    page
      .locator("#ai-studio")
      .getByRole("button", { name: "Resume motion", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".site-header svg.brand-crest")).toBeVisible();
  expect(
    await page
      .locator(".site-header .crest-glint")
      .first()
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
