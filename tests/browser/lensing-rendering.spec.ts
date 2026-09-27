import { expect, test, type Page } from "@playwright/test";

async function expectLens(page: Page, x: number, y: number, rotation = -22, mass = 12, distance = 0.5, size = 10) {
  const radius = Math.min(138, Math.max(18, 55 * Math.sqrt(10 ** (mass - 12) * distance / 0.5)));
  const beta = Math.hypot(x - 310, y - 185);
  const u = Math.max(beta / radius, 0.025);
  const magnification = (u * u + 2) / (u * Math.sqrt(u * u + 4));
  const separation = Math.sqrt(beta * beta + 4 * radius * radius);
  const ring = Math.min(1, Math.max(0, 1 - beta / (radius * 0.42)));
  const section = page.locator("#gravitational-lensing");
  await expect(section.locator(".lensing-results dd")).toHaveText([
    `${radius.toFixed(1)} display units`, beta < 1 ? "> 40×" : `${magnification.toFixed(2)}×`,
    `${separation.toFixed(1)} display units`,
  ]);
  await expect(section.locator(".lensing-instruction strong")).toHaveText(ring > 0.82 ? "Einstein ring" : "Two-image lens");
  const actual = await section.evaluate(element => {
    const numbers = (value: string | null) => (value?.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);
    const source = element.querySelector(".lensing-source")!;
    const depth = element.querySelector(".lensing-depth-source")!;
    return {
      source: numbers(source.getAttribute("transform")),
      radius: Number(element.querySelector(".einstein-guide")!.getAttribute("r")),
      ring: Number((element.querySelector(".einstein-ring") as SVGElement).style.opacity),
      images: ["plus", "minus"].map(name => {
        const image = element.querySelector(`.lensing-image--${name}`)!;
        return { visible: getComputedStyle(image).display !== "none", transform: numbers(image.getAttribute("transform")),
          radii: [...image.querySelectorAll("ellipse")].map(ellipse => ["rx", "ry"].map(attribute => Number(ellipse.getAttribute(attribute)))) };
      }),
      depth: numbers(depth.getAttribute("transform")),
      depthRotation: numbers(depth.querySelector("g")!.getAttribute("transform")),
      depthLabel: Number(depth.querySelector("text")!.getAttribute("y")),
      paths: [...element.querySelectorAll(".lensing-light-path")].map(path => numbers(path.getAttribute("d"))),
      size: Number(source.querySelector(".lensing-source-disk")!.getAttribute("rx")),
    };
  });
  [x, y, rotation].forEach((value, index) => expect(actual.source[index]).toBeCloseTo(value, 8));
  expect(actual.radius).toBeCloseTo(radius, 8);
  expect(actual.ring).toBeCloseTo(ring, 6);
  expect(actual.size).toBeCloseTo(size * 1.7, 8);
  const direction = beta > 0.01 ? [(x - 310) / beta, (y - 185) / beta] : [1, 0];
  actual.images.forEach((image, index) => {
    expect(image.visible).toBe(ring < 0.94);
    const theta = (beta + (index === 0 ? separation : -separation)) / 2;
    const imageMagnification = (magnification + (index === 0 ? 1 : -1)) / 2;
    [310 + direction[0] * theta, 185 + direction[1] * theta, Math.atan2(direction[1], direction[0]) * 180 / Math.PI + 90]
      .forEach((value, part) => expect(image.transform[part]).toBeCloseTo(value, 8));
    const tangent = Math.min(78, Math.max(size, size * Math.sqrt(Math.max(imageMagnification, 0.1)) * 1.55));
    const radial = Math.min(size, Math.max(3.2, size / Math.sqrt(Math.max(imageMagnification, 0.2))));
    [[1, 1], [0.56, 0.55], [0.82, 0.74]].forEach(([a, b], part) => {
      expect(image.radii[part][0]).toBeCloseTo(tangent * a, 8);
      expect(image.radii[part][1]).toBeCloseTo(radial * b, 8);
    });
  });
  const depthX = 430 + distance * 150;
  const depthY = 46 + Math.min(20, Math.max(-20, (y - 185) * 0.12));
  expect(actual.depth[0]).toBeCloseTo(depthX, 8);
  expect(actual.depth[1]).toBeCloseTo(depthY, 8);
  expect(actual.depthRotation).toEqual([rotation]);
  expect(actual.depthLabel).toBe(depthY > 52 ? -24 : 30);
  [[depthX, depthY, (depthX + 286) / 2, 23, 286, 34, 170, 43, 62, 46],
    [depthX, depthY, (depthX + 286) / 2, 69, 286, 58, 170, 49, 62, 46]]
    .forEach((path, index) => path.forEach((value, part) => expect(actual.paths[index][part]).toBeCloseTo(value, 8)));
}

