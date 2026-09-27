import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/gc/**", (route) => route.fulfill({ body: "" }));
  await page.route("https://webring.ca/**", (route) => route.fulfill({ body: "" }));
});

test("navigation warms only the intended document and remains a native link", async ({ page }) => {
  await page.goto("/");
  const side = page.getByRole("link", { name: "Switch to Side", exact: true });
  await expect(page.getByRole("button", { name: /Switch to .* mode/ })).toBeVisible();
  await expect(page.locator('link[rel="prefetch"]')).toHaveCount(0);
  await side.focus();
  const hint = page.locator('link[rel="prefetch"][as="document"]');
  await expect(hint).toHaveCount(1);
  await expect(hint).toHaveAttribute("href", /\/side$/);
  await side.hover();
  await expect(hint).toHaveCount(1);
  await side.click();
  await expect(page).toHaveURL(/\/side$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test("composited black-hole streaks retain circular paths and fixed orientation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Streaks are intentionally hidden by existing touch styles");
  await page.goto("/playground");
  const stage = page.locator(".black-hole-stage");
  await expect(stage).toBeVisible();
  for (const mass of [0, 0.528718, 0.938, 2.5]) {
    for (const direction of ["normal", "reverse"]) {
      const positions = await stage.evaluate(async (element, { mass, direction }) => {
        const stage = element as HTMLElement;
        stage.style.setProperty("--mass-scale", String(mass));
        stage.querySelectorAll<HTMLElement>(".black-hole-orbit-plane").forEach((plane) => {
          plane.style.transform = "rotateX(0deg) rotateZ(0deg)";
        });
        stage.style.setProperty("--spin-direction", direction);
        stage.getBoundingClientRect();
        const flows = [...stage.querySelectorAll<HTMLElement>(".accretion-flow")];
        const animations = flows.map((flow) => flow.getAnimations()[0]);
        animations.forEach((animation) => animation.pause());
        await Promise.all(animations.map((animation) => animation.ready));
        animations.forEach((animation) => { animation.currentTime = 527; });
        return flows.map((flow, index) => {
          const rect = flow.getBoundingClientRect();
          const plane = flow.closest(".black-hole-orbit-plane")!.getBoundingClientRect();
          const radius = plane.width * (flow.classList.contains("accretion-flow--outer") ? 0.43 : flow.classList.contains("accretion-flow--inner") ? 0.27 : 0.34);
          const angle = Number(animations[index].effect!.getComputedTiming().progress) * 2 * Math.PI;
          return {
            x: rect.x + rect.width / 2, y: rect.y + rect.height / 2,
            expectedX: plane.x + plane.width / 2 + radius * Math.cos(angle),
            expectedY: plane.y + plane.height / 2 + radius * Math.sin(angle),
            width: rect.width, height: rect.height,
            expectedWidth: flow.classList.contains("accretion-flow--outer") ? 34 : flow.classList.contains("accretion-flow--inner") ? 16 : 24,
          };
        });
      }, { mass, direction });
      expect(positions).toHaveLength(6);
      for (const position of positions) {
        expect(Math.abs(position.x - position.expectedX)).toBeLessThan(0.2);
        expect(Math.abs(position.y - position.expectedY)).toBeLessThan(0.2);
        expect(Math.abs(position.width - position.expectedWidth)).toBeLessThan(0.01);
        expect(Math.abs(position.height - 5)).toBeLessThan(0.01);
      }
    }
  }
});
