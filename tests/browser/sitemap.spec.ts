import { test, expect } from "@playwright/test";

test("footer site map opens a directory with working section links", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(footer).not.toContainText("©");
  await footer.getByRole("link", { name: "site map", exact: true }).click();
  await expect(page).toHaveURL(/\/sitemap$/);
  await expect(page.getByRole("heading", { name: "are you lost?", exact: true })).toBeVisible();
  const directory = page.getByRole("navigation", { name: "Site map", exact: true });
  expect(await directory.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(page.viewportSize()!.width > 700 ? 2 : 1);
  const linkStyles = await directory.locator(".site-map-links a").evaluateAll(links => links.map(link => {
    const style = getComputedStyle(link);
    return [style.fontFamily, style.fontSize, style.fontWeight, style.fontVariant, style.letterSpacing].join("|");
  }));
  expect(new Set(linkStyles).size).toBe(1);
  const headingStyle = await directory.locator("h2").first().evaluate(el => ({ size: parseFloat(getComputedStyle(el).fontSize), weight: getComputedStyle(el).fontWeight }));
  expect(headingStyle.weight).toBe("700");
  expect(headingStyle.size).toBeGreaterThan(await directory.locator(".site-map-links a").first().evaluate(el => parseFloat(getComputedStyle(el).fontSize)));
  const spoilers = directory.locator(".site-map-spoilers");
  await expect(spoilers).not.toHaveAttribute("open");
  await spoilers.getByText("easter eggs (spoilers)", { exact: true }).click();
  await expect(spoilers).toHaveAttribute("open", "");
  await expect(spoilers).toContainText("meteor shower");
  const main = (await directory.getByRole("link", { name: "/main (about me - academic)", exact: true }).boundingBox())!;
  const education = (await directory.getByRole("link", { name: "Education", exact: true }).boundingBox())!;
  const collections = (await directory.getByRole("link", { name: "Collections", exact: true }).boundingBox())!;
  const naturalThings = (await directory.getByRole("link", { name: "Natural Things", exact: true }).boundingBox())!;
  expect(education.x).toBeGreaterThan(main.x);
  expect(naturalThings.x).toBeGreaterThan(collections.x);
  const headerBounds = (await page.locator(".topbar-content").boundingBox())!;
  const footerBounds = (await page.locator(".footer-content").boundingBox())!;
  expect(footerBounds.x).toBeCloseTo(headerBounds.x, 0);
  expect(footerBounds.width).toBeCloseTo(headerBounds.width, 0);
  await expect(directory.getByRole("link", { name: "Guestbook", exact: true })).toHaveAttribute("href", "/side#guestbook");
  for (const name of ["GitHub", "LinkedIn", "Email", "Pinterest", "stats.fm", "Google Maps", "AniList", "Instagram", "Neocities"]) {
    await expect(directory.getByRole("link", { name, exact: true })).toHaveAttribute("href", /^(https:|mailto:)/);
  }
  await expect(directory.getByRole("link", { name: "Neocities", exact: true })).toHaveAttribute("href", "https://neocities.org/site/nickels");
  await directory.getByRole("link", { name: "Education", exact: true }).click();
  await expect(page).toHaveURL(/\/#education$/);
  await expect(page.locator("#education h2")).toBeVisible();
  expect((await page.locator("#education").boundingBox())!.y).toBeGreaterThanOrEqual(48);
  await page.locator("footer").getByRole("link", { name: "site map", exact: true }).click();
  await directory.getByRole("link", { name: "Photo Gallery", exact: true }).click();
  await expect(page).toHaveURL(/\/side#photo-gallery$/);
  await expect(page.locator("#photo-gallery .photo-gallery-grid")).toBeVisible();
  await page.locator("footer").getByRole("link", { name: "site map", exact: true }).click();
  await page.getByRole("navigation", { name: "Site map", exact: true }).getByRole("link", { name: "Stellar Evolution", exact: true }).click();
  await expect(page).toHaveURL(/\/playground#stellar-evolution$/);
  await expect(page.locator(".stellar-canvas")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
