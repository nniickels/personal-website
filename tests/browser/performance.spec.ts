import { test, expect } from "@playwright/test";
import assert from "node:assert/strict";

test.beforeEach(async ({ page }) => {
  await page.route("**/gc/**", (route) => route.fulfill(route.request().url().endsWith(".js") ? { contentType: "application/javascript", body: "" } : { contentType: "application/json", body: JSON.stringify({ count: "123" }) }));
  await page.route("https://webring.ca/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.route("**/api/stats", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ spotify: { status: "unavailable", message: "Offline fixture" }, steam: { status: "unavailable", message: "Offline fixture" }, clashRoyale: { status: "unavailable", message: "Offline fixture" } }) }));
  await page.route("https://p.scdn.co/**", (route) => route.abort());
});

test("home renders without side-quest or simulation code", async ({ page }) => {
  const scripts: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => { if (request.resourceType() === "script") scripts.push(request.url()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Nicole Jiang", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Switch to .* mode/ }).click();
  expect(errors).toEqual([]);
  expect(scripts.filter((url) => /fun-content|music-shelf|pokemon-shelf|black-hole|stellar|lensing|resonance/.test(url))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("galleries defer original-size media and preserve the full viewer", async ({ page }, testInfo) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/side");
  await expect(page.locator("#photo-gallery .photo-gallery-thumbnail")).toHaveCount(0);
  expect(requests.some((url) => /media\/photos-/.test(url))).toBe(false);
  await page.locator("#photo-gallery summary").click();
  await expect(page.locator("#photo-gallery .photo-gallery-thumbnail")).toHaveCount(50);
  const first = page.locator("#photo-gallery .photo-gallery-thumbnail img").first();
  await expect(first).toBeVisible();
  await expect.poll(() => first.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  const thumb = await first.evaluate((img: HTMLImageElement) => ({ src: img.currentSrc, width: img.width, height: img.height }));
  expect(thumb.src).toMatch(/-(160|320|480)\.webp$/);
  expect(thumb.height).toBeGreaterThan(0);
  await first.click();
  const viewer = page.getByRole("dialog");
  await expect(viewer).toBeVisible();
  await expect.poll(() => viewer.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  const fullSrc = await viewer.locator("img").evaluate((img: HTMLImageElement) => img.currentSrc);
  expect(fullSrc).not.toBe(thumb.src);
  await page.keyboard.press("ArrowRight");
  await expect(viewer).toHaveAttribute("aria-label", "Photo 2 of 50");
  await page.keyboard.press("Escape");
  await expect(viewer).toHaveCount(0);
  const summary = page.locator("#photo-gallery summary");
  await summary.click(); await summary.click();
  await expect(page.locator("#photo-gallery .photo-gallery-thumbnail")).toHaveCount(50);
  await page.screenshot({ path: testInfo.outputPath("gallery.png"), fullPage: false });
});

test("mobile initializes only the chosen experiment and preserves state", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/playground");
  await expect(page.locator(".mobile-experiment-toggle")).toHaveCount(4);
  await expect(page.locator(".black-hole-stage, .stellar-canvas, .lensing-canvas, .resonance-canvas")).toHaveCount(0);
  expect(requests.filter((url) => /chunks\/(black-hole|stellar|lensing|resonance)-/.test(url))).toEqual([]);
  const blackToggle = page.getByRole("button", { name: "Black-Hole Growth Simulator", exact: true });
  await blackToggle.click();
  await expect(page.locator(".black-hole-stage")).toBeVisible();
  await page.getByRole("button", { name: "Rapid growth", exact: true }).click();
  const sliders = page.locator("#black-hole-growth input[type=range]");
  const values = await sliders.evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value));
  await page.getByRole("button", { name: "Stellar Evolution Explorer", exact: true }).click();
  await expect(page.locator(".stellar-canvas")).toBeVisible();
  await expect(page.locator(".black-hole-stage")).toBeHidden();
  await blackToggle.click();
  await expect(page.getByRole("button", { name: "Rapid growth", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(await sliders.evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value))).toEqual(values);
  await page.setViewportSize({ width: 1000, height: 800 });
  await expect(page.locator(".black-hole-stage")).toBeVisible();
  await page.setViewportSize({ width: 393, height: 851 });
  await expect(blackToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: "Rapid growth", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Variables guide", exact: true }).click();
  expect(await page.locator(".night-star").evaluateAll((stars) => stars.some((star) => getComputedStyle(star).animationPlayState === "running" && getComputedStyle(star).animationName !== "none"))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("playground.png"), fullPage: false });
});

test("deep links open their experiment", async ({ page }, testInfo) => {
  await page.goto("/playground#gravitational-lensing");
  await expect(page.locator(".lensing-canvas")).toBeVisible();
  const canvas = page.locator(".lensing-canvas");
  const box = await canvas.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.65, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "Perfect alignment" })).toBeVisible();
  await page.getByRole("button", { name: "Perfect alignment" }).click();
  await expect(page.locator(".lensing-instruction strong")).toHaveText("Einstein ring");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("lensing.png"), fullPage: false });
});

