import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/gc/**", (route) => route.fulfill(route.request().url().endsWith(".js")
    ? { contentType: "application/javascript", body: "" } : { json: { count: "123" } }));
  await page.route("https://webring.ca/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
});

// Control display frames, not React: independent input events must update the
// native thumb, while only the latest sample reaches the experiment per frame.
async function holdFrames(page: Page) {
  await page.evaluate(() => {
    const originalRequest = window.requestAnimationFrame;
    const originalCancel = window.cancelAnimationFrame;
    const callbacks = new Map<number, FrameRequestCallback>();
    let id = 1_000_000;
    window.requestAnimationFrame = (callback) => { callbacks.set(++id, callback); return id; };
    window.cancelAnimationFrame = (frame) => { callbacks.delete(frame); originalCancel.call(window, frame); };
    Object.assign(window, {
      testFrame() {
        const batch = [...callbacks.values()]; callbacks.clear();
        batch.forEach((callback) => callback(performance.now()));
      },
      restoreFrames() {
        window.requestAnimationFrame = originalRequest;
        window.cancelAnimationFrame = originalCancel;
        callbacks.clear();
      },
    });
  });
}
async function nextFrame(page: Page) {
  await page.evaluate(() => (window as unknown as { testFrame(): void }).testFrame());
}
async function restoreFrames(page: Page) {
  await page.evaluate(() => (window as unknown as { restoreFrames(): void }).restoreFrames());
}

for (const [id, label] of [
  ["black-hole-growth", "Seed mass"],
  ["stellar-evolution", "Initial mass"],
  ["gravitational-lensing", "Lens mass"],
  ["orbital-resonance", "Animation speed"],
]) {
  test(`${label} stays live and commits the final sample`, async ({ page }) => {
    await page.goto(`/playground#${id}`);
    const slider = page.getByRole("slider", { name: label, exact: true });
    await expect(slider).toBeVisible();
    if (id === "orbital-resonance") await page.getByRole("button", { name: "Pause orbits", exact: true }).click();
    await slider.scrollIntoViewIfNeeded();
    const output = slider.locator("..").locator("output");
    const original = await output.textContent();
    const max = Number(await slider.getAttribute("max"));
    const step = Number(await slider.getAttribute("step"));
    await holdFrames(page);
    for (const value of [max - 2 * step, max - step]) {
      await slider.fill(String(value));
      await expect(slider).toHaveValue(String(value));
      await expect(output).toHaveText(original!);
    }
    await nextFrame(page);
    await expect(output).not.toHaveText(original!); // Scene/model updates before release.
    const intermediate = await output.textContent();
    await slider.fill(String(max));
    await slider.dispatchEvent("pointerup", { pointerId: 1 });
    await expect(output).not.toHaveText(intermediate!); // Release flushes without another frame.
    await expect(slider).toHaveValue(String(max));
    const final = await output.textContent();
    await nextFrame(page);
    await expect(output).toHaveText(final!); // No stale callback overwrites the last value.
    await restoreFrames(page);
    await slider.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(slider).toHaveValue(String(max - step));
    await expect(output).not.toHaveText(final!);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("black-hole rotation retains every delta and flushes cancellation", async ({ page }) => {
  await page.goto("/playground#black-hole-growth");
  const scene = page.locator(".black-hole-stage");
  await scene.scrollIntoViewIfNeeded();
  const bounds = await scene.boundingBox();
  expect(bounds).not.toBeNull();
  const x = bounds!.x + bounds!.width / 2;
  const y = bounds!.y + bounds!.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  const yaw = () => scene.evaluate((el) => (el as HTMLElement).style.getPropertyValue("--view-yaw"));
  const initial = await yaw();
  await holdFrames(page);
  for (const dx of [10, 30, 20]) {
    await scene.dispatchEvent("pointermove", { pointerId: 1, clientX: x + dx, clientY: y, bubbles: true });
  }
  expect(await yaw()).toBe(initial);
  await nextFrame(page);
  await expect.poll(yaw).toBe(`${(parseFloat(initial) + 20 * 0.55).toFixed(1)}deg`);
  await scene.dispatchEvent("pointermove", { pointerId: 1, clientX: x + 40, clientY: y, bubbles: true });
  await scene.dispatchEvent("pointercancel", { pointerId: 1 });
  await expect.poll(yaw).toBe(`${(parseFloat(initial) + 40 * 0.55).toFixed(1)}deg`);
  await restoreFrames(page); await page.mouse.up();
});

test("growth chart scrubbing stays live and playback restarts from the end", async ({ page }) => {
  await page.goto("/playground#black-hole-growth");
  const marker = page.getByRole("slider", { name: "Inspect growth time" });
  await marker.scrollIntoViewIfNeeded();
  const box = await marker.boundingBox();
  const chart = await page.locator(".growth-chart").boundingBox();
  expect(box).not.toBeNull(); expect(chart).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await holdFrames(page);
  const position = (fraction: number) => chart!.x + ((58 + fraction * 540) / 620) * chart!.width;
  await marker.dispatchEvent("pointermove", { pointerId: 1, clientX: position(0.4), clientY: box!.y });
  await nextFrame(page);
  await expect(marker).toHaveAttribute("aria-valuenow", "40");
  await marker.dispatchEvent("pointermove", { pointerId: 1, clientX: position(0.7), clientY: box!.y });
  await marker.dispatchEvent("pointerup", { pointerId: 1 });
  await expect(marker).toHaveAttribute("aria-valuenow", "70");
  await restoreFrames(page); await page.mouse.up();
  await marker.focus(); await page.keyboard.press("End");
  await expect(marker).toHaveAttribute("aria-valuenow", "100");
  await page.getByRole("button", { name: "Play growth", exact: true }).click();
  await expect.poll(async () => Number(await marker.getAttribute("aria-valuenow"))).toBeLessThan(100);
  await page.getByRole("button", { name: "Pause growth", exact: true }).click();
});

test("stellar timeline retains the last touch sample and presets reset it", async ({ page, isMobile }) => {
  test.skip(!isMobile, "This gesture belongs to the touch timeline.");
  await page.goto("/playground#stellar-evolution");
  const timeline = page.locator(".stellar-timeline-control");
  const input = page.getByRole("slider", { name: "Evolution progress", exact: true });
  await timeline.scrollIntoViewIfNeeded();
  const box = await timeline.boundingBox(); expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + 2;
  await page.mouse.move(x, y); await page.mouse.down();
  // Dispatch to the control itself to avoid selecting a discrete phase button.
  await timeline.dispatchEvent("pointerdown", { pointerId: 1, clientX: x, clientY: y });
  await holdFrames(page);
  await timeline.dispatchEvent("pointermove", { pointerId: 1, clientX: box!.x + box!.width * 0.8, clientY: y });
  await nextFrame(page);
  await expect.poll(async () => Number(await input.inputValue())).toBeCloseTo(80, 0);
  await timeline.dispatchEvent("pointermove", { pointerId: 1, clientX: box!.x + box!.width, clientY: y });
  await timeline.dispatchEvent("pointerup", { pointerId: 1 });
  await expect(input).toHaveValue("100");
  await restoreFrames(page); await page.mouse.up();
  await page.getByRole("button", { name: "Massive", exact: true }).click();
  await expect(input).toHaveValue("0");
  await expect(page.getByRole("slider", { name: "Initial mass", exact: true })).toHaveValue("12");
});

test("orbit dragging accumulates all movements before each frame", async ({ page }) => {
  await page.goto("/playground#orbital-resonance");
  await page.getByRole("button", { name: "Pause orbits", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play orbits", exact: true })).toBeVisible();
  const scene = page.locator(".resonance-canvas");
  await scene.scrollIntoViewIfNeeded();
  const bounds = await scene.boundingBox(); expect(bounds).not.toBeNull();
  const phase = page.locator("#orbital-resonance dt", { hasText: "Inner-orbit phase" }).locator("..").locator("dd");
  const initial = parseFloat((await phase.textContent())!);
  const at = (angle: number) => ({
    pointerId: 1,
    clientX: bounds!.x + ((310 + 60 * Math.cos(angle)) / 620) * bounds!.width,
    clientY: bounds!.y + ((190 + 60 * 0.58 * Math.sin(angle)) / 380) * bounds!.height,
  });
  await page.mouse.move(at(0).clientX, at(0).clientY); await page.mouse.down();
  // WebKit rounds native mouse coordinates; use the same fractional event
  // coordinates for the start and subsequent samples in this precision check.
  await scene.dispatchEvent("pointerdown", at(0));
  await holdFrames(page);
  for (const angle of [0.4, 0.2, Math.PI / 2]) await scene.dispatchEvent("pointermove", at(angle));
  await nextFrame(page);
  await expect(phase).toHaveText(`${((initial + 0.25) % 1).toFixed(2)} turns`);
  await scene.dispatchEvent("pointermove", at(Math.PI));
  await scene.dispatchEvent("pointerup", { pointerId: 1 });
  await expect(phase).toHaveText(`${((initial + 0.5) % 1).toFixed(2)} turns`);
  await restoreFrames(page); await page.mouse.up();
});

test("mobile visuals pause outside the viewport without pausing the experiment", async ({ page, isMobile }) => {
  await page.setViewportSize({ width: page.viewportSize()!.width, height: 500 });
  for (const [id, selector] of [
    ["black-hole-growth", ".black-hole-stage"],
    ["stellar-evolution", ".stellar-canvas"],
    ["gravitational-lensing", ".lensing-canvas"],
    ["orbital-resonance", ".resonance-canvas"],
  ]) {
    await page.goto(`/playground#${id}`);
    const scene = page.locator(selector);
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).not.toHaveAttribute("data-visual-paused");
    // Leave the controls/results visible while the drawing is above the viewport.
    await scene.evaluate((el) => scrollTo(0, scrollY + el.getBoundingClientRect().bottom + 60));
    await expect(page.locator(`#${id}`)).not.toHaveClass(/experiment-is-paused/);
    if (isMobile) {
      await expect(scene).toHaveAttribute("data-visual-paused", "");
      const motion = await scene.evaluate((el) => el.getAnimations({ subtree: true })
        .filter((animation) => animation instanceof CSSAnimation)
        .map((animation) => animation.playState));
      expect(motion.every((state) => state === "paused")).toBe(true);
    } else {
      await expect(scene).not.toHaveAttribute("data-visual-paused");
    }
    if (isMobile && id === "black-hole-growth") {
      await page.getByRole("button", { name: "Play growth", exact: true }).click();
      await expect(scene).toHaveAttribute("data-visual-paused", "");
      const progress = page.getByRole("slider", { name: "Inspect growth time" });
      await expect.poll(async () => Number(await progress.getAttribute("aria-valuenow"))).toBeLessThan(100);
      const previous = await progress.getAttribute("aria-valuenow");
      await expect.poll(() => progress.getAttribute("aria-valuenow")).not.toBe(previous);
      await page.getByRole("button", { name: "Pause growth", exact: true }).click();
    }
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).not.toHaveAttribute("data-visual-paused");
  }
});

test("mobile black-hole growth scales fixed geometry and keeps spin controls", async ({ page, isMobile }, testInfo) => {
  await page.goto("/playground#black-hole-growth");
  const scene = page.locator(".black-hole-stage");
  await scene.scrollIntoViewIfNeeded();
  const animationCount = () => scene.evaluate((el) => el.getAnimations({ subtree: true })
    .filter((animation) => animation instanceof CSSAnimation).length);
  await expect.poll(animationCount).toBe(isMobile ? 2 : 9);

  const readGeometry = () => scene.evaluate((el) => {
    const part = (selector: string) => {
      const node = el.querySelector(selector)!;
      return { width: parseFloat(getComputedStyle(node).width), visibleWidth: node.getBoundingClientRect().width };
    };
    return {
      scale: parseFloat(getComputedStyle(el).getPropertyValue("--mass-scale")),
      plane: part(".black-hole-orbit-plane"), core: part(".black-hole-core"),
      ring: part(".black-hole-photon-ring"), glow: part(".black-hole-glow"),
    };
  });
  const before = await readGeometry();
  await page.getByRole("slider", { name: "Seed mass", exact: true }).fill("1");
  await expect.poll(async () => (await readGeometry()).scale).not.toBe(before.scale);
  const after = await readGeometry();
  if (isMobile) {
    for (const [part, width] of [["plane", 310], ["core", 126], ["ring", 143], ["glow", 180]] as const) {
      expect(before[part].width).toBe(width);
      expect(after[part].width).toBe(width);
    }
    for (const geometry of [before, after]) {
      expect(geometry.core.visibleWidth).toBeCloseTo(22 + 104 * geometry.scale, 1);
      expect(geometry.ring.visibleWidth).toBeCloseTo(29 + 114 * geometry.scale, 1);
      expect(geometry.glow.visibleWidth).toBeCloseTo(48 + 132 * geometry.scale, 1);
    }
  } else {
    expect(after.core.width).not.toBe(before.core.width);
  }

  await page.getByRole("button", { name: "Advanced settings", exact: true }).click();
  // The native range starts at -0.998 with a 0.01 step; 0.002 is its near-zero stop.
  await page.getByRole("slider", { name: "Spin", exact: true }).fill("0.002");
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).not.toHaveAttribute("data-visual-paused");
  const texture = scene.locator(".accretion-texture").first();
  await expect(texture).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("slider", { name: "Spin", exact: true }).fill("-0.698");
  await scene.scrollIntoViewIfNeeded();
  await expect(texture).toHaveCSS("animation-play-state", "running");
  await expect(texture).toHaveCSS("animation-direction", "reverse");
  await scene.screenshot({ path: testInfo.outputPath("black-hole.png") });
});
