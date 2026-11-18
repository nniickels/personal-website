import { test, expect } from "@playwright/test";

test("guestbook preloads needed artwork offscreen and only polls nearby", async ({ page }) => {
  await page.clock.install();
  await page.route("**/gc/**", route => route.fulfill({ body: "" }));
  await page.route("https://webring.ca/**", route => route.fulfill({ body: "" }));
  await page.route("**/api/stats", route => route.fulfill({ json: {} }));
  let release!: () => void;
  const responseGate = new Promise<void>(resolve => { release = resolve; });
  let requests = 0;
  const images: string[] = [];
  page.on("request", request => {
    if (request.url().includes("/guestbook/stickers/")) images.push(request.url());
  });
  await page.route("**/api/guestbook", async route => {
    requests++;
    await responseGate;
    await route.fulfill({ json: { entries: [0, 1].map(i => ({
      id: `preload-${i}`, sticker: "mew", name: "Visitor", x: .3 + i * .2, y: .2,
      placedAt: "2026-11-17T12:00:00Z",
    })) } });
  });
  await page.goto("/side", { waitUntil: "domcontentloaded" });
  const section = page.locator("#guestbook");
  await expect.poll(() => requests).toBe(1);
  expect(await section.evaluate(el => el.getBoundingClientRect().top > innerHeight)).toBe(true);
  // Scrolling during the initial request must neither abort nor duplicate it.
  await section.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(() => section.evaluate(el => el.getBoundingClientRect().top > innerHeight + 250)).toBe(true);
  release();
  await expect(section.locator(".guestbook-placed")).toHaveCount(2);
  await expect(section.locator(".guestbook-count")).toHaveText("2 stickers placed");
  await expect.poll(() => images.filter(url => url.endsWith("/mew-pixel.png")).length).toBe(1);
  expect(images.some(url => url.endsWith("/batman-soft.png"))).toBe(false);
  expect(requests).toBe(1);

  // Let the browser deliver the offscreen intersection before advancing timers.
  await page.clock.runFor(100);
  await page.clock.fastForward(60_000);
  expect(requests).toBe(1);
  await section.scrollIntoViewIfNeeded();
  await expect.poll(() => requests).toBe(2);
  await page.clock.fastForward(20_000);
  await expect.poll(() => requests).toBe(3);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(() => section.evaluate(el => el.getBoundingClientRect().top > innerHeight + 250)).toBe(true);
  // Let the browser deliver the offscreen intersection before advancing timers.
  await page.clock.runFor(100);
  await page.clock.fastForward(60_000);
  expect(requests).toBe(3);
  expect(images.filter(url => url.endsWith("/mew-pixel.png"))).toHaveLength(1);
});
