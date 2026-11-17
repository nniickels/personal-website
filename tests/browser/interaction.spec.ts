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
  const yaw = () => scene.evaluate((el) => {
    const transform = el.querySelector<HTMLElement>(".black-hole-orbit-plane")!.style.transform;
    const value = transform.match(/rotateZ\(([-\d.]+)deg\)/)?.[1]
      ?? (el as HTMLElement).style.getPropertyValue("--view-yaw");
    return `${parseFloat(value).toFixed(1)}deg`;
  });
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
  await scene.evaluate(element => element.releasePointerCapture(1));
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
    // Give the final mobile drawing enough room to scroll completely offscreen.
    await page.evaluate(() => { document.body.style.paddingBottom = "100vh"; });
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
      // Clicking scrolls the play button into view, which can also reveal the drawing.
      // Recreate the user's offscreen reading position after starting playback.
      await scene.evaluate((el) => scrollTo(0, scrollY + el.getBoundingClientRect().bottom + 60));
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

test("guestbook text fields keep the Safari focus-zoom minimum for every pointer type", async ({ page }) => {
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [] } }));
  await page.goto("/side#guestbook");
  await page.getByRole("button", { name: "Oxeye daisy", exact: true }).click();
  const scene = page.locator(".guestbook-landscape");
  const bounds = (await scene.boundingBox())!;
  await scene.click({ position: { x: bounds.width * .34, y: bounds.height * .75 } });
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Leave your sticker here?");
  for (const field of await dialog.locator("input, textarea").all()) {
    await field.focus();
    expect(await field.evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
  }
});