test("lensing drawing preserves its analytic images, tween, pointer flush and restored controls", async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/gc/**", route => route.fulfill(route.request().url().endsWith(".js")
    ? { contentType: "application/javascript", body: "" } : { json: { count: "123" } }));
  await page.route("https://webring.ca/**", route => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.goto("/playground#gravitational-lensing");
  const section = page.locator("#gravitational-lensing");
  const canvas = section.locator(".lensing-canvas");
  await canvas.scrollIntoViewIfNeeded();
  await expect(section).not.toHaveClass(/experiment-is-paused/);
  await expectLens(page, 410, 135);
  await page.evaluate(() => {
    const request = window.requestAnimationFrame, cancel = window.cancelAnimationFrame, originalNow = performance.now;
    let time = 0, id = 1_000_000;
    const callbacks = new Map<number, FrameRequestCallback>();
    performance.now = () => time;
    window.requestAnimationFrame = callback => { callbacks.set(++id, callback); return id; };
    window.cancelAnimationFrame = frame => { callbacks.delete(frame); cancel.call(window, frame); };
    Object.assign(window, {
      lensTestFrame(elapsed: number) {
        time += elapsed;
        const batch = [...callbacks.values()]; callbacks.clear();
        batch.forEach(callback => callback(time));
      },
      restoreLensFrames() {
        performance.now = originalNow; window.requestAnimationFrame = request; window.cancelAnimationFrame = cancel; callbacks.clear();
      },
    });
  });
  const frame = async (elapsed: number) => page.evaluate(elapsed => (window as unknown as { lensTestFrame(elapsed: number): void }).lensTestFrame(elapsed), elapsed);
  const button = (name: string) => section.getByRole("button", { name, exact: true });
  const slider = async (name: string, value: string) => {
    const input = section.getByRole("slider", { name, exact: true });
    await input.fill(value); await input.dispatchEvent("pointerup", { pointerId: 1 });
  };
  const dragTo = async (x: number, y: number, delta = 0) => {
    const bounds = (await canvas.boundingBox())!;
    const clientX = bounds.x + x / 620 * bounds.width, clientY = bounds.y + y / 370 * bounds.height;
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    // Release native setup capture before starting at the precise test coordinate.
    await canvas.evaluate(element => element.releasePointerCapture(1));
    await canvas.dispatchEvent("pointerdown", { pointerId: 1, clientX: clientX - delta, clientY });
    await canvas.dispatchEvent("pointermove", { pointerId: 1, clientX, clientY });
    await canvas.dispatchEvent("pointercancel", { pointerId: 1 });
    await page.mouse.up();
  };
  try {
    await button("Perfect alignment").dispatchEvent("click");
    await frame(130); // Half the original duration: cubic ease-out is 7/8 complete.
    await expectLens(page, 322.5, 178.75);
    await slider("Source size", "18"); // A React control render must retain that exact tween frame.
    await expectLens(page, 322.5, 178.75, -22, 12, 0.5, 18);
    await frame(130);
    await expectLens(page, 310, 185, -22, 12, 0.5, 18);

    await button("Reset").dispatchEvent("click");
    await frame(130);
    await expectLens(page, 397.5, 141.25);
    await frame(130);
    await expectLens(page, 410, 135);
    await dragTo(314.3, 185, 20);
    await expectLens(page, 314.3, 185, -8);
    await dragTo(314, 185);
    await expectLens(page, 314, 185, -8); // Label crosses .82 while both images remain.
    await dragTo(311.5, 185);
    await expectLens(page, 311.5, 185, -8);
    await dragTo(311.2, 185);
    await expectLens(page, 311.2, 185, -8); // Image visibility crosses .94 separately.
    await dragTo(1000, -100);
    await expectLens(page, 596, 24, -8); // Pointer cancellation flushes the final clamped sample.

    await slider("Lens mass", "13.5");
    await slider("Distance factor", "0.9");
    await expectLens(page, 596, 24, -8, 13.5, 0.9);
    await slider("Lens mass", "10");
    await slider("Distance factor", "0.1");
    await expectLens(page, 596, 24, -8, 10, 0.1);
    let resetFrom = { x: 596, y: 24 };
    if (isMobile) {
      const toggle = page.getByRole("button", { name: "Gravitational Lensing Sandbox", exact: true });
      await toggle.dispatchEvent("click"); await expect(section).toBeHidden();
      await toggle.dispatchEvent("click"); await expect(section).toBeVisible();
      await expect(section).not.toHaveClass(/experiment-is-paused/);
      await expectLens(page, 596, 24, -8, 10, 0.1);
      // Hiding a captured gesture cancels its queued sample and releases the
      // interaction state, so later alignment still starts its normal tween.
      await canvas.scrollIntoViewIfNeeded();
      const bounds = (await canvas.boundingBox())!;
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await page.mouse.down();
      await toggle.dispatchEvent("click"); await expect(section).toBeHidden();
      await page.mouse.up();
      await toggle.dispatchEvent("click"); await expect(section).toBeVisible();
      await expect(section).not.toHaveClass(/experiment-is-paused/);
      await expectLens(page, 596, 24, -8, 10, 0.1);
      await button("Perfect alignment").dispatchEvent("click");
      await frame(260);
      await expectLens(page, 310, 185, -8, 10, 0.1);
      resetFrom = { x: 310, y: 185 };
    }
    await button("Reset").dispatchEvent("click");
    await expectLens(page, resetFrom.x, resetFrom.y); // Rotation and controls reset before the position tween.
    await frame(260);
    await expectLens(page, 410, 135);
    // Losing capture outside the drawing must release the drag, even if its
    // eventual pointerup is delivered elsewhere on the page.
    await canvas.scrollIntoViewIfNeeded();
    const bounds = (await canvas.boundingBox())!;
    await page.mouse.move(bounds.x + 410 / 620 * bounds.width, bounds.y + 135 / 370 * bounds.height);
    await page.mouse.down();
    // Process the browser's pending capture before releasing it.
    await page.mouse.move(bounds.x + 410 / 620 * bounds.width + 1, bounds.y + 135 / 370 * bounds.height);
    await page.mouse.move(bounds.x + 410 / 620 * bounds.width, bounds.y + 135 / 370 * bounds.height);
    await canvas.evaluate(element => element.releasePointerCapture(1));
    await page.mouse.move(1, 1);
    await page.mouse.up();
    await button("Perfect alignment").dispatchEvent("click");
    await frame(260);
    await expectLens(page, 310, 185);
    expect(errors).toEqual([]);
  } finally {
    await page.evaluate(() => (window as unknown as { restoreLensFrames(): void }).restoreLensFrames());
  }
});
