import { expect, test, type Page } from "@playwright/test";

const direct = { seed: 5, start: 20, end: 7, rate: 1, duty: 0.7, spin: 0.7 };
const rapid = { seed: 4, start: 25, end: 7, rate: 1.5, duty: 0.9, spin: 0.4 };

async function expectGrowth(page: Page, progress: number, preset = direct) {
  // Independently check the closed-form model, not only agreement between DOM labels.
  const hubbleTime = 9.778 / 0.674;
  const age = (z: number) => 2 * hubbleTime / (3 * Math.sqrt(0.685))
    * Math.asinh(Math.sqrt(0.685 / 0.315) / (1 + z) ** 1.5);
  const z1 = 1 + Math.cbrt(1 - preset.spin ** 2) * (Math.cbrt(1 + preset.spin) + Math.cbrt(1 - preset.spin));
  const z2 = Math.sqrt(3 * preset.spin ** 2 + z1 ** 2);
  const radius = 3 + z2 - Math.sign(preset.spin || 1) * Math.sqrt((3 - z1) * (3 + z1 + 2 * z2));
  const efficiency = 1 - Math.sqrt(1 - 2 / (3 * radius));
  const growthTime = age(preset.end) - age(preset.start);
  const growthDex = growthTime / (0.45 * efficiency / ((1 - efficiency) * preset.rate * preset.duty)) / Math.LN10;
  const logMass = preset.seed + growthDex * progress;
  const scaleFactor = (Math.sinh(3 * Math.sqrt(0.685) * (age(preset.start) + growthTime * progress)
    / (2 * hubbleTime)) / Math.sqrt(0.685 / 0.315)) ** (2 / 3);
  const redshift = Math.max(0, 1 / scaleFactor - 1).toFixed(1);
  const mass = logMass < 6
    ? await page.evaluate((value) => `${new Intl.NumberFormat().format(Math.round(10 ** value))} M☉`, logMass)
    : `${(10 ** (logMass - Math.floor(logMass))).toFixed(2)} × 10^${Math.floor(logMass)} M☉`;
  const maximum = Math.max(20, Math.ceil(preset.seed + growthDex + 0.25));
  const x = 58 + progress * 540;
  const y = 205 - ((Math.min(maximum, Math.max(1, logMass)) - 1) / (maximum - 1)) * 185;
  const section = page.locator("#black-hole-growth");
  await expect(section.locator(".simulator-now span")).toHaveText(`z = ${redshift}`);
  await expect(section.locator(".simulator-now strong")).toHaveText(mass);
  const hit = section.getByRole("slider", { name: "Inspect growth time" });
  await expect(hit).toHaveAttribute("aria-valuenow", String(Math.round(progress * 100)));
  await expect(hit).toHaveAttribute("aria-valuetext", `z = ${redshift}, ${mass}`);
  const geometry = await section.evaluate((element) => ({
    mass: Number((element.querySelector(".black-hole-stage") as HTMLElement).style.getPropertyValue("--mass-scale")),
    line: ["x1", "x2"].map((name) => Number(element.querySelector(".growth-chart-progress")!.getAttribute(name))),
    markers: [...element.querySelectorAll(".growth-chart-marker, .growth-chart-marker-hit")]
      .map((marker) => ["cx", "cy"].map((name) => Number(marker.getAttribute(name)))),
  }));
  expect(geometry.mass).toBeCloseTo(Math.max(0, (logMass - 1) / 14), 10);
  geometry.line.forEach((value) => expect(value).toBeCloseTo(x, 9));
  geometry.markers.forEach(([cx, cy]) => {
    expect(cx).toBeCloseTo(x, 9);
    expect(cy).toBeCloseTo(y, 9);
  });
}

async function frame(page: Page, time: number) {
  await page.evaluate((now) => (window as unknown as { growthTestFrame(now: number): void }).growthTestFrame(now), time);
}

