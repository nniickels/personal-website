import { test, expect, type Page } from "@playwright/test";

async function advance(page: Page, milliseconds: number) {
  await page.evaluate((elapsed) => {
    (window as unknown as { stellarTestFrame(elapsed: number): void }).stellarTestFrame(elapsed);
  }, milliseconds);
}

test("stellar playback keeps its clock, phase transitions, native range and pending input in sync", async ({ page }) => {
  await page.route("**/gc/**", (route) => route.fulfill(route.request().url().endsWith(".js")
    ? { contentType: "application/javascript", body: "" } : { json: { count: "123" } }));
  await page.route("https://webring.ca/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.goto("/playground#stellar-evolution");
  const experiment = page.locator("#stellar-evolution");
  const range = experiment.getByRole("slider", { name: "Evolution progress", exact: true });
  const status = experiment.locator(".stellar-status span");
  await range.scrollIntoViewIfNeeded();
  await expect(experiment).not.toHaveClass(/experiment-is-paused/);

  // Hold the display clock, not React state. This exercises the same elapsed
  // time equation at both ordinary frames and jumps across phase boundaries.
  await page.evaluate(() => {
    const request = window.requestAnimationFrame;
    const cancel = window.cancelAnimationFrame;
    const originalNow = performance.now;
    let now = originalNow.call(performance);
    const callbacks = new Map<number, FrameRequestCallback>();
    let id = 1_000_000;
    performance.now = () => now;
    window.requestAnimationFrame = (callback) => { callbacks.set(++id, callback); return id; };
    window.cancelAnimationFrame = (frame) => { callbacks.delete(frame); cancel.call(window, frame); };
    Object.assign(window, {
      stellarTestFrame(elapsed: number) {
        now += elapsed;
        const batch = [...callbacks.values()]; callbacks.clear();
        batch.forEach((callback) => callback(now));
      },
      restoreStellarFrames() {
        performance.now = originalNow;
        window.requestAnimationFrame = request;
        window.cancelAnimationFrame = cancel;
        callbacks.clear();
      },
    });
  });
  try {
    for (const profile of [
      { preset: "Sun-like", mass: 1, boundaries: [0.72, 0.82, 0.91], keys: ["main-sequence", "red-giant", "planetary-nebula", "white-dwarf"] },
      { preset: "Massive", mass: 12, boundaries: [0.76, 0.83, 0.91], keys: ["main-sequence", "red-supergiant", "supernova", "neutron-star"] },
      { preset: "Very massive", mass: 30, boundaries: [0.76, 0.83, 0.91], keys: ["main-sequence", "red-supergiant", "supernova", "black-hole"] },
    ]) {
      await experiment.getByRole("button", { name: profile.preset, exact: true }).click();
      const start = profile.boundaries[0] * (5 / 6);
      const anchors = [start, ...profile.boundaries];
      const expected = async (progress: number) => {
        const stage = profile.boundaries.filter((boundary) => progress >= boundary).length;
        await expect(experiment.locator(".stellar-canvas")).toHaveClass(new RegExp(`stellar-canvas--${profile.keys[stage]}$`));
        await expect(status).toHaveText(`${profile.mass.toFixed(1)} M☉ · ${Math.round(progress * 100)}%`);
        const segment = anchors.findIndex((anchor, index) => index > 0 && progress <= anchor);
        const position = progress <= start ? 0 : segment < 0 ? 100
          : ((segment - 1) + (progress - anchors[segment - 1]) / (anchors[segment] - anchors[segment - 1])) * (100 / 3);
        expect(Number(await range.inputValue())).toBeCloseTo(Math.round(position * 10) / 10, 5);
        await expect(experiment.locator('.stellar-timeline button[aria-pressed="true"]')).toHaveCount(1);
      };
      await expected(start);
      await range.focus();
      await experiment.getByRole("button", { name: "Play evolution", exact: true }).evaluate((button: HTMLButtonElement) => button.click());
      let elapsed = 0;
      for (const next of [600, ...profile.boundaries.map((boundary) => (boundary - start) * 18_000 + 1), (1 - start) * 18_000 + 1]) {
        await advance(page, next - elapsed);
        elapsed = next;
        await expected(Math.min(1, start + elapsed / 18_000));
        await expect(range).toBeFocused();
      }
      await expect(experiment.getByRole("button", { name: "Play evolution", exact: true })).toBeVisible();
      // Replaying a completed track starts at the same five-sixths point.
      await experiment.getByRole("button", { name: "Play evolution", exact: true }).evaluate((button: HTMLButtonElement) => button.click());
      await advance(page, 600);
      await expected(start + 600 / 18_000);
      await experiment.getByRole("button", { name: "Pause evolution", exact: true }).evaluate((button: HTMLButtonElement) => button.click());
      await advance(page, 1_000);
      await expected(start + 600 / 18_000);
      await experiment.getByRole("button", { name: "Play evolution", exact: true }).evaluate((button: HTMLButtonElement) => button.click());
      await advance(page, 600);
      await expected(start + 1_200 / 18_000);
      await experiment.getByRole("button", { name: "Pause evolution", exact: true }).evaluate((button: HTMLButtonElement) => button.click());
    }

    // An uncommitted native gesture wins over an intervening preset render.
    await range.fill("80");
    await experiment.getByRole("button", { name: "Sun-like", exact: true }).evaluate((button: HTMLButtonElement) => button.click());
    await expect(range).toHaveValue("80");
    await expect(status).toHaveText("1.0 M☉ · 60%");
    await advance(page, 20);
    await expect(range).toHaveValue("80");
    await expect(status).toHaveText("1.0 M☉ · 86%");
    await expect(experiment.locator(".stellar-canvas")).toHaveClass(/stellar-canvas--planetary-nebula$/);
    // The final phase still uses the original 2.4-second minimum duration.
    await range.fill("100");
    await range.dispatchEvent("pointerup", { pointerId: 1 });
    await expect(status).toHaveText("1.0 M☉ · 91%");
    await experiment.getByRole("button", { name: "Play evolution", exact: true }).evaluate((button: HTMLButtonElement) => button.click());
    await advance(page, 1_200);
    await expect(status).toHaveText("1.0 M☉ · 96%");
    await expect(range).toHaveValue("100");
    await expect(experiment.getByRole("button", { name: "Pause evolution", exact: true })).toBeVisible();
    await advance(page, 1_200);
    await expect(status).toHaveText("1.0 M☉ · 100%");
    await expect(experiment.getByRole("button", { name: "Play evolution", exact: true })).toBeVisible();
  } finally {
    await page.evaluate(() => (window as unknown as { restoreStellarFrames(): void }).restoreStellarFrames());
  }
});
