import { test, expect } from "@playwright/test";

for (const system of ["light", "dark"] as const) {
  test(`theme follows the ${system} system preference until a manual choice`, async ({ page }) => {
    const opposite = system === "light" ? "dark" : "light";
    await page.emulateMedia({ colorScheme: system, reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", system);
    await expect(page.getByRole("button", { name: `Switch to ${opposite} mode` })).toBeVisible();
    await page.emulateMedia({ colorScheme: opposite });
    await expect(page.locator("html")).toHaveAttribute("data-theme", opposite);
    await page.getByRole("button", { name: `Switch to ${system} mode` }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", system);
    expect(await page.evaluate(() => localStorage.getItem("portfolio-theme-override"))).toBe(system);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", system);
    await page.emulateMedia({ colorScheme: system });
    await page.emulateMedia({ colorScheme: opposite });
    await expect(page.locator("html")).toHaveAttribute("data-theme", system);
  });
}

test("system theme and manual toggle work when storage is blocked", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.addInitScript(() => {
    for (const method of ["getItem", "setItem"]) {
      Object.defineProperty(Storage.prototype, method, { value() { throw new Error("Storage blocked"); } });
    }
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

for (const referrer of ["https://neocities.org/site/nickels", "https://nickels.neocities.org/"]) {
  test(`Neocities referral starts light and stays light while browsing: ${referrer}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto("/", { referer: referrer });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.locator("footer").getByRole("link", { name: "site map", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.emulateMedia({ colorScheme: "light" });
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
}

test("each Neocities arrival starts light even with a saved dark choice", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("portfolio-theme-override", "dark"));
  for (const referer of ["https://neocities.org/site/nickels", "https://nickels.neocities.org/"]) {
    await page.goto("/", { referer });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.locator("footer").getByRole("link", { name: "site map", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  }
});

for (const saved of ["light", "dark"] as const) {
  test(`returning visitors retain their saved ${saved} choice`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: saved === "light" ? "dark" : "light" });
    await page.addInitScript(value => localStorage.setItem("portfolio-theme-override", value), saved);
    await page.goto("/side");
    await expect(page.locator("html")).toHaveAttribute("data-theme", saved);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", saved);
  });
}

test("a later non-Neocities arrival restores the saved choice", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("portfolio-theme-override", "dark"));
  await page.goto("/", { referer: "https://nickels.neocities.org/" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.goto("/side", { referer: "https://example.org/" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("phone light wallpaper keeps its crop while scrolling", async ({ page }, testInfo) => {
  test.skip(!["mobile", "phone-webkit"].includes(testInfo.project.name));
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/side");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const wallpaper = () => page.evaluate(() => {
    const css = getComputedStyle(document.body, "::before");
    return { position: css.position, top: css.top, width: css.width, height: css.height,
      backgroundSize: css.backgroundSize, backgroundPosition: css.backgroundPosition };
  });
  const before = await wallpaper();
  expect(before.position).toBe("fixed");
  expect(before.backgroundSize).toBe("cover");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await expect.poll(wallpaper).toEqual(before);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(wallpaper).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("unrelated referral keeps the system default", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/", { referer: "https://neocities.org.example.com/" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