test("postcard library groups previews and returns to the selected stack position", async ({ page, isMobile }, testInfo) => {
  await page.goto("/side#favourite-places");
  const section = page.getByRole("region", { name: "Postcards", exact: true });
  await section.getByRole("button", { name: "Unstack", exact: true }).click();
  await expect(section.getByRole("button", { name: "Stack", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(section.locator(".postcard-stack")).toHaveCount(0);
  await expect(section.getByRole("button", { name: "Stack", exact: true })).toBeEnabled();
  const library = section.locator(".postcard-library");
  await expect(library.locator(".postcard-library-continent > h3")).toHaveText(["Asia", "Europe", "North America"]);
  await expect(library.getByRole("region", { name: "Europe", exact: true }).locator("h4")).toHaveText(["Austria", "Germany"]);
  await expect(library.getByRole("region", { name: "Canada", exact: true }).getByRole("button", { name: "Open Miss Fu in Chengdu, postcard 2", exact: true })).toBeVisible();
  const previews = library.locator(".postcard-library-entry img");
  expect(await previews.count()).toBe(20);
  await expect(previews.first()).toHaveAttribute("sizes", "32px");
  expect(await library.locator("ul").first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(isMobile ? 2 : 3);
  await expect(library.locator(".postcard-library-continent > h3").first()).toHaveCSS("border-bottom-width", "0px");
  await expect.poll(() => previews.first().evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await section.evaluate(el => el.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: testInfo.outputPath("postcard-library.png") });
  await library.getByRole("button", { name: "Open Glyptothek, postcard 9", exact: true }).click();
  await expect(section.getByRole("button", { name: "Unstack", exact: true })).toBeFocused();
  await expect(section.locator(".postcard-number-display")).toHaveText("9");
  await expect(section.getByRole("button", { name: "Turn over Glyptothek", exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await section.getByRole("button", { name: "Next postcard", exact: true }).click();
  await expect(section.locator(".postcard-number-display")).toHaveText("10");
  await section.getByRole("button", { name: "Turn over Charles Sauriol Conservation Area", exact: true }).click();
  await section.getByRole("button", { name: "Unstack", exact: true }).click();
  await section.getByRole("button", { name: "Stack", exact: true }).click();
  await expect(section.locator(".postcard-number-display")).toHaveText("10");
  await expect(section.locator(".postcard-slot--0 .place-postcard")).toHaveClass(/is-flipped/);
});

test("postcards shrink into their previews and gather back into the stack", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/side#favourite-places");
  const section = page.getByRole("region", { name: "Postcards", exact: true });
  for (const label of ["Unstack", "Stack"]) {
    await section.getByRole("button", { name: label, exact: true }).click();
    const flights = page.locator(".postcard-flight");
    await expect(flights).toHaveCount(20);
    const paths = await flights.evaluateAll(elements => elements.map(el => {
      const animation = el.getAnimations()[0];
      animation.pause();
      animation.currentTime = 300;
      return (animation.effect as KeyframeEffect).getKeyframes().map(frame => String(frame.transform));
    }));
    for (const path of paths) {
      expect(path[label === "Unstack" ? 0 : 1]).toContain("scale(1, 1)");
      expect(path[label === "Unstack" ? 1 : 0]).not.toContain("scale(1, 1)");
    }
    await page.screenshot({ path: testInfo.outputPath(`postcards-${label.toLowerCase()}-midway.png`) });
    await flights.evaluateAll(elements => elements.forEach(el => el.getAnimations().forEach(animation => animation.finish())));
    await expect(page.locator(".postcard-flight-layer")).toHaveCount(0);
    await expect(section.getByRole("button", { name: label === "Unstack" ? "Stack" : "Unstack", exact: true })).toBeEnabled();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await section.getByRole("button", { name: "Unstack", exact: true }).click();
  await expect(section.locator(".postcard-library")).toBeVisible();
  await expect(page.locator(".postcard-flight-layer")).toHaveCount(0);
});


test("site buttons confirm mobile redirects and retain direct desktop links", async ({ page, context, isMobile }, testInfo) => {
  await context.route("https://kafidov.dev/", route => route.fulfill({ body: "Site button destination" }));
  await page.goto("/side#buttons");
  const button = page.locator("#buttons").getByRole("link", { name: "boris' portfolio!!", exact: true });
  const dialog = page.getByRole("dialog", { name: "Redirect to boris' portfolio!!?", exact: true });
  if (isMobile) {
    await button.click();
    await expect(dialog).toBeVisible();
    expect(context.pages()).toHaveLength(1);
    await page.screenshot({ path: testInfo.outputPath("site-button-confirmation.png") });
    await dialog.screenshot({ path: testInfo.outputPath("site-button-confirmation-dialog.png") });
    await dialog.getByRole("button", { name: "No", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(button).toBeFocused();
    await button.click();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await button.click();
    const popup = page.waitForEvent("popup");
    await dialog.getByRole("button", { name: "Yes", exact: true }).click();
    await expect(await popup).toHaveURL("https://kafidov.dev/");
    await expect(dialog).not.toBeVisible();
  } else {
    const popup = page.waitForEvent("popup");
    await button.click();
    await expect(await popup).toHaveURL("https://kafidov.dev/");
    await expect(dialog).not.toBeVisible();
  }
  await expect(page).toHaveURL(/\/side#buttons$/);
});


test("button confirmation matches the webring dialog typography and styling", async ({ page }, testInfo) => {
  await page.goto("/side#buttons");
  for (const width of [390, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page.locator("html").evaluate((el, value) => el.setAttribute("data-theme", value), theme);
      const styles = await page.evaluate(() => {
        const button = document.querySelector<HTMLDialogElement>("#buttons dialog")!;
        const webring = document.querySelector<HTMLDialogElement>(".footer-content dialog")!;
        const values = (element: Element, properties: string[]) => {
          const style = getComputedStyle(element);
          return Object.fromEntries(properties.map(property => [property, style.getPropertyValue(property)]));
        };
        const typography = ["font-family", "font-size", "font-weight", "font-style", "font-variant-caps", "letter-spacing", "line-height", "color"];
        const dialog = [...typography, "background-color", "border", "border-radius", "padding", "box-shadow", "text-align"];
        const controls = [...typography, "padding", "border", "border-radius", "min-width", "min-height"];
        return [button, webring].map(element => ({
          dialog: values(element, dialog),
          heading: values(element.querySelector("h2")!, typography),
          button: values(element.querySelector("button")!, controls),
          actions: values(element.querySelector(".webring-confirmation-actions")!, ["gap", "margin-top", "justify-content"]),
        }));
      });
      expect(styles[0], `${width}px, ${theme}`).toEqual(styles[1]);
      expect(styles[0].heading["font-variant-caps"]).toBe("normal");
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#buttons").getByRole("link", { name: "boris' portfolio!!", exact: true }).click();
  const popup = page.getByRole("dialog", { name: "Redirect to boris' portfolio!!?", exact: true });
  await expect(popup).toBeVisible();
  await popup.screenshot({ path: testInfo.outputPath("matching-button-popup.png") });
});


test("scrolling away clears postcards during stacking and unstacking", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/side#favourite-places");
  const section = page.locator("#favourite-places");
  for (const label of ["Unstack", "Stack"]) {
    await section.getByRole("button", { name: label, exact: true }).click();
    const flights = page.locator(".postcard-flight");
    await expect(flights).toHaveCount(20);
    // Hold the transition so cleanup cannot pass merely by waiting it out.
    await flights.evaluateAll(elements => elements.forEach(element => element.getAnimations().forEach(animation => {
      animation.pause();
      animation.currentTime = 300;
    })));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(page.locator(".postcard-flight-layer, .postcard-flight")).toHaveCount(0);
    await expect(section).not.toHaveAttribute("data-postcard-transition");
    await expect(section.locator("#postcard-view")).toHaveAttribute("aria-busy", "false");
    await expect(section.locator("#postcard-view")).not.toHaveAttribute("inert");
    await expect(section.getByRole("button", { name: label === "Unstack" ? "Stack" : "Unstack", exact: true })).toBeEnabled();
    if (label === "Unstack") await expect(section.locator(".postcard-library-entry")).toHaveCount(20);
    else expect(await section.locator(".postcard-photo img").count()).toBeLessThanOrEqual(4);
  }
});

test("stacking prioritizes the top photo and upgrades it before the animation ends", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/side#favourite-places");
  const section = page.locator("#favourite-places");
  await expect(section.locator('img[fetchpriority="high"]')).toHaveCount(0);
  await section.getByRole("button", { name: "Unstack", exact: true }).click();
  await expect(section.getByRole("button", { name: "Stack", exact: true })).toBeEnabled();
  let releasePhoto!: () => void;
  const photoGate = new Promise<void>(resolve => { releasePhoto = resolve; });
  const isFullPhoto = (url: string) => url.includes("postcard-photos-glyptothek-") && Number(url.match(/-(\d+)\.webp$/)?.[1]) >= 960;
  await page.route("**/media/postcard-photos-glyptothek-*.webp", async route => {
    if (isFullPhoto(route.request().url())) await photoGate;
    await route.continue();
  });
  try {
    const fullPhotoRequest = page.waitForRequest(request => isFullPhoto(request.url()));
    await section.getByRole("button", { name: "Open Glyptothek, postcard 9", exact: true }).click();
    await fullPhotoRequest;
    const topPhoto = section.locator(".postcard-slot--0 .postcard-photo img");
    await expect(topPhoto).toHaveAttribute("loading", "eager");
    await expect(topPhoto).toHaveAttribute("fetchpriority", "high");
    await expect(section.locator('.postcard-photo img[fetchpriority="high"]')).toHaveCount(1);
    const flights = page.locator(".postcard-flight");
    await expect(flights).toHaveCount(20);
    await expect(flights.locator('img[fetchpriority="low"]')).toHaveCount(20);
    await flights.evaluateAll(elements => elements.forEach(element => element.getAnimations().forEach(animation => {
      animation.pause();
      animation.currentTime = 300;
    })));
    const topFlightPhoto = page.locator('.postcard-flight[data-postcard-index="8"] img');
    expect(await topFlightPhoto.getAttribute("src")).toMatch(/-160\.webp$/);
    releasePhoto();
    await expect.poll(() => topPhoto.evaluate((image: HTMLImageElement) => image.complete && !!image.naturalWidth)).toBe(true);
    const source = await topPhoto.evaluate((image: HTMLImageElement) => image.currentSrc);
    await expect(topFlightPhoto).toHaveAttribute("src", source);
    await expect(flights).toHaveCount(20); // Upgraded while the transition is still held.
    await flights.evaluateAll(elements => elements.forEach(element => element.getAnimations().forEach(animation => animation.finish())));
    await expect(page.locator(".postcard-flight-layer")).toHaveCount(0);
    await expect(topPhoto).toBeVisible();
  } finally {
    releasePhoto();
  }
});
