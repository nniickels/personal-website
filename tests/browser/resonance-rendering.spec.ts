import { test, expect, type Page } from "@playwright/test";

test("upfront resonance hydrates with reduced motion and preserves manual play across accordion changes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/gc/**", (route) => route.fulfill(route.request().url().endsWith(".js")
    ? { contentType: "application/javascript", body: "" } : { json: { count: "123" } }));
  await page.route("https://webring.ca/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.setViewportSize({ width: 393, height: 851 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/playground#orbital-resonance");
  const experiment = page.locator("#orbital-resonance");
  await expect(experiment.getByRole("button", { name: "Play orbits", exact: true })).toBeVisible();
  await expectOrbits(page, 0, [1, 2, 4]);
  await experiment.getByRole("button", { name: "Play orbits", exact: true }).click();
  const toggle = page.getByRole("button", { name: "Orbital Resonance Toy", exact: true });
  await toggle.click();
  await expect(experiment).toBeHidden();
  await toggle.click();
  await expect(experiment.getByRole("button", { name: "Pause orbits", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

async function frame(page: Page, time: number) {
  await page.evaluate((now) => (window as unknown as { orbitTestFrame(time: number): void }).orbitTestFrame(now), time);
}

async function expectOrbits(page: Page, phase: number, periods: readonly number[]) {
  const scene = page.locator(".resonance-canvas");
  await expect(scene.locator(".resonance-body")).toHaveCount(periods.length);
  await expect(scene.locator(".resonance-spoke")).toHaveCount(periods.length > 1 ? periods.length : 0);
  await expect(page.locator("#orbital-resonance dt", { hasText: "Inner-orbit phase" }).locator("..").locator("dd"))
    .toHaveText(`${(phase % 1).toFixed(2)} turns`);
  const positions = await scene.evaluate((svg) => ({
    bodies: [...svg.querySelectorAll(".resonance-body")].map((body) =>
      body.getAttribute("transform")!.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)!.map(Number)),
    spokes: [...svg.querySelectorAll(".resonance-spoke")].map((spoke) =>
      ["x1", "y1", "x2", "y2"].map((attribute) => Number(spoke.getAttribute(attribute)))),
  }));
  periods.forEach((period, index) => {
    const radius = [46, 76, 108, 140, 172][index];
    const angle = (phase / period) * Math.PI * 2 - Math.PI / 2;
    const x = 310 + radius * Math.cos(angle);
    const y = 190 + radius * 0.58 * Math.sin(angle);
    expect(positions.bodies[index][0]).toBeCloseTo(x, 7);
    expect(positions.bodies[index][1]).toBeCloseTo(y, 7);
    if (periods.length > 1) {
      expect(positions.spokes[index].slice(0, 2)).toEqual([310, 190]);
      expect(positions.spokes[index][2]).toBeCloseTo(x, 7);
      expect(positions.spokes[index][3]).toBeCloseTo(y, 7);
    }
  });
}

test("orbit drawing preserves geometry, paused controls, the stall cap and phase wrap", async ({ page }) => {
  await page.route("**/gc/**", (route) => route.fulfill(route.request().url().endsWith(".js")
    ? { contentType: "application/javascript", body: "" } : { json: { count: "123" } }));
  await page.route("https://webring.ca/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/playground#orbital-resonance");
  const experiment = page.locator("#orbital-resonance");
  const scene = experiment.locator(".resonance-canvas");
  const periods = [1, 1.5, 2.25, 3.375, 5.0625];
  await expect(experiment.getByRole("button", { name: "Play orbits", exact: true })).toBeVisible();
  await experiment.getByRole("button", { name: "5", exact: true }).click();
  await experiment.getByRole("combobox").selectOption("3:2");
  await expectOrbits(page, 0, periods);
  await scene.scrollIntoViewIfNeeded();

  // Hold native display callbacks rather than inspecting or changing React state.
  await page.evaluate(() => {
    const request = window.requestAnimationFrame;
    const cancel = window.cancelAnimationFrame;
    const callbacks = new Map<number, FrameRequestCallback>();
    let id = 1_000_000;
    window.requestAnimationFrame = (callback) => { callbacks.set(++id, callback); return id; };
    window.cancelAnimationFrame = (frame) => { callbacks.delete(frame); cancel.call(window, frame); };
    Object.assign(window, {
      orbitTestFrame(now: number) {
        const batch = [...callbacks.values()]; callbacks.clear();
        batch.forEach((callback) => callback(now));
      },
      restoreOrbitFrames() {
        window.requestAnimationFrame = request;
        window.cancelAnimationFrame = cancel;
        callbacks.clear();
      },
    });
  });
  try {
    const bounds = (await scene.boundingBox())!;
    const at = (angle: number) => ({
      pointerId: 1,
      clientX: bounds.x + ((310 + 60 * Math.cos(angle)) / 620) * bounds.width,
      clientY: bounds.y + ((190 + 60 * 0.58 * Math.sin(angle)) / 380) * bounds.height,
    });
    await page.mouse.move(at(0).clientX, at(0).clientY); await page.mouse.down();
    // Start the calibrated gesture fresh instead of replaying down over capture.
    await scene.evaluate(element => element.releasePointerCapture(1));
    await scene.dispatchEvent("pointerdown", at(0));
    await scene.dispatchEvent("pointermove", at(-Math.PI / 2));
    await scene.dispatchEvent("pointerup", { pointerId: 1 });
    await page.mouse.up();
    await expectOrbits(page, 99.75, periods);

    const speed = experiment.getByRole("slider", { name: "Animation speed", exact: true });
    await speed.fill("10");
    await speed.dispatchEvent("pointerup", { pointerId: 1 });
    await expect(speed.locator("..").locator("output")).toHaveText("10×");
    await expectOrbits(page, 99.75, periods);
    await experiment.getByRole("button", { name: "Play orbits", exact: true }).click();
    await frame(page, 0);
    await frame(page, 1_000); // A one-second stall advances only the existing 50 ms cap.
    await expectOrbits(page, 99.81, periods);
    for (const time of [1_050, 1_100, 1_150, 1_200]) await frame(page, time);
    await expectOrbits(page, 0.05, periods);
    await experiment.getByRole("button", { name: "Pause orbits", exact: true }).click();
    await frame(page, 2_000);
    await expectOrbits(page, 0.05, periods);

    await experiment.getByRole("combobox").selectOption("2:1");
    await expectOrbits(page, 0, [1, 2, 4, 8, 16]);
    await experiment.getByRole("button", { name: "1", exact: true }).click();
    await expectOrbits(page, 0, [1]);
    await expect(experiment.getByRole("combobox")).toBeDisabled();
    await experiment.getByRole("button", { name: "Reset", exact: true }).click();
    await expectOrbits(page, 0, [1, 2, 4]);
    await expect(speed).toHaveValue("1");
    await frame(page, 3_000);
    await frame(page, 3_050);
    await expectOrbits(page, 0.006, [1, 2, 4]);
    await experiment.getByRole("button", { name: "Pause orbits", exact: true }).click();
    await experiment.getByRole("button", { name: "3", exact: true }).click();
    await expectOrbits(page, 0, [1, 2, 4]); // Choosing the current count still resets.
  } finally {
    await page.evaluate(() => (window as unknown as { restoreOrbitFrames(): void }).restoreOrbitFrames());
  }
});
