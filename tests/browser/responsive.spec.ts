import { test, expect } from "@playwright/test";
// vinext declares the optional "sharp" import as unknown; use its own types.
import sharp from "sharp/lib/index.js";
import { readFile } from "node:fs/promises";

test("reading backdrop does not create sideways scrolling in WebKit", async ({ page }) => {
  test.setTimeout(60_000);
  await page.route("**/gc/**", (route) => route.fulfill(route.request().url().endsWith(".js")
    ? { contentType: "application/javascript", body: "" }
    : { json: { count: "123" } }));
  await page.route("https://webring.ca/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.route("**/api/stats", (route) => route.fulfill({ json: {
    spotify: { status: "unavailable", message: "Offline fixture" },
    steam: { status: "unavailable", message: "Offline fixture" },
    clashRoyale: { status: "unavailable", message: "Offline fixture" },
  } }));

  for (const width of [520, 521, 700, 820, 848, 1440]) {
    await page.setViewportSize({ width, height: 1180 });
    for (const route of ["/", "/side", "/playground"]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      for (const theme of ["light", "dark"] as const) {
        if (await page.locator("html").getAttribute("data-theme") !== theme) {
          await page.getByRole("button", { name: /Switch to .* mode/ }).click();
        }
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const overflow = await page.evaluate(() => {
          window.scrollTo({ left: 100, top: 0, behavior: "instant" });
          return { extraWidth: document.documentElement.scrollWidth - innerWidth, scrollX };
        });
        expect(overflow, `${route}, ${width}px, ${theme}`).toEqual({ extraWidth: 0, scrollX: 0 });
      }
    }
  }
});

test("stellar remnants stay centered through phase changes and iPad resizing", async ({ page }, testInfo) => {
  await page.goto("/playground#stellar-evolution");
  const section = page.locator("#stellar-evolution");
  await section.getByRole("button", { name: "Massive", exact: true }).click();
  const scene = section.locator(".stellar-canvas");
  for (const width of [820, 1180, 700, 820]) {
    await page.setViewportSize({ width, height: 1180 });
    for (const phase of ["Core-collapse supernova", "Neutron star", "Red supergiant"]) {
      await section.getByRole("button", { name: phase, exact: true }).click();
      await scene.scrollIntoViewIfNeeded();
      // Check while the object's dimensions are transitioning, not just after
      // settling: all effects must retain the same center on every frame.
      const error = await scene.evaluate(async element => {
        let largest = 0;
        for (let frame = 0; frame < 20; frame++) {
          await new Promise(requestAnimationFrame);
          const bounds = element.getBoundingClientRect();
          for (const selector of [".stellar-object", ".stellar-supernova-shell", ".stellar-burst", ".stellar-pulsar-beams"]) {
            const child = element.querySelector(selector)!.getBoundingClientRect();
            largest = Math.max(largest, Math.abs(child.x + child.width / 2 - bounds.x - bounds.width / 2),
              Math.abs(child.y + child.height / 2 - bounds.y - bounds.height / 2));
          }
        }
        return largest;
      });
      expect(error, `${phase} at ${width}px`).toBeLessThan(1);
    }
  }
  await section.getByRole("button", { name: "Neutron star", exact: true }).click();
  await expect.poll(() => section.locator(".stellar-object").evaluate(el => el.getBoundingClientRect().width)).toBeLessThan(20);
  await scene.screenshot({ path: testInfo.outputPath("neutron-star.png") });
});


test("sticker pixels have no seams at fractional magnification in WebKit", async ({ page }, testInfo) => {
  const source = await sharp(await readFile("public/guestbook/stickers/peony-soft.png"))
    .flatten({ background: "#2b3032" }).removeAlpha().raw().toBuffer();
  const colours = new Set<string>();
  for (let i = 0; i < source.length; i += 3) colours.add(source.subarray(i, i + 3).toString("hex"));
  await page.goto("/side#guestbook");
  // A non-integer art-cell scale exercises the seam seen in the report.
  await page.setContent('<img src="/guestbook/stickers/peony-soft.png" style="display:block;width:472px;height:472px;image-rendering:crisp-edges;background:#2b3032" />');
  const image = page.locator("img");
  await image.evaluate(el => (el as HTMLImageElement).decode());
  const screenshot = await image.screenshot({ path: testInfo.outputPath("peony-magnified.png") });
  const pixels = await sharp(screenshot).removeAlpha().raw().toBuffer();
  const unexpected = new Set<string>();
  for (let i = 0; i < pixels.length; i += 3) {
    const colour = pixels.subarray(i, i + 3).toString("hex");
    if (!colours.has(colour)) unexpected.add(colour);
  }
  expect([...unexpected], "Zoom must not introduce seam or blended colours").toEqual([]);
});
