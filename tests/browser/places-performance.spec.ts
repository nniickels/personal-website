import { test, expect } from "@playwright/test";

// Keep postcard media bounded without changing the native page/animation model.
test("Places loads only nearby optimized photos and remains interactive", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  test.skip(!["desktop", "mobile"].includes(testInfo.project.name));
  await page.route("**/api/stats", route => route.fulfill({ contentType: "application/json", body: "{}" }));
  await page.route("**/gc/**", route => route.fulfill({ body: "" }));
  await page.route("https://webring.ca/**", route => route.fulfill({ body: "" }));
  const photos = new Set<string>();
  page.on("request", request => { if (/\/media\/postcard-photos-/.test(request.url())) photos.add(request.url()); });
  await page.goto("/side", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const initial = [...photos];
  await page.locator("#favourite-places").scrollIntoViewIfNeeded();
  const image = page.locator(".postcard-slot--0 .postcard-photo img");
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.waitForTimeout(250);
  const visible = [...photos];
  const entries = await page.evaluate(() => performance.getEntriesByType("resource")
    .filter(entry => /\/media\/postcard-photos-/.test(entry.name))
    .map(entry => ({ url: entry.name, bytes: (entry as PerformanceResourceTiming).encodedBodySize })));
  await testInfo.attach("places-media.json", { body: JSON.stringify({ initial, visible, entries }, null, 2), contentType: "application/json" });
  console.log(JSON.stringify({ project: testInfo.project.name, initialPhotos: initial.length,
    visiblePhotos: visible.length, photoBytes: entries.reduce((total, entry) => total + entry.bytes, 0) }));
  expect(initial.length).toBeLessThanOrEqual(4);
  expect(visible.length).toBeLessThanOrEqual(4);
  expect(visible.every(url => /-(320|480|960|1440|1920)\.webp$/.test(url))).toBe(true);
  expect(await page.locator(".postcard-photo img").count()).toBeLessThanOrEqual(4);
  for (const name of ["Next favourite place", "Previous favourite place", "Previous favourite place", "Next favourite place"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("button", { name, exact: true })).toBeEnabled();
  }
  await expect(page.locator(".postcard-number-display")).toHaveText("1");
  await page.getByRole("button", { name: "Turn over Lucie", exact: true }).click();
  await expect(page.locator(".postcard-slot--0 .place-postcard")).toHaveClass(/is-flipped/);
  await page.getByRole("button", { name: /Photo side/ }).click();
  await page.locator(".postcard-number-display").click();
  await page.getByRole("textbox", { name: /Postcard number/ }).fill("11");
  await page.getByRole("textbox", { name: /Postcard number/ }).press("Enter");
  await expect(page.locator(".postcard-number-display")).toHaveText("11");
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Next favourite place", exact: true }).click();
  await expect(page.locator(".postcard-number-display")).toHaveText("1");
  await expect(page.getByRole("button", { name: "Next favourite place", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
