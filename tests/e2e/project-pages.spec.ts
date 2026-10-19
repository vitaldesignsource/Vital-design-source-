import { createHash } from "node:crypto";
import { expect, test, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const catalog = [
  {
    id: "aetherica",
    name: "Aetherica Podcast",
    url: "https://aethericapodcast.com",
  },
  {
    id: "hidden-forces",
    name: "The Architecture of Hidden Forces",
    url: "https://thearchitectureofhiddenforces.com",
  },
  { id: "astera", name: "Astera Roofing", url: "https://asteraroofing.com" },
  { id: "sky-mathis", name: "Sky Mathis", url: "https://skymathis.com" },
  { id: "3-magi", name: "3 Magi Press", url: "https://threemagipress.com" },
  { id: "pigeonshield", name: "PigeonShield", url: "https://pigeonshield.net" },
  { id: "ocean-ember", name: "OceanEmber", url: "https://oceanember.net" },
  {
    id: "7-seas-trading",
    name: "7 Seas Trading",
    url: "https://7seastrading.net",
  },
] as const;

function decodeAttribute(value: string) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function attributes(tag: string) {
  return Object.fromEntries(
    Array.from(tag.matchAll(/([\w:-]+)="([^"]*)"/g), (match) => [
      match[1],
      decodeAttribute(match[2]),
    ]),
  );
}

function metadata(html: string, name: string) {
  const tags = html.match(/<meta\b[^>]*>/g) || [];
  return tags
    .map(attributes)
    .find((tag) => tag.name === name || tag.property === name)?.content;
}

function canonical(html: string) {
  const tags = html.match(/<link\b[^>]*>/g) || [];
  return tags.map(attributes).find((tag) => tag.rel === "canonical")?.href;
}

