import { expect, test, type Locator } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/gc/**", (route) => route.fulfill(route.request().url().endsWith(".js")
    ? { contentType: "application/javascript", body: "" } : { json: { count: "123" } }));
  await page.route("https://webring.ca/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
});

const regularFlight = ".sky-meteors > .shooting-star-target:not(.shooting-star-target--meteor)";

async function flightState(target: Locator) {
  return target.evaluate(async (element) => {
    const animation = element.getAnimations().find((item) => /^(wish-star|idle-meteor)-flight$/.test(item.id));
    if (animation?.playState === "paused") await animation.ready;
    return animation ? { state: animation.playState, time: Number(animation.currentTime) } : null;
  });
}

async function seekFlight(target: Locator, phase: number, paused = false) {
  await expect.poll(() => flightState(target)).not.toBeNull();
  await target.evaluate((element: HTMLElement, { phase, paused }) => {
    const animation = element.getAnimations().find((item) => /^(wish-star|idle-meteor)-flight$/.test(item.id))!;
    const { delay = 0, duration } = animation.effect!.getTiming();
    animation.currentTime = delay + Number(duration) * phase;
    element.style.animationPlayState = paused ? "paused" : "";
    // Seeking is test-only. The bridge normally synchronizes visibility on flight
    // boundaries, focus changes and catch state; invoke that same focus path here.
    element.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
  }, { phase, paused });
}

test("stationary stars retain their desktop and touch animation subsets", async ({ page, isMobile }) => {
  for (const path of ["/", "/playground"]) {
    await page.goto(path);
    const stars = page.locator(".night-star");
    await expect(stars).toHaveCount(96);
    await expect.poll(() => stars.evaluateAll((elements) => elements.every((element) =>
      element instanceof HTMLImageElement && element.complete && element.naturalWidth === 100 && element.naturalHeight === 100,
    ))).toBe(true);
    const step = isMobile ? (path === "/playground" ? 12 : 6) : 1;
    const expectedIndices = Array.from({ length: 96 / step }, (_, index) => index * step + 1);
    const animatedIndices = () => stars.evaluateAll((elements) => elements.flatMap((element, index) =>
      element.getAnimations().some((animation) => animation.id === "night-star-twinkle") ? [index + 1] : []));
    await expect.poll(animatedIndices).toEqual(expectedIndices);
    const timings = await stars.evaluateAll((elements) => elements.flatMap((element) => {
      const animation = element.getAnimations().find((item) => item.id === "night-star-twinkle");
      if (!animation) return [];
      const style = getComputedStyle(element);
      const slowerTouch = matchMedia("(hover: none), (pointer: coarse)").matches
        && element.closest(".night-sky--playground");
      return [{
        state: animation.playState,
        duration: animation.effect!.getTiming().duration,
        expectedDuration: parseFloat(style.getPropertyValue(slowerTouch ? "--touch-twinkle-duration" : "--twinkle-duration")) * 1000,
        delay: animation.effect!.getTiming().delay,
        expectedDelay: parseFloat(style.getPropertyValue("--twinkle-delay")) * 1000,
      }];
    }));
    for (const timing of timings) {
      expect(timing.state).toBe("running");
      expect(timing.duration).toBeCloseTo(timing.expectedDuration, 5);
      expect(timing.delay).toBeCloseTo(timing.expectedDelay, 5);
    }
    const shootingCount = await page.locator(regularFlight).evaluateAll((elements) =>
      elements.filter((element) => element.getAnimations().some((animation) => animation.id === "wish-star-flight")).length);
    expect(shootingCount).toBe(isMobile ? (path === "/playground" ? 0 : 1) : 3);
  }
});

test("native twinkles match the original CSS at the same animation phases", async ({ page }) => {
  await page.goto("/");
  const star = page.locator(".night-star").first();
  await expect.poll(() => star.evaluate((element) => element.getAnimations().some((animation) => animation.id === "night-star-twinkle"))).toBe(true);
  const pairs = await star.evaluate(async (element) => {
    const native = element.getAnimations().find((animation) => animation.id === "night-star-twinkle")!;
    const host = document.createElement("div");
    host.className = "night-sky";
    host.style.visibility = "hidden";
    const baseline = element.cloneNode(true) as HTMLElement;
    baseline.removeAttribute("data-native-sky-motion");
    host.append(baseline);
    // Outside NightSky's bridge: this uses the real stylesheet's CSS animation.
    document.body.append(host);
    try {
      const css = baseline.getAnimations()[0];
      native.pause();
      css.pause();
      await Promise.all([native.ready, css.ready]);
      const appearance = (target: Element) => {
        const style = getComputedStyle(target);
        return { opacity: Number(style.opacity), transform: style.transform, clip: style.clipPath,
          background: style.background, shadow: style.boxShadow, width: style.width, height: style.height };
      };
      return [0, 0.24, 0.48, 0.74, 0.99].map((phase) => {
        for (const animation of [native, css]) {
          const { delay = 0, duration } = animation.effect!.getTiming();
          // Stay in the active interval even when a negative delay exceeds a cycle.
          const length = Number(duration);
          animation.currentTime = delay + (Math.max(0, Math.ceil(-delay / length)) + phase) * length;
        }
        return { native: appearance(element), css: appearance(baseline) };
      });
    } finally {
      host.remove();
      native.play();
    }
  });
  for (const pair of pairs) expect(pair.native).toEqual(pair.css);
});

test("light mode pauses twinkles and dark mode resumes their phase", async ({ page }) => {
  await page.goto("/");
  const star = page.locator(".night-star").first();
  const state = () => star.evaluate(async (element) => {
    const animation = element.getAnimations().find((item) => item.id === "night-star-twinkle");
    if (animation?.playState === "paused") await animation.ready;
    return animation ? { state: animation.playState, time: Number(animation.currentTime) } : null;
  });
  await expect.poll(async () => (await state())?.state).toBe("running");
  const retained = await page.evaluateHandle(async () => {
    let rewrites = 0;
    const animations = [...document.querySelectorAll(".night-star")].flatMap(element => element.getAnimations())
      .filter(animation => animation.id === "night-star-twinkle");
    await Promise.all(animations.map(animation => animation.ready));
    const snapshots = animations.map(animation => {
        const effect = animation.effect as KeyframeEffect;
        const setKeyframes = effect.setKeyframes.bind(effect), updateTiming = effect.updateTiming.bind(effect);
        effect.setKeyframes = frames => { rewrites++; setKeyframes(frames); };
        effect.updateTiming = timing => { rewrites++; updateTiming(timing); };
        let resumedAt: number | null = null;
        const play = animation.play.bind(animation);
        animation.play = () => { resumedAt = Number(document.timeline.currentTime); play(); };
        return { animation, effect, frames: JSON.stringify(effect.getKeyframes()), timing: JSON.stringify(effect.getTiming()),
          time: Number(animation.currentTime), get resumedAt() { return resumedAt; } };
      });
    const flights = [...document.querySelectorAll(".sky-meteors > .shooting-star-target")]
      .flatMap(element => element.getAnimations()).filter(animation => animation.id === "wish-star-flight");
    return { snapshots, flights, phone: matchMedia("(max-width: 520px)").matches, get rewrites() { return rewrites; } };
  });
  try {
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await expect.poll(async () => (await state())?.state).toBe("paused");
    const paused = (await state())!.time;
    const light = await retained.evaluate(async ({ snapshots, flights, phone, rewrites }) => {
      await Promise.all(snapshots.map(({ animation }) => animation.ready));
      return { phone, rewrites,
        intact: snapshots.every(({ animation, effect }) => animation.effect === effect && effect.target!.getAnimations().includes(animation)),
        sameFrames: snapshots.every(({ effect, frames }) => JSON.stringify(effect.getKeyframes()) === frames),
        sameTiming: snapshots.every(({ effect, timing }) => JSON.stringify(effect.getTiming()) === timing),
        phases: snapshots.map(({ animation, time }) => ({ time: Number(animation.currentTime), elapsed: Number(animation.currentTime) - time, paused: animation.playState === "paused" })),
        flightsCanceled: flights.every(animation => animation.playState === "idle"),
      };
    });
    expect(light.intact).toBe(true);
    expect(light.sameFrames).toBe(!light.phone); // Phone themes change the authored .68 scale.
    expect(light.sameTiming).toBe(true);
    expect(light.flightsCanceled).toBe(true);
    if (light.phone) expect(light.rewrites).toBeGreaterThan(0);
    else expect(light.rewrites).toBe(0);
    light.phases.forEach(phase => { expect(phase.paused).toBe(true); expect(phase.elapsed).toBeGreaterThanOrEqual(0); expect(phase.elapsed).toBeLessThan(1000); });
    await page.waitForTimeout(200);
    expect((await state())!.time).toBe(paused);
    expect(await retained.evaluate(({ snapshots }) => snapshots.map(({ animation }) => Number(animation.currentTime))))
      .toEqual(light.phases.map(phase => phase.time));

    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await expect.poll(async () => (await state())?.state).toBe("running");
    await expect.poll(async () => (await state())!.time).toBeGreaterThan(paused);
    expect((await state())!.time - paused).toBeLessThan(1000);
    const dark = await retained.evaluate(({ snapshots, flights, rewrites }) => ({
      rewrites,
      // Subtract only time since the actual resume request: paused time must
      // never be replayed as an extra forward jump (also seen in old WebKit).
      resumedFrom: snapshots.map(({ animation, resumedAt }) => resumedAt === null ? null
        : Number(animation.currentTime) - (Number(document.timeline.currentTime) - resumedAt)),
      intact: snapshots.every(({ animation, effect, frames, timing }) => animation.effect === effect
        && effect.target!.getAnimations().includes(animation) && JSON.stringify(effect.getKeyframes()) === frames
        && JSON.stringify(effect.getTiming()) === timing),
      flightsRestarted: flights.every(animation => animation.playState === "idle")
        && [...document.querySelectorAll(".sky-meteors > .shooting-star-target")].flatMap(element => element.getAnimations())
          .filter(animation => animation.id === "wish-star-flight").length === flights.length,
    }));
    expect(dark.intact).toBe(true);
    expect(dark.flightsRestarted).toBe(true);
    dark.resumedFrom.forEach((time, index) => {
      expect(time).not.toBeNull();
      expect(Math.abs(time! - light.phases[index].time)).toBeLessThan(2);
    });
    if (!light.phone) expect(dark.rewrites).toBe(0);
  } finally { await retained.dispose(); }
});

test("resizing retains twinkles while updating flight paths and responsive scales", async ({ page }) => {
  await page.goto("/");
  const star = page.locator(".night-star").first();
  await expect.poll(() => star.evaluate(element => element.getAnimations().some(animation => animation.id === "night-star-twinkle"))).toBe(true);
  const retained = await page.evaluateHandle(async () => {
    let rewrites = 0;
    const animations = [...document.querySelectorAll(".night-star")].flatMap(element => element.getAnimations())
      .filter(animation => animation.id === "night-star-twinkle");
    await Promise.all(animations.map(animation => animation.ready));
    const snapshots = animations.map(animation => {
      const effect = animation.effect as KeyframeEffect;
      const setKeyframes = effect.setKeyframes.bind(effect), updateTiming = effect.updateTiming.bind(effect);
      effect.setKeyframes = frames => { rewrites++; setKeyframes(frames); };
      effect.updateTiming = timing => { rewrites++; updateTiming(timing); };
      return { animation, effect, frames: JSON.stringify(effect.getKeyframes()), timing: JSON.stringify(effect.getTiming()), start: animation.startTime };
    });
    return { snapshots, get rewrites() { return rewrites; } };
  });
  const viewport = page.viewportSize()!;
  const width = viewport.width > 520 ? viewport.width - 30 : viewport.width + 20;
  try {
    await page.setViewportSize({ width, height: viewport.height + 40 });
    await expect.poll(() => page.locator(regularFlight).first().evaluate(element => {
      const flight = element.getAnimations().find(animation => animation.id === "wish-star-flight");
      const transform = (flight?.effect as KeyframeEffect | undefined)?.getKeyframes().at(-1)?.transform;
      if (!transform) return 0;
      // WebKit retains vw units; resolve them through the native CSS engine.
      const probe = document.createElement("div");
      probe.style.cssText = `position:fixed;visibility:hidden;transform:${transform}`;
      document.body.append(probe);
      try {
        const matrix = new DOMMatrix(getComputedStyle(probe).transform);
        return Math.round(Math.hypot(matrix.m41, matrix.m42) * 100);
      } finally { probe.remove(); }
    })).toBe(Math.round(width * .82 * 100));
    expect(await retained.evaluate(({ snapshots, rewrites }) => ({ rewrites,
      intact: snapshots.every(({ animation, effect, frames, timing, start }) =>
        effect.target!.getAnimations().includes(animation) && animation.effect === effect && animation.startTime === start
        && JSON.stringify(effect.getKeyframes()) === frames && JSON.stringify(effect.getTiming()) === timing),
    }))).toEqual({ rewrites: 0, intact: true });

    // Crossing the real CSS breakpoint must still recapture the changed scale.
    await page.setViewportSize({ width: width > 520 ? 500 : 600, height: viewport.height + 40 });
    const expected = width > 520 ? .72 * .68 : .72;
    await expect.poll(() => star.evaluate(element => {
      const animation = element.getAnimations().find(item => item.id === "night-star-twinkle")!;
      return new DOMMatrix(String((animation.effect as KeyframeEffect).getKeyframes()[0].transform)).a;
    })).toBeCloseTo(expected, 5);
    expect(await retained.evaluate(({ rewrites }) => rewrites)).toBeGreaterThan(0);
  } finally { await retained.dispose(); }
});

test("reduced motion keeps the original static stars and removes sky motion", async ({ page, isMobile }) => {
  await page.goto("/");
  const stars = page.locator(".night-star");
  const animationCount = () => stars.evaluateAll((elements) => elements.reduce((count, element) => count + element.getAnimations().length, 0));
  await expect.poll(animationCount).toBe(isMobile ? 16 : 96);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(animationCount).toBe(0);
  expect(await stars.evaluateAll((elements) => elements.every((element) => {
    const style = getComputedStyle(element);
    return style.opacity === "0.22" && style.transform === "none";
  }))).toBe(true);
  await expect(page.locator(".sky-meteors")).toBeHidden();
  await expect(page.locator(".shooting-star-target--meteor")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(animationCount).toBe(isMobile ? 16 : 96);
});

test("shooting-star hit windows, catch timers and keyboard pauses are preserved", async ({ page }) => {
  await page.goto("/");
  const target = page.locator(regularFlight).first();
  await seekFlight(target, 0.79, true);
  await expect(target).toBeVisible();
  await seekFlight(target, 0.2, true);
  await expect(target).toBeHidden();
  // Let the native timeline cross both boundaries without another refresh.
  await seekFlight(target, 0.76);
  await expect(target).toBeHidden();
  await expect(target).toBeVisible({ timeout: 1500 });
  await seekFlight(target, 0.99);
  await expect(target).toBeVisible();
  await expect(target).toBeHidden({ timeout: 1000 });
  await seekFlight(target, 0.82);
  await expect(target).toBeVisible();
  // DOM activation avoids chasing a moving hit target. Visibility above tests
  // the hit window; keyboard activation below exercises an actual input path.
  await target.evaluate((element: HTMLButtonElement) => element.click());
  const wish = page.locator(".sky-wish:not(.sky-shower-message)");
  await expect(wish).toHaveText("Make a wish ✧");
  await expect.poll(async () => (await flightState(target))?.state).toBe("paused");
  const paused = (await flightState(target))!.time;
  await page.waitForTimeout(900);
  expect((await flightState(target))!.time).toBe(paused);
  await expect.poll(async () => (await flightState(target))?.state, { timeout: 1500 }).toBe("running");
  await expect(wish).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(wish).toBeVisible();
  await expect(wish).toHaveCount(0, { timeout: 2000 });

  await seekFlight(target, 0.82);
  await page.keyboard.press("Tab");
  await target.focus();
  await expect(target).toBeFocused();
  expect(await target.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
  await expect.poll(async () => (await flightState(target))?.state).toBe("paused");
  await page.keyboard.press("Enter");
  await expect(wish).toHaveText("Make a wish ✧");
  await page.keyboard.press("Tab");
  await expect(target).not.toBeFocused();
  // Leaving focus keeps the independent 1.6-second catch pause in effect.
  await expect.poll(async () => (await flightState(target))?.state, { timeout: 2500 }).toBe("running");
});

test("ten seconds of inactivity starts all 30 meteors and activity cancels them", async ({ page, isMobile }) => {
  test.skip(isMobile, "The existing touch design does not show idle meteor showers.");
  await page.goto("/");
  const meteors = page.locator(".shooting-star-target--meteor");
  await expect.poll(() => page.locator(".night-star").first().evaluate((element) => element.getAnimations().some((animation) => animation.id === "night-star-twinkle"))).toBe(true);
  const retainedSky = await page.evaluateHandle(async () => {
    const root = document.querySelector(".night-sky")!.parentElement!;
    const animations = root.getAnimations({ subtree: true }).filter((animation) => animation.id);
    await Promise.all(animations.map((animation) => animation.ready));
    let rewrites = 0;
    const snapshots = animations.map((animation) => {
      const effect = animation.effect as KeyframeEffect;
      const setKeyframes = effect.setKeyframes.bind(effect);
      const updateTiming = effect.updateTiming.bind(effect);
      effect.setKeyframes = (frames) => { rewrites++; setKeyframes(frames); };
      effect.updateTiming = (timing) => { rewrites++; updateTiming(timing); };
      return { animation, effect, startTime: animation.startTime };
    });
    return { snapshots, get rewrites() { return rewrites; } };
  });
  const expectSkyRetained = async () => {
    expect(await retainedSky.evaluate(({ snapshots, rewrites }) => ({
      count: snapshots.length, rewrites,
      intact: snapshots.every(({ animation, effect, startTime }) => animation.effect === effect
        && (effect.target as Element).getAnimations().includes(animation) && animation.startTime === startTime),
    }))).toEqual({ count: 99, rewrites: 0, intact: true });
  };
  await page.mouse.move(10, 10);
  await page.waitForTimeout(9000);
  await expect(meteors).toHaveCount(0);
  // Real time keeps JS boundary timers and the native animation timeline aligned.
  await expect(meteors).toHaveCount(30, { timeout: 3000 });
  await expect(page.locator(".sky-shower-message")).toHaveText("Meteor shower!");
  await expect.poll(() => meteors.evaluateAll((elements) => elements.every((element) => {
    const ids = element.getAnimations({ subtree: true }).map((animation) =>
      animation.id || (animation instanceof CSSAnimation ? animation.animationName : "")).sort();
    return JSON.stringify(ids) === JSON.stringify(["idle-meteor-flight", "meteor-burn", "meteor-train", "meteor-train"]);
  }))).toBe(true);

  const caught = page.locator("button.shooting-star-target--meteor").first();
  await seekFlight(caught, 0.08);
  await caught.evaluate((element: HTMLButtonElement) => element.click());
  await expect(page.locator(".sky-wish:not(.sky-shower-message)")).toHaveText("Make a wish ✧");
  await expect(meteors).toHaveCount(30);
  await expect.poll(() => caught.evaluate((element) => element.getAnimations({ subtree: true }).every((animation) => animation.playState === "paused"))).toBe(true);
  await expectSkyRetained(); // Added meteors and wish text must leave existing effects alone.
  const animations = await meteors.evaluateAll((elements) => elements.reduce((count, element) => count + element.getAnimations({ subtree: true }).length, 0));
  expect(animations).toBe(120);
  const retained = await page.evaluateHandle(() => Array.from(document.querySelectorAll(".shooting-star-target--meteor"))
    .flatMap((element) => element.getAnimations({ subtree: true })));
  try {
    await page.mouse.move(40, 40);
    await expect(meteors).toHaveCount(0);
    await expect(page.locator(".sky-shower-message")).toHaveCount(0);
    await expect.poll(() => retained.evaluate((items) => items.every((animation) => animation.playState === "idle"))).toBe(true);
    await expect(page.locator(regularFlight)).toHaveCount(3);
    await expectSkyRetained();
  } finally {
    await retained.dispose();
    await retainedSky.dispose();
  }
});
