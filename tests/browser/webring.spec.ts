import { test, expect } from "@playwright/test";

test("webring links ask before leaving the page", async ({ page }, testInfo) => {
  test.skip(!["desktop", "mobile"].includes(testInfo.project.name));
  await page.route("https://webring.ca/embed.js", route => route.fulfill({
    contentType: "application/javascript",
    body: `const host = document.querySelector('[data-webring="ca"]');
      host.attachShadow({mode:'open'}).innerHTML = '<nav><a href="https://webring.ca/prev/nicole-jiang">←</a><a href="https://webring.ca/">Leaf</a><a href="https://webring.ca/next/nicole-jiang">→</a></nav>';`,
  }));
  await page.route("https://webring.ca/next/nicole-jiang", route => route.fulfill({ body: "Next member" }));
  await page.route("**/gc/**", route => route.fulfill({ body: "" }));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const widget = page.locator(".footer-webring");
  const popup = page.getByRole("dialog");
  await widget.getByRole("link", { name: "Leaf", exact: true }).click();
  await expect(popup).toHaveAccessibleName("Redirect to WebRing?");
  await popup.getByRole("button", { name: "No", exact: true }).click();
  await expect(popup).not.toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await widget.getByRole("link", { name: "←", exact: true }).click();
  await expect(popup).toHaveAccessibleName("Redirect to WebRing member?");
  await page.keyboard.press("Escape");
  await expect(popup).not.toBeVisible();
  await widget.getByRole("link", { name: "→", exact: true }).click();
  await expect(popup).toHaveAccessibleName("Redirect to WebRing member?");
  await popup.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page).toHaveURL("https://webring.ca/next/nicole-jiang");
});
