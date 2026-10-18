import { expect, test, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const posterPath = "/assets/brand/vital-brand-film-poster.webp";
const filmPath = "/assets/brand/vital-brand-film.mp4";

async function expectTimeFrozen(video: Locator) {
  await expect
    .poll(() => video.evaluate((media: HTMLVideoElement) => media.paused))
    .toBe(true);
  const pausedAt = await video.evaluate(
    (media: HTMLVideoElement) => media.currentTime,
  );
  // Observe elapsed time so a cosmetic button-state change cannot pass as a pause.
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(
    await video.evaluate((media: HTMLVideoElement) => media.currentTime),
  ).toBeCloseTo(pausedAt, 2);
}

test.describe("brand film", () => {
  test.skip(
    ({ isMobile }) => isMobile,
    "These checks cover explicit desktop, narrow-screen, and preference contexts.",
  );

  test("serves canonical film metadata, a poster, and seekable MP4 bytes", async ({
    request,
  }) => {
    const home = await request.get("/");
    expect(home.status()).toBe(200);
    const html = await home.text();
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    const schemaScript = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    );
    expect(canonical).toBeTruthy();
    expect(schemaScript).not.toBeNull();
    const schema = JSON.parse(schemaScript![1]) as {
      "@graph": Array<Record<string, unknown>>;
    };
    expect(
      schema["@graph"].find((entry) => entry["@type"] === "VideoObject"),
    ).toMatchObject({
      name: "Heritage, in motion.",
      contentUrl: new URL(filmPath, canonical).href,
      thumbnailUrl: new URL(posterPath, canonical).href,
      duration: "PT8S",
      width: 1920,
      height: 1080,
    });
    const film = await request.get(filmPath, {
      headers: { Range: "bytes=0-1023" },
    });
    expect(film.status()).toBe(206);
    expect(film.headers()["content-type"]).toContain("video/mp4");
    expect(film.headers()["content-range"]).toMatch(/^bytes 0-1023\/\d+$/);
    expect((await film.body()).length).toBe(1024);
    const poster = await request.get(posterPath);
    expect(poster.status()).toBe(200);
    expect(poster.headers()["content-type"]).toContain("image/webp");
    const privacy = await request.get("/privacy");
    expect(privacy.status()).toBe(200);
    expect(await privacy.text()).not.toMatch(/id="brand-film"|<video\b/);
  });

  test("shows an accessible poster without fetching or autoplaying the film", async ({
    browser,
    baseURL,
  }) => {
    for (const preference of [
      {
        name: "normal",
        width: 1440,
        reducedMotion: "no-preference",
        saveData: false,
      },
      {
        name: "reduced motion",
        width: 320,
        reducedMotion: "reduce",
        saveData: false,
      },
      {
        name: "save data",
        width: 390,
        reducedMotion: "no-preference",
        saveData: true,
      },
    ] as const) {
      await test.step(preference.name, async () => {
        const context = await browser.newContext({
          baseURL,
          viewport: { width: preference.width, height: 1000 },
          reducedMotion: preference.reducedMotion,
        });
        try {
          if (preference.saveData) {
            await context.addInitScript(() => {
              Object.defineProperty(navigator, "connection", {
                configurable: true,
                value: { saveData: true },
              });
            });
          }
          const page = await context.newPage();
          const filmRequests: string[] = [];
          page.on("request", (request) => {
            if (new URL(request.url()).pathname === filmPath)
              filmRequests.push(request.url());
          });
          await page.goto("/");
          const film = page.locator("#brand-film");
          await film.scrollIntoViewIfNeeded();
          const video = film.locator("video");
          const poster = film.locator("img.brand-film-poster");
          await expect(video).toHaveAttribute(
            "aria-label",
            "Vital Design Source brand film",
          );
          await expect(video).toHaveAttribute("poster", posterPath);
          await expect(video).toHaveAttribute("preload", "none");
          expect(await video.getAttribute("src")).toBeNull();
          await expect(video.locator("source")).toHaveCount(0);
          await expect(poster).toBeVisible();
          await expect
            .poll(() =>
              poster.evaluate((image: HTMLImageElement) => image.naturalWidth),
            )
            .toBeGreaterThan(0);
          await expect(
            film.getByRole("button", { name: "Play brand film", exact: true }),
          ).toBeVisible();
          expect(
            await video.evaluate((media: HTMLVideoElement) => ({
              autoplay: media.autoplay,
              loop: media.loop,
              paused: media.paused,
              time: media.currentTime,
              source: media.currentSrc,
            })),
          ).toEqual({
            autoplay: false,
            loop: false,
            paused: true,
            time: 0,
            source: "",
          });
          if (!preference.saveData) {
            const accessibility = await new AxeBuilder({ page })
              .include("#brand-film")
              .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
              .analyze();
            expect(accessibility.violations).toEqual([]);
          }
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth - window.innerWidth,
            ),
          ).toBeLessThanOrEqual(1);
          expect(filmRequests).toEqual([]);
        } finally {
          await context.close();
        }
      });
    }
  });

  test("plays on request, preserves manual pause, pauses when hidden, and finishes once", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#brand-film");
    const film = page.locator("#brand-film");
    await film.scrollIntoViewIfNeeded();
    const video = film.locator("video");
    const play = film.getByRole("button", {
      name: "Play brand film",
      exact: true,
    });
    await play.click();
    await expect
      .poll(() =>
        video.evaluate((media: HTMLVideoElement) => media.currentTime),
      )
      .toBeGreaterThan(0.1);
    await expect(video).toHaveJSProperty("paused", false);
    await expect(film.locator("img.brand-film-poster")).not.toBeVisible();

    await film
      .getByRole("button", { name: "Pause brand film", exact: true })
      .click();
    await expectTimeFrozen(video);
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expectTimeFrozen(video);
    await film.scrollIntoViewIfNeeded();
    await expectTimeFrozen(video);
    await expect(play).toBeVisible();

    await play.click();
    await expect(video).toHaveJSProperty("paused", false);
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expectTimeFrozen(video);
    const offscreenTime = await video.evaluate(
      (media: HTMLVideoElement) => media.currentTime,
    );
    await film.scrollIntoViewIfNeeded();
    await expect
      .poll(() => video.evaluate((media: HTMLVideoElement) => media.paused))
      .toBe(false);
    await expect
      .poll(() =>
        video.evaluate((media: HTMLVideoElement) => media.currentTime),
      )
      .toBeGreaterThan(offscreenTime + 0.05);

    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expectTimeFrozen(video);
    const hiddenTime = await video.evaluate(
      (media: HTMLVideoElement) => media.currentTime,
    );
    await page.evaluate(() => {
      Reflect.deleteProperty(document, "hidden");
      Reflect.deleteProperty(document, "visibilityState");
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect
      .poll(() => video.evaluate((media: HTMLVideoElement) => media.paused))
      .toBe(false);
    await expect
      .poll(() =>
        video.evaluate((media: HTMLVideoElement) => media.currentTime),
      )
      .toBeGreaterThan(hiddenTime + 0.05);

    await video.evaluate((media: HTMLVideoElement) => {
      media.currentTime = Math.max(0, media.duration - 0.2);
    });
    const replay = film.getByRole("button", {
      name: "Replay brand film",
      exact: true,
    });
    await expect(replay).toBeVisible();
    await expect(video).toHaveJSProperty("ended", true);
    await expectTimeFrozen(video);
    await replay.click();
    await expect(video).toHaveJSProperty("paused", false);
    await expect
      .poll(() =>
        video.evaluate((media: HTMLVideoElement) => media.currentTime),
      )
      .toBeLessThan(1);
    expect(errors).toEqual([]);
  });

  for (const failure of ["load error", "play rejection"] as const) {
    test(`restores the poster and retries after a ${failure}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      let blockFilm = failure === "load error";
      if (blockFilm) {
        await page.route(`**${filmPath}`, (route) =>
          blockFilm ? route.abort("failed") : route.continue(),
        );
      } else {
        await page.addInitScript(() => {
          const original = HTMLMediaElement.prototype.play;
          let rejected = false;
          HTMLMediaElement.prototype.play = function () {
            if (this.closest("#brand-film") && !rejected) {
              rejected = true;
              return Promise.reject(
                new DOMException(
                  "Playback requires another gesture.",
                  "NotAllowedError",
                ),
              );
            }
            return original.call(this);
          };
        });
      }
      await page.goto("/#brand-film");
      const film = page.locator("#brand-film");
      await film.scrollIntoViewIfNeeded();
      const video = film.locator("video");
      const play = film.getByRole("button", {
        name: "Play brand film",
        exact: true,
      });
      await play.click();
      await expect(film.locator(".brand-film-player")).toHaveAttribute(
        "data-state",
        failure === "load error" ? "error" : "blocked",
      );
      await expect(film.locator("img.brand-film-poster")).toBeVisible();
      await expect(
        film.getByText(
          failure === "load error"
            ? "The film is unavailable. You can try again."
            : "Press play to watch the film.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(play).toBeVisible();
      blockFilm = false;
      await play.click();
      await expect
        .poll(() =>
          video.evaluate((media: HTMLVideoElement) => media.currentTime),
        )
        .toBeGreaterThan(0.1);
      await expect(film.locator(".brand-film-player")).toHaveAttribute(
        "data-state",
        "playing",
      );
      await expect(film.locator("img.brand-film-poster")).not.toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});
