import { test, expect } from "@playwright/test";

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