test("black-hole drawing preserves the model, playback clock, controls and restored state", async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/gc/**", (route) => route.fulfill(route.request().url().endsWith(".js")
    ? { contentType: "application/javascript", body: "" } : { json: { count: "123" } }));
  await page.route("https://webring.ca/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.goto("/playground#black-hole-growth");
  const section = page.locator("#black-hole-growth");
  const scene = section.locator(".black-hole-stage");
  const view = async () => {
    const planes = await scene.evaluate((element: HTMLElement) => {
      const mass = Number(element.style.getPropertyValue("--mass-scale"));
      const touch = matchMedia("(hover: none), (pointer: coarse)").matches;
      const scale = touch ? (102 + 208 * mass) / 310 : 1;
      return [...element.querySelectorAll<HTMLElement>(".black-hole-orbit-plane")].map((plane) => {
        const pitch = parseFloat(plane.style.transform.match(/rotateX\(([-\d.]+)deg\)/)?.[1]
          ?? element.style.getPropertyValue("--view-pitch"));
        const yaw = parseFloat(plane.style.transform.match(/rotateZ\(([-\d.]+)deg\)/)?.[1]
          ?? element.style.getPropertyValue("--view-yaw"));
        const actual = new DOMMatrix(getComputedStyle(plane).transform).toFloat64Array();
        const expected = new DOMMatrix().rotateAxisAngle(1, 0, 0, pitch)
          .rotateAxisAngle(0, 0, 1, yaw).scale(scale, scale).toFloat64Array();
        return {
          angles: [`${yaw.toFixed(1)}deg`, `${pitch.toFixed(1)}deg`],
          touch, inline: plane.style.transform,
          error: Math.max(...actual.map((value, index) => Math.abs(value - expected[index]))),
        };
      });
    });
    expect(planes).toHaveLength(2);
    expect(planes[1].angles).toEqual(planes[0].angles);
    for (const plane of planes) {
      expect(plane.error).toBeLessThan(0.00001);
      expect(plane.inline === "").toBe(plane.touch);
    }
    return planes[0].angles;
  };
  const marker = section.getByRole("slider", { name: "Inspect growth time" });
  const button = (name: string) => section.getByRole("button", { name, exact: true });
  await scene.scrollIntoViewIfNeeded();
  await expect(section).not.toHaveClass(/experiment-is-paused/);
  await expectGrowth(page, 1);
  expect(await view()).toEqual(["-9.0deg", "84.0deg"]);
  await page.evaluate(() => {
    const request = window.requestAnimationFrame;
    const cancel = window.cancelAnimationFrame;
    const descriptor = Object.getOwnPropertyDescriptor(performance, "now");
    const callbacks = new Map<number, FrameRequestCallback>();
    let id = 1_000_000;
    let time = 0;
    Object.defineProperty(performance, "now", { configurable: true, value: () => time });
    window.requestAnimationFrame = (callback) => { callbacks.set(++id, callback); return id; };
    window.cancelAnimationFrame = (frame) => { callbacks.delete(frame); cancel.call(window, frame); };
    Object.assign(window, {
      growthTestFrame(now: number) {
        time = now;
        const batch = [...callbacks.values()]; callbacks.clear();
        batch.forEach((callback) => callback(now));
      },
      restoreGrowthFrames() {
        window.requestAnimationFrame = request;
        window.cancelAnimationFrame = cancel;
        if (descriptor) Object.defineProperty(performance, "now", descriptor);
        else Reflect.deleteProperty(performance, "now");
        callbacks.clear();
      },
    });
  });
  try {
    const bounds = (await scene.boundingBox())!;
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    await page.mouse.move(x, y); await page.mouse.down();
    // Start the calibrated gesture fresh instead of replaying down over capture.
    await scene.evaluate(element => element.releasePointerCapture(1));
    await scene.dispatchEvent("pointerdown", { pointerId: 1, clientX: x, clientY: y });
    await scene.dispatchEvent("pointermove", { pointerId: 1, clientX: x + 20, clientY: y + 20 });
    await scene.dispatchEvent("pointercancel", { pointerId: 1 });
    await page.mouse.up();
    expect(await view()).toEqual(["2.0deg", "75.6deg"]);
    await button("Play growth").dispatchEvent("click");
    await expectGrowth(page, 0.02);
    await frame(page, 4_165); // Half of the original 8,330 ms restart interval.
    const half = 0.02 + (1 - 0.5 ** 1.7) * 0.98;
    await expectGrowth(page, half);
    await button("Pause growth").dispatchEvent("click");
    await frame(page, 6_000);
    await expectGrowth(page, half);
    await button("Advanced settings").dispatchEvent("click"); // A React render must retain the last frame.
    await expectGrowth(page, half);
    expect(await view()).toEqual(["2.0deg", "75.6deg"]);
    if (isMobile) {
      const toggle = page.getByRole("button", { name: "Black-Hole Growth Simulator", exact: true });
      await toggle.dispatchEvent("click");
      await expect(section).toBeHidden();
      await toggle.dispatchEvent("click");
      await expect(section).toBeVisible();
      await expect(section).not.toHaveClass(/experiment-is-paused/);
      await expectGrowth(page, half);
      expect(await view()).toEqual(["2.0deg", "75.6deg"]);
    }
    await button("Continue growth").dispatchEvent("click");
    await frame(page, 6_600);
    await expectGrowth(page, half + (1 - (1 - 600 / Math.max(1_500, 8_500 * (1 - half))) ** 1.7) * (1 - half));
    await button("Pause growth").dispatchEvent("click");
    await marker.dispatchEvent("keydown", { key: "End" });
    await marker.dispatchEvent("keydown", { key: "ArrowLeft" });
    await expectGrowth(page, 0.99);
    await button("Continue growth").dispatchEvent("click");
    await frame(page, 7_350); // Near the end, playback still has its 1,500 ms minimum.
    await expectGrowth(page, 0.99 + (1 - 0.5 ** 1.7) * 0.01);
    await frame(page, 8_100);
    await expectGrowth(page, 1);
    await expect(button("Play growth")).toHaveCount(1);

    await button("Play growth").dispatchEvent("click");
    await button("Rapid growth").dispatchEvent("click"); // Changing a preset stops an active clock.
    await expectGrowth(page, 1, rapid);
    await frame(page, 9_000);
    await expectGrowth(page, 1, rapid);
    await marker.dispatchEvent("keydown", { key: "Home" });
    await expectGrowth(page, 0, rapid);
    await button("Rapid growth").dispatchEvent("click"); // Reapplying an unchanged preset still resets progress.
    await expectGrowth(page, 1, rapid);
    await button("Reset").dispatchEvent("click");
    await expectGrowth(page, 1);
    expect(await view()).toEqual(["-9.0deg", "84.0deg"]);
    expect(errors).toEqual([]);
  } finally {
    await page.evaluate(() => (window as unknown as { restoreGrowthFrames(): void }).restoreGrowthFrames());
  }
});