async function expectPreviewColors(study: Locator) {
  await expect(study).toContainText("Sampled from this preview");
  const samples = study
    .getByRole("list", { name: "Preview color samples", exact: true })
    .getByRole("listitem");
  await expect(samples).toHaveCount(4);
  for (const sample of await samples.all()) {
    await expect(sample).toContainText(/#[0-9A-F]{6}/);
    const hex = (await sample.textContent())!.match(/#[0-9A-F]{6}/)![0];
    const channels = [1, 3, 5].map((start) =>
      parseInt(hex.slice(start, start + 2), 16),
    );
    const swatch = sample.locator(".project-page-color-swatch");
    await expect(swatch).toHaveAttribute("aria-hidden", "true");
    await expect(swatch).toHaveCSS(
      "background-color",
      `rgb(${channels.join(", ")})`,
    );
  }
}

test.describe("project publishing", () => {
  test.skip(
    ({ isMobile }) => isMobile,
    "HTTP and no-JavaScript publishing contracts are viewport independent.",
  );

  test("publishes eight distinct project documents with matching metadata, schema, and CSP", async ({
    request,
  }) => {
    const home = await request.get("/");
    const site = new URL(canonical(await home.text())!).origin;
    const sitemapResponse = await request.get("/sitemap.xml");
    expect(sitemapResponse.status()).toBe(200);
    expect(sitemapResponse.headers()["content-type"]).toContain("xml");
    const sitemap = await sitemapResponse.text();
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    const images = new Set<string>();

    for (const project of catalog) {
      const path = `/work/${project.id}`;
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect(response.headers()["content-type"]).toContain("text/html");
      const html = await response.text();
      const title = decodeAttribute(html.match(/<title>(.*?)<\/title>/)![1]);
      const description = metadata(html, "description")!;
      const image = metadata(html, "og:image")!;
      expect(title).toContain(project.name);
      expect(title).toContain("Vital Design Source");
      expect(description.length).toBeGreaterThan(40);
      expect(canonical(html)).toBe(`${site}${path}`);
      expect(metadata(html, "og:url")).toBe(`${site}${path}`);
      expect(metadata(html, "og:title")).toBe(title);
      expect(metadata(html, "og:description")).toBe(description);
      expect(metadata(html, "twitter:title")).toBe(title);
      expect(metadata(html, "twitter:description")).toBe(description);
      expect(metadata(html, "twitter:image")).toBe(image);
      expect(new URL(image).origin).toBe(site);
      expect(new URL(image).pathname).toMatch(
        /^\/assets\/projects\/.+\.(?:webp|jpg|png)$/,
      );
      expect(metadata(html, "og:image:alt")).toContain(project.name);
      expect(html).toContain(`data-project="${project.id}"`);
      expect(html).toContain(project.name);
      expect(sitemap).toContain(`<loc>${site}${path}</loc>`);
      titles.add(title);
      descriptions.add(description);
      images.add(image);

      const schemaScripts = Array.from(
        html.matchAll(
          /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
        ),
        (match) => match[1],
      );
      expect(schemaScripts.length).toBeGreaterThan(0);
      const graph = schemaScripts.flatMap((source) => {
        const schema = JSON.parse(source) as {
          "@graph"?: Record<string, unknown>[];
        };
        return schema["@graph"] || [schema];
      });
      const work = graph.find((entry) => entry["@type"] === "CreativeWork");
      expect(work?.name).toBe(project.name);
      expect(work?.url).toBe(project.url);
      expect(work?.image).toBe(image);
      expect(work?.mainEntityOfPage).toEqual({
        "@id": `${site}${path}#webpage`,
      });
      const webpage = graph.find((entry) => entry["@type"] === "WebPage");
      expect(webpage?.url).toBe(`${site}${path}`);
      expect(webpage?.mainEntity).toEqual({ "@id": `${site}${path}#project` });
      const breadcrumb = graph.find(
        (entry) => entry["@type"] === "BreadcrumbList",
      );
      expect(breadcrumb?.itemListElement).toEqual([
        expect.objectContaining({
          "@type": "ListItem",
          position: 1,
          name: "Vital Design Source",
          item: `${site}/`,
        }),
        expect.objectContaining({
          "@type": "ListItem",
          position: 2,
          name: "Selected work",
          item: `${site}/#work`,
        }),
        expect.objectContaining({
          "@type": "ListItem",
          position: 3,
          name: project.name,
          item: `${site}${path}`,
        }),
      ]);

      const csp = response.headers()["content-security-policy"];
      expect(csp).toBeTruthy();
      expect(csp).not.toContain("'unsafe-inline'");
      expect(csp).not.toContain("'unsafe-eval'");
      const scriptPolicy = csp
        .split(";")
        .find((directive) => directive.trim().startsWith("script-src "))!;
      expect(scriptPolicy).toContain("'self'");
      for (const source of schemaScripts) {
        const digest = createHash("sha256").update(source).digest("base64");
        expect(scriptPolicy).toContain(`'sha256-${digest}'`);
      }
      const imageResponse = await request.get(new URL(image).pathname);
      expect(imageResponse.status()).toBe(200);
      expect(imageResponse.headers()["content-type"]).toMatch(/^image\//);
    }
    expect(titles.size).toBe(8);
    expect(descriptions.size).toBe(8);
    expect(images.size).toBe(8);
  });

  test("keeps unknown, nested, encoded, and private paths outside the project allowlist", async ({
    request,
    page,
  }) => {
    for (const path of [
      "/work",
      "/work/not-a-project",
      "/work/Aetherica",
      "/work/aetherica/details",
      "/work/aetherica/index.html",
      "/work/aetherica//",
      "/work/%2e%2e%2fprivacy",
      "/work/%252e%252e/privacy",
      "/.env",
      "/server/app.ts",
      "/data/inquiries.sqlite",
    ]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(404);
      const html = await response.text();
      expect(html).toContain("noindex,nofollow");
      expect(canonical(html)).toBeUndefined();
      expect(html).not.toContain('class="project-page');
    }
    const privacy = await request.get("/privacy");
    expect(privacy.status()).toBe(200);
    expect(await privacy.text()).toContain("Privacy notice");
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /hydration|Minified React error/i.test(message.text())
      )
        errors.push(message.text());
    });
    const unknown = await page.goto("/work/aetherica//");
    expect(unknown?.status()).toBe(404);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main.not-found h1")).toContainText("Let’s find");
    await expect(page.locator("main.project-page")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("serves a complete project story and usable navigation without JavaScript", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
      reducedMotion: "reduce",
    });
    try {
      const page = await context.newPage();
      const response = await page.goto("/work/7-seas-trading");
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "7 Seas Trading",
      );
      await expect(page.locator(".project-page-preview img")).toBeVisible();
      await expect(
        page.getByRole("region", { name: "Color study" }),
      ).toBeVisible();
      await expectPreviewColors(
        page.getByRole("region", { name: "Color study" }),
      );
      await page
        .getByRole("navigation", { name: "More projects" })
        .getByRole("link", {
          name: "Next project: Aetherica Podcast",
          exact: true,
        })
        .click();
      await expect(page).toHaveURL(/\/work\/aetherica$/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Aetherica Podcast",
      );
    } finally {
      await context.close();
    }
  });
});

