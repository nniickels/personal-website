import { test, expect } from "@playwright/test";

test("photo gallery deep links open the dropdown on arrival, reload, and hash changes", async ({ page, isMobile }) => {
  await page.route("**/gc/**", route => route.fulfill({ body: "" }));
  await page.route("https://webring.ca/**", route => route.fulfill({ body: "" }));
  await page.route("**/api/stats", route => route.fulfill({ json: {} }));
  await page.goto("/side", { waitUntil: "domcontentloaded" });
  const gallery = page.locator("#photo-gallery > details");
  await expect(gallery).not.toHaveAttribute("open");

  await page.goto("/side#photo-gallery", { waitUntil: "domcontentloaded" });
  await expect(gallery).toHaveAttribute("open");
  await expect(gallery.locator(".photo-gallery-thumbnail").first()).toBeVisible();
  await expect(page.locator("#photo-gallery summary")).toBeInViewport();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(gallery).toHaveAttribute("open");

  await gallery.locator("summary").click();
  await expect(gallery).not.toHaveAttribute("open");
  await page.evaluate(() => { window.location.hash = "listening"; });
  await page.evaluate(() => { window.location.hash = "photo-gallery"; });
  await expect(gallery).toHaveAttribute("open");
  await expect(page.locator("#photo-gallery summary")).toBeInViewport();

  if (!isMobile) {
    await gallery.locator("summary").click();
    await page.getByRole("navigation", { name: "Side sections" }).getByRole("link", { name: "Photo Gallery", exact: true }).click();
    await expect(gallery).toHaveAttribute("open");
  }
});