test("offscreen orbit animation stops and resumes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/playground#orbital-resonance");
  await expect(page.locator(".resonance-canvas")).toBeVisible();
  const phase = page.locator("#orbital-resonance dt", { hasText: "Inner-orbit phase" }).locator("..").locator("dd");
  const initial = await phase.textContent();
  await expect.poll(() => phase.textContent()).not.toBe(initial);
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator("#orbital-resonance")).toHaveClass(/experiment-is-paused/);
  const paused = await phase.textContent();
  await page.waitForTimeout(250);
  expect(await phase.textContent()).toBe(paused);
  await page.locator("#orbital-resonance-slot").scrollIntoViewIfNeeded();
  await expect.poll(() => phase.textContent()).not.toBe(paused);
});

test("all experiment content and scientific explanations remain available", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/playground");
  for (const id of ["black-hole-growth", "stellar-evolution", "gravitational-lensing", "orbital-resonance"]) {
    await page.locator(`#${id}-slot`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  const html = await page.locator("body").innerHTML();
  assert.match(html, /id="black-hole-growth"/i);
  assert.match(html, /id="gravitational-lensing"/i);
  assert.match(html, /id="orbital-resonance"/i);
  assert.match(html, /id="stellar-evolution"/i);
  assert.doesNotMatch(html, /work in progress/i);
  assert.equal((html.match(/Explanation/g) ?? []).length, 4);
  assert.doesNotMatch(html, /Experiment guide|What to do|What to expect/i);
  assert.match(html, /logarithmic mass scale[\s\S]*?each vertical step represents a tenfold increase/i);
  assert.match(html, /dashed 10⁹ M☉ line provides[\s\S]*?benchmark/i);
  assert.match(html, /Einstein radius/i);
  assert.match(html, /Display units are arbitrary distances within this[\s\S]*?useful for comparing how the results change/i);
  assert.match(html, /side view shows the line-of-sight[\s\S]*?schematic and unscaled/i);
  assert.equal((html.match(/display units/g) ?? []).length, 2);
  assert.doesNotMatch(html, /canvas units/i);
  assert.match(html, /Pattern repeats after/i);
  const explanationBodies = [
    ...html.matchAll(/<div class="experiment-guide-content">([\s\S]*?)<\/div><\/div><\/details>/g),
  ];
  assert.equal(explanationBodies.length, 4);
  for (const [, explanation] of explanationBodies) {
    assert.equal((explanation.match(/<p>/g) ?? []).length, 2);
  }
  assert.match(html, /Black-Hole Growth Simulator/i);
  assert.match(html, /Gravitational Lensing Sandbox/i);
  assert.match(html, /Orbital Resonance Toy/i);
  assert.match(html, /Stellar Evolution Explorer/i);
  assert.match(html, /Orbiting bodies/i);
  assert.match(html, /Period relationship/i);
  assert.match(html, /In a 2:1 pair,[\s\S]*?inner body completes two orbits/i);
  assert.match(html, /repeat readout[\s\S]*?Near resonance preset/i);
  assert.match(html, /2:1 chain/i);
  assert.match(html, /Pause orbits/i);
  assert.match(html, /Mass presets:/i);
  assert.match(html, /Initial mass/i);
  await expect(page.getByRole("slider", { name: "Evolution progress", exact: true })).toBeAttached();
  assert.match(html, /Play evolution/i);
  assert.match(html, /Main-sequence lifetime/i);
  assert.match(html, /Main-sequence luminosity/i);
  assert.match(html, /Final remnant/i);
  assert.match(html, /Lens mass/i);
  assert.match(html, /Distance factor/i);
  assert.match(html, /Perfect alignment/i);
  assert.match(html, /Seed mass/i);
  assert.match(html, /Seed redshift/i);
  assert.match(html, /Observation redshift/i);
  assert.match(html, /Accretion rate/i);
  assert.match(html, /Spin/i);
  assert.match(html, /derived from spin/i);
  assert.match(html, /Advanced settings/i);
  assert.match(html, /Variables guide/i);
  assert.match(html, /Projected mass growth/i);
  assert.match(html, /Cosmic time \(seed → observation\)/i);
  assert.match(html, /Black-hole mass \(M☉, log₁₀ scale\)/i);
  assert.match(html, /10²⁰/i);
  assert.doesNotMatch(html, /10\^20/i);
  assert.match(html, /Time runs from the seed epoch to observation/i);
  assert.match(html, /Variable presets:/i);
  assert.match(html, /black hole.{1,8}s starting mass/i);
  assert.match(html, /proposed direct-collapse seeds/i);
  assert.match(html, /How quickly the black hole feeds/i);
  assert.match(html, /higher redshift means an earlier time/i);
  assert.match(html, /aria-expanded="false"/i);
  assert.match(html, /Duty cycle/i);
  assert.match(html, /Radiative efficiency/i);
  assert.match(html, /Play growth/i);
  assert.match(html, /Drag to rotate in 3D/i);
  assert.match(html, /Drag to move and rotate the source galaxy/i);
  assert.match(html, /href="\/"[^>]*><span class="desktop-only">Main<\/span><span class="mobile-only">Main<\/span><\/a>/i);
  assert.match(html, /href="\/side"[^>]*><span class="desktop-only">Side<\/span><span class="mobile-only">Side<\/span><\/a>/i);

});

test("shelf image proportions and enlarged card quality are preserved", async ({ page }, testInfo) => {
  await page.goto("/side");
  const cover = page.locator(".listening-cover-thumbnail img").first();
  await cover.scrollIntoViewIfNeeded();
  const coverBox = await cover.boundingBox();
  assert.ok(coverBox);
  expect(Math.abs(coverBox.width - coverBox.height)).toBeLessThan(2);
  const card = page.locator(".pokemon-card-thumbnail img").nth(4);
  await card.scrollIntoViewIfNeeded();
  const cardBox = await card.boundingBox();
  assert.ok(cardBox);
  expect(Math.abs(cardBox.height / cardBox.width - 447 / 320)).toBeLessThan(0.02);
  await card.click();
  const viewer = page.getByRole("dialog");
  await expect(viewer).toBeVisible();
  const expanded = viewer.locator("img");
  await expect.poll(() => expanded.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await expanded.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(/\.webp$/);
  await expect(viewer.getByRole("link")).toHaveAttribute("href", /tcgcollector/);
  await page.screenshot({ path: testInfo.outputPath("card-viewer.png") });
  await page.keyboard.press("Escape");
  await expect(viewer).toHaveCount(0);
});

test("mobile playback stays interactive under CPU throttling", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await session.send("Performance.enable");
  await page.goto("/playground");
  await page.getByRole("button", { name: "Black-Hole Growth Simulator", exact: true }).click();
  await page.getByRole("button", { name: "Play growth", exact: true }).click();
  await page.getByRole("button", { name: "Pause growth", exact: true }).click();
  await page.getByRole("button", { name: "Rapid growth", exact: true }).click();
  await expect(page.getByRole("button", { name: "Rapid growth", exact: true })).toHaveAttribute("aria-pressed", "true");
  const metrics = await session.send("Performance.getMetrics");
  await testInfo.attach("cpu-throttled-performance.json", { body: JSON.stringify(metrics, null, 2), contentType: "application/json" });
  await session.detach();
});