test("presents accessible public previews and private artwork without misleading device claims", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (isMobile) await page.setViewportSize({ width: 320, height: 740 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const project of [
    {
      id: "ocean-ember",
      name: "OceanEmber",
      url: "https://oceanember.net",
      disclosure: "Website preview",
    },
    {
      id: "hidden-forces",
      name: "The Architecture of Hidden Forces",
      url: "https://thearchitectureofhiddenforces.com",
      disclosure: "Project artwork · private release",
    },
  ]) {
    const response = await page.goto(`/work/${project.id}`);
    expect(response?.status()).toBe(200);
    const main = page.getByRole("main");
    await expect(main).toHaveCount(1);
    await expect(main).toHaveAttribute("id", "main");
    await expect(main).toHaveAttribute("data-project", project.id);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      project.name,
    );
    const breadcrumb = main.getByRole("navigation", { name: "Breadcrumb" });
    await expect(
      breadcrumb.getByRole("link", { name: "Home", exact: true }),
    ).toHaveAttribute("href", "/");
    await expect(
      breadcrumb.getByRole("link", { name: "Selected work", exact: true }),
    ).toHaveAttribute("href", "/#work");
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
      project.name,
    );
    await expect(
      main.locator(".project-page-preview figcaption"),
    ).toContainText(project.disclosure);
    if (project.id === "hidden-forces") {
      await expect(main).toContainText("The project is a private release.");
      await expect(
        main.getByRole("button", { name: /Mobile|Desktop/ }),
      ).toHaveCount(0);
    }

    const previewImages = main.locator("figure img");
    await expect(previewImages).toHaveCount(3);
    for (const image of await previewImages.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveAttribute("srcset", /640w.*1200w/);
      await expect(image).toHaveAttribute("alt", new RegExp(project.name));
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
    const study = main.getByRole("region", {
      name: "Color study",
      exact: true,
    });
    await expectPreviewColors(study);
    const visit = main.getByRole("link", {
      name: `Visit ${project.name} website (opens in a new tab)`,
      exact: true,
    });
    await expect(visit).toHaveAttribute("href", project.url);
    await expect(visit).toHaveAttribute("target", "_blank");
    await expect(visit).toHaveAttribute("rel", /\bnoopener\b/);
    await expect(visit).toHaveAttribute("rel", /\bnoreferrer\b/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test("discovers project stories from cards and dialogs and navigates the catalog", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#work");
  await page
    .getByRole("link", {
      name: "View Aetherica Podcast project study",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/work\/aetherica$/);
  const more = page.getByRole("navigation", { name: "More projects" });
  await more
    .getByRole("link", {
      name: "Previous project: 7 Seas Trading",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/work\/7-seas-trading$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "7 Seas Trading",
  );
  await page
    .getByRole("navigation", { name: "More projects" })
    .getByRole("link", { name: "Next project: Aetherica Podcast", exact: true })
    .click();
  await expect(page).toHaveURL(/\/work\/aetherica$/);
  await page
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("link", { name: "Selected work", exact: true })
    .click();
  await expect(page).toHaveURL(/\/#work$/);
  await page
    .getByRole("button", {
      name: "Explore The Architecture of Hidden Forces",
      exact: true,
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "The Architecture of Hidden Forces",
    exact: true,
  });
  await dialog
    .getByRole("link", {
      name: "Read The Architecture of Hidden Forces project study",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/work\/hidden-forces$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The Architecture of Hidden Forces",
  );
  await page.goBack();
  await expect(page).toHaveURL(/\/#work$/);
  await expect(
    page.getByRole("heading", { level: 2, name: /Built with purpose/ }),
  ).toBeVisible();
});
