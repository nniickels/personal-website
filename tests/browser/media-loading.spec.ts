import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/gc/**", (route) => route.fulfill(route.request().url().endsWith(".js")
    ? { contentType: "application/javascript", body: "" }
    : { json: { count: "123" } }));
  await page.route("https://webring.ca/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.route("https://p.scdn.co/**", (route) => route.abort());
  await page.route("**/api/stats", (route) => route.fulfill({ json: {
    spotify: { status: "unavailable", message: "Offline fixture" },
    steam: { status: "unavailable", message: "Offline fixture" },
    clashRoyale: { status: "unavailable", message: "Offline fixture" },
  } }));
});

test("side gallery markup is ready while thumbnail downloads remain lazy", async ({ page, isMobile }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/side");
  await expect(page.locator(".photo-gallery-grid")).toHaveCount(4);
  await expect(page.locator(".photo-gallery-thumbnail")).toHaveCount(113);
  await expect(page.locator("#photo-gallery .photo-gallery-column")).toHaveCount(isMobile ? 3 : 5);
  const thumbnails = page.locator(".photo-gallery-thumbnail img, .listening-cover-thumbnail img, .pokemon-card-thumbnail img");
  await expect(thumbnails).toHaveCount(158);
  expect(await thumbnails.evaluateAll((images) => images.every((image) =>
    (image as HTMLImageElement).loading === "lazy"))).toBe(true);
  for (const selector of ["#photo-gallery details", "#natural-things", "#scrapbook", "#food details"]) {
    await expect(page.locator(selector)).not.toHaveAttribute("open");
  }
  expect(await page.evaluate(() => scrollY)).toBe(0);
  const imageRequests = requests.filter((url) => /\/media\/(?:photos|food-photos|natural-things|scrapbook|music-covers|pokemon-cards)-/.test(url));
  expect(imageRequests.every((url) => Number(url.match(/-(\d+)\.webp$/)?.[1]) <= 480)).toBe(true);
  expect(requests.some((url) => /\/(?:image-gallery|music-shelf|pokemon-shelf)-viewer-/.test(url))).toBe(false);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("opening a prepared gallery reveals its existing thumbnails", async ({ page, isMobile }, testInfo) => {
  await page.goto("/side");
  await expect(page.locator("#photo-gallery .photo-gallery-column")).toHaveCount(isMobile ? 3 : 5);
  const result = await page.locator("#photo-gallery .photo-gallery-grid").evaluate((grid) => new Promise<{ revealMs: number; sameNodes: boolean }>((resolve) => {
    const thumbnails = [...grid.querySelectorAll(".photo-gallery-thumbnail")];
    const start = performance.now();
    (document.querySelector("#photo-gallery summary") as HTMLElement).click();
    requestAnimationFrame(() => resolve({
      revealMs: performance.now() - start,
      sameNodes: thumbnails.every((thumbnail, index) => thumbnail === grid.querySelectorAll(".photo-gallery-thumbnail")[index]),
    }));
  }));
  await testInfo.attach("gallery-prepared-reveal-ms.json", { body: JSON.stringify(result), contentType: "application/json" });
  expect(result.revealMs).toBeLessThan(250);
  expect(result.sameNodes).toBe(true);
  await expect(page.locator("#photo-gallery .photo-gallery-grid")).toBeVisible();
  await expect(page.locator("#photo-gallery .photo-gallery-thumbnail")).toHaveCount(50);
});

for (const [name, selector, moduleName, closeName] of [
  ["photo", "#photo-gallery .photo-gallery-thumbnail", "image-gallery-viewer", "Close photo viewer"],
  ["card", ".pokemon-card-thumbnail", "pokemon-shelf-viewer", "Close card viewer"],
  ["music", ".listening-cover-thumbnail", "music-shelf-viewer", "Close track cover viewer"],
] as const) {
  test(`${name} cold direct activation has no Suspense reveal delay`, async ({ page }, testInfo) => {
    await page.goto("/side");
    if (name === "photo") {
      await page.locator("#photo-gallery summary").evaluate((element: HTMLElement) => element.click());
      await expect(page.locator(selector)).toHaveCount(50);
    }
    const target = page.locator(selector).first();
    await target.scrollIntoViewIfNeeded();
    const revealMs = await target.evaluate((element: HTMLElement) => new Promise<number>((resolve) => {
      const start = performance.now();
      const observer = new MutationObserver(() => {
        if (document.querySelector('[role="dialog"]')) {
          observer.disconnect();
          requestAnimationFrame(() => resolve(performance.now() - start));
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      element.click();
    }));
    await testInfo.attach(`${name}-cold-reveal-ms.json`, { body: JSON.stringify({ revealMs }), contentType: "application/json" });
    expect(revealMs).toBeLessThan(250);
    await expect(page.getByRole("button", { name: closeName, exact: true })).toBeFocused();
    const image = page.getByRole("dialog").locator("img");
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  test(`${name} direct activation reveals promptly and closes while its module is loading`, async ({ page }, testInfo) => {
    await page.goto("/side");
    if (name === "photo") {
      await page.locator("#photo-gallery summary").evaluate((element: HTMLElement) => element.click());
      await expect(page.locator(selector)).toHaveCount(50);
    }
    const target = page.locator(selector).first();
    await target.scrollIntoViewIfNeeded();
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    let requested!: () => void;
    const requestStarted = new Promise<void>((resolve) => { requested = resolve; });
    await page.route(new RegExp(`/${moduleName}-[^/]+\\.js$`), async (route) => {
      requested();
      await held;
      await route.continue();
    });
    // No hover/focus warmup: exercise the direct activation fallback.
    await target.evaluate((element: HTMLElement) => element.click());
    await requestStarted;
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    await page.keyboard.press("Escape");
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
    const loaded = page.waitForResponse((response) => response.url().includes(`/${moduleName}-`));
    release();
    await loaded;
    await page.waitForTimeout(50);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.evaluate(() => { document.body.style.overflow = "auto"; });

    const revealMs = await target.evaluate((element: HTMLElement) => new Promise<number>((resolve) => {
      const start = performance.now();
      const observer = new MutationObserver(() => {
        if (document.querySelector('[role="dialog"]')) {
          observer.disconnect();
          requestAnimationFrame(() => resolve(performance.now() - start));
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      element.click();
    }));
    await testInfo.attach(`${name}-reveal-ms.json`, { body: JSON.stringify({ revealMs }), contentType: "application/json" });
    expect(revealMs).toBeLessThan(250);
    const close = page.getByRole("button", { name: closeName, exact: true });
    await expect(close).toBeFocused();
    const firstImage = await page.getByRole("dialog").locator("img").getAttribute("srcset");
    await page.evaluate(() => {
      let count = 0;
      const observer = new MutationObserver((records) => { count += records.length; });
      observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
      Object.assign(window, { readOverflowMutations() {
        count += observer.takeRecords().length;
        observer.disconnect();
        return count;
      } });
    });
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("dialog").locator("img")).not.toHaveAttribute("srcset", firstImage!);
    await expect(close).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    expect(await page.evaluate(() => (window as unknown as { readOverflowMutations(): number }).readOverflowMutations())).toBe(0);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("auto");
  });
}

test("held music previews scroll equally far at 60 and 120 Hz", async ({ page, isMobile }) => {
  test.skip(!isMobile, "This is the touch-and-hold edge-scroll gesture.");
  await page.goto("/side");
  const wheel = page.locator(".listening-cover-wheel");
  await wheel.scrollIntoViewIfNeeded();
  const session = await page.context().newCDPSession(page);
  const distances: number[] = [];
  try {
    for (const hz of [60, 120]) {
      await wheel.evaluate((element) => { element.scrollLeft = 0; });
      const box = (await wheel.boundingBox())!;
      const start = { x: box.x + 30, y: box.y + box.height / 2 };
      await page.evaluate(() => {
        const originalRequest = window.requestAnimationFrame;
        const originalCancel = window.cancelAnimationFrame;
        const callbacks = new Map<number, FrameRequestCallback>();
        let id = 0;
        window.requestAnimationFrame = (callback) => { callbacks.set(++id, callback); return id; };
        window.cancelAnimationFrame = (handle) => { callbacks.delete(handle); };
        Object.assign(window, {
          mediaFrame(now: number) {
            const batch = [...callbacks.values()]; callbacks.clear();
            batch.forEach((callback) => callback(now));
          },
          restoreMediaFrames() {
            window.requestAnimationFrame = originalRequest;
            window.cancelAnimationFrame = originalCancel;
          },
        });
      });
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
      await expect(wheel).toHaveClass(/is-touch-dragging/);
      await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.x + box.width - 5, y: start.y }] });
      distances.push(await wheel.evaluate((element, rate) => {
        const frames = window as unknown as { mediaFrame(now: number): void };
        const startTime = performance.now();
        frames.mediaFrame(startTime);
        const before = element.scrollLeft;
        for (let frame = 1; frame <= rate / 2; frame++) frames.mediaFrame(startTime + frame * 1_000 / rate);
        return element.scrollLeft - before;
      }, hz));
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.evaluate(() => (window as unknown as { restoreMediaFrames(): void }).restoreMediaFrames());
    }
    expect(distances[0]).toBeGreaterThan(200);
    expect(Math.abs(distances[1] - distances[0])).toBeLessThan(2);
  } finally {
    await session.detach();
  }
});
