import { expect, test, type Page } from "@playwright/test";

type MarkerWorker = { worker: Worker; stopped: boolean; messages: Array<{ type: string; paused: boolean; render: boolean; anchorTime: number; anchorEpoch: number; dpr: number }> };
type VisibilityObserver = { observer: IntersectionObserver; callback: IntersectionObserverCallback; targets: Set<Element>; entries: IntersectionObserverEntry[]; held: boolean };
type MarkerWindow = Window & { markerWorkers: MarkerWorker[]; markerObservers: VisibilityObserver[] };

async function openStellar(page: Page) {
  await page.route("**/gc/**", (route) => route.fulfill({ body: "" }));
  await page.route("https://webring.ca/**", (route) => route.fulfill({ body: "" }));
  await page.goto("/playground#stellar-evolution");
  await page.locator(".stellar-canvas").scrollIntoViewIfNeeded();
}

const selected = (page: Page) => page.locator(".stellar-timeline button[aria-pressed=true]");

test("marker glow preserves the phone viewport at either timeline endpoint", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile browsers can fit the viewport to overflowing glow boxes.");
  await page.setViewportSize({ width: 390, height: 844 });
  await openStellar(page);
  const section = page.locator("#stellar-evolution");
  for (const mass of ["Sun-like", "Massive", "Very massive"]) {
    await section.getByRole("button", { name: mass, exact: true }).click();
    const phases = section.locator(".stellar-timeline button");
    for (const phase of [phases.first(), phases.last()]) {
      await phase.click();
      await expect(selected(page).locator("span")).toHaveAttribute("data-worker-glow", "");
      await expect.poll(() => selected(page).locator("canvas").evaluate(canvas => canvas.getBoundingClientRect().width)).toBeCloseTo(103.5, 2);
      expect(await page.evaluate(() => [innerWidth, innerHeight, document.documentElement.scrollWidth])).toEqual([390, 844, 390]);
      const offset = await selected(page).evaluate(button => {
        const core = button.querySelector("span")!.getBoundingClientRect();
        const canvas = button.querySelector("canvas")!.getBoundingClientRect();
        return [core.x + core.width / 2 - canvas.x - canvas.width / 2, core.y + core.height / 2 - canvas.y - canvas.height / 2];
      });
      offset.forEach(value => expect(Math.abs(value)).toBeLessThan(1 / 32));
    }
  }
});

test("the marker retains its clock across visibility and cleans up on phase and motion changes", async ({ page, browserName, isMobile }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const records: MarkerWorker[] = [];
    const observers: VisibilityObserver[] = [];
    Object.assign(window, { markerWorkers: records, markerObservers: observers });
    const NativeObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends NativeObserver {
      record: VisibilityObserver;
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        let record: VisibilityObserver;
        super((entries, observer) => {
          record.entries = entries;
          if (!record.held) callback(entries, observer);
        }, options);
        record = this.record = { observer: this, callback, targets: new Set(), entries: [], held: false };
        observers.push(record);
      }
      observe(target: Element) { this.record.targets.add(target); super.observe(target); }
      unobserve(target: Element) { this.record.targets.delete(target); super.unobserve(target); }
      disconnect() { this.record.targets.clear(); super.disconnect(); }
    };
    const Original = window.Worker;
    window.Worker = class extends Original {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        const record: MarkerWorker = { worker: this, stopped: false, messages: [] };
        records.push(record);
        const send = this.postMessage.bind(this);
        this.postMessage = ((message: MarkerWorker["messages"][number], transfer: Transferable[] = []) => {
          const { type, paused, render, anchorTime, anchorEpoch, dpr } = message;
          record.messages.push({ type, paused, render, anchorTime, anchorEpoch, dpr });
          send(message, transfer);
        }) as Worker["postMessage"];
        const terminate = this.terminate.bind(this);
        this.terminate = () => { record.stopped = true; terminate(); };
      }
    };
  });
  await openStellar(page);
  const section = page.locator("#stellar-evolution");
  const activeWorkers = () => page.evaluate(() => (window as unknown as MarkerWindow).markerWorkers.filter((record) => !record.stopped).length);
  const lastMessage = () => page.evaluate(() => (window as unknown as MarkerWindow).markerWorkers.filter((record) => !record.stopped).at(-1)!.messages.at(-1)!);
  await expect(selected(page).locator("span")).toHaveAttribute("data-worker-glow", "");
  await expect(selected(page).locator(".stellar-marker-glow")).toBeVisible();
  await expect.poll(activeWorkers).toBe(1);
  await expect.poll(async () => (await lastMessage()).paused).toBe(false);
  const size = await selected(page).locator("canvas").evaluate((canvas: HTMLCanvasElement) => [canvas.width, canvas.height, Math.round(90 * devicePixelRatio)]);
  expect(size.slice(0, 2)).toEqual([size[2], size[2]]);

  // A permitted queued batch can contain opposing crossings for one target.
  // Inject it into the real callbacks; this does not assert native recurrence.
  const targets = ["#stellar-evolution", ...(isMobile ? [".stellar-canvas"] : []), ".stellar-timeline button[aria-pressed=true] .stellar-marker-glow"];
  await page.evaluate((selectors) => {
    for (const selector of selectors) {
      const target = document.querySelector(selector)!;
      const records = (window as unknown as MarkerWindow).markerObservers.filter(record => record.targets.has(target));
      if (records.length !== 1) throw Error(`Expected one observer for ${selector}`);
      records[0].held = true;
    }
  }, targets);
  const deliver = (selector: string, states: boolean[]) => page.evaluate(({ selector, states }) => {
    const target = document.querySelector(selector)!;
    const record = (window as unknown as MarkerWindow).markerObservers.find(record => record.targets.has(target))!;
    record.callback(states.map(isIntersecting => ({ target, isIntersecting } as IntersectionObserverEntry)), record.observer);
  }, { selector, states });
  const expectVisibility = async (selector: string, visible: boolean) => {
    if (selector === targets[0]) {
      await expect.poll(() => section.evaluate(element => element.classList.contains("experiment-is-paused"))).toBe(!visible);
      await expect.poll(async () => (await lastMessage()).paused).toBe(!visible);
    } else if (selector === ".stellar-canvas") {
      await expect.poll(() => page.locator(selector).evaluate(element => element.hasAttribute("data-visual-paused"))).toBe(!visible);
    } else await expect.poll(async () => (await lastMessage()).render).toBe(visible);
    if (selector !== targets.at(-1)) {
      await expect(page.locator(".stellar-object")).toHaveCSS("animation-play-state", visible ? "running" : "paused");
    }
  };
  for (const target of targets) {
    for (const states of [[false, true], [true, false]]) {
      for (const selector of targets) await deliver(selector, [selector === target ? states[0] : true]);
      await expectVisibility(target, states[0]);
      await deliver(target, states);
      await expectVisibility(target, states[1]);
      await expect.poll(activeWorkers).toBe(1);
    }
  }
  await page.evaluate(() => {
    for (const record of (window as unknown as MarkerWindow).markerObservers) {
      if (!record.held) continue;
      record.held = false;
      // Restore the latest naturally observed state for the lifecycle checks.
      if (record.entries.length) record.callback(record.entries, record.observer);
    }
  });
  await expect(section).not.toHaveClass(/experiment-is-paused/);
  await expect.poll(async () => (await lastMessage()).paused).toBe(false);

  if (!isMobile) {
    await selected(page).locator("span").evaluate((span) =>
      window.scrollBy({ top: span.getBoundingClientRect().bottom + 200, behavior: "instant" }));
    await expect(section).not.toHaveClass(/experiment-is-paused/);
    await expect.poll(async () => (await lastMessage()).render).toBe(false);
    const offscreen = await lastMessage();
    expect(offscreen.paused).toBe(false);
    await page.waitForTimeout(120);
    await selected(page).locator("span").scrollIntoViewIfNeeded();
    await expect.poll(async () => (await lastMessage()).render).toBe(true);
    const onscreen = await lastMessage();
    expect(onscreen.paused).toBe(false);
    expect(onscreen.anchorTime - offscreen.anchorTime).toBeGreaterThan(100);
    expect(onscreen.anchorTime - offscreen.anchorTime).toBeCloseTo(onscreen.anchorEpoch - offscreen.anchorEpoch, 2);
    await expect.poll(activeWorkers).toBe(1);
  }

  if (isMobile) {
    // The open phone panel occupies most of the document; exercise tab hiding.
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
  } else await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(section).toHaveClass(/experiment-is-paused/);
  await expect.poll(async () => (await lastMessage()).paused).toBe(true);
  const paused = (await lastMessage()).anchorTime;
  await page.waitForTimeout(120);
  if (isMobile) {
    await page.evaluate(() => {
      Reflect.deleteProperty(document, "hidden");
      document.dispatchEvent(new Event("visibilitychange"));
    });
  } else await page.locator(".stellar-canvas").scrollIntoViewIfNeeded();
  await expect.poll(async () => (await lastMessage()).paused).toBe(false);
  const resumed = await page.evaluate(() => {
    const messages = (window as unknown as MarkerWindow).markerWorkers.filter((record) => !record.stopped).at(-1)!.messages;
    return messages[messages.findLastIndex((message) => message.paused) + 1];
  });
  expect(resumed.anchorTime).toBeCloseTo(paused, 4);

  await section.getByRole("button", { name: "Red giant", exact: true }).click();
  await expect(selected(page).locator("span")).toHaveAttribute("data-worker-glow", "");
  await expect.poll(activeWorkers).toBe(1);
  await expect(page.locator(".stellar-marker-glow canvas")).toHaveCount(1);
  expect(await page.evaluate(() => (window as unknown as MarkerWindow).markerWorkers[0].stopped)).toBe(true);

  if (isMobile) {
    const toggle = page.getByRole("button", { name: "Stellar Evolution Explorer", exact: true });
    await toggle.dispatchEvent("click");
    await expect(section).toBeHidden();
    await expect.poll(activeWorkers).toBe(0);
    await toggle.dispatchEvent("click");
    await expect(selected(page).locator("span")).toHaveAttribute("data-worker-glow", "");
    await expect.poll(activeWorkers).toBe(1);
  }

  if (browserName === "chromium" && !isMobile) {
    const session = await page.context().newCDPSession(page);
    // CDP needs a viewport change to dispatch resolution media-query events.
    await session.send("Emulation.setDeviceMetricsOverride", { width: 1441, height: 1000, deviceScaleFactor: 2, mobile: false });
    await expect.poll(async () => (await lastMessage()).dpr).toBe(2);
    await expect.poll(() => selected(page).locator("canvas").evaluate((canvas: HTMLCanvasElement) => [canvas.width, canvas.height])).toEqual([180, 180]);
    await session.detach();
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(activeWorkers).toBe(0);
  await expect(page.locator(".stellar-marker-glow canvas")).toHaveCount(0);
  await expect(selected(page).locator("span")).not.toHaveAttribute("data-worker-glow", "");
  expect(await selected(page).locator("span").evaluate((span) => getComputedStyle(span).boxShadow)).not.toBe("none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(selected(page).locator("span")).toHaveAttribute("data-worker-glow", "");
  await expect.poll(activeWorkers).toBe(1);
  expect(errors).toEqual([]);
});

for (const fallback of ["unsupported", "failed"] as const) {
  test(`the original marker remains animated when workers are ${fallback}`, async ({ page, isMobile }) => {
    await page.addInitScript((mode) => {
      if (mode === "unsupported") Object.defineProperty(HTMLCanvasElement.prototype, "transferControlToOffscreen", { value: undefined });
      else window.Worker = class { constructor() { throw Error("Worker unavailable"); } } as unknown as typeof Worker;
    }, fallback);
    await openStellar(page);
    if (isMobile) expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
    const marker = selected(page).locator("span");
    await expect(marker).not.toHaveAttribute("data-worker-glow", "");
    await expect(page.locator(".stellar-marker-glow canvas")).toHaveCount(0);
    expect(await marker.evaluate((span) => span.getAnimations().some((animation) => (animation as CSSAnimation).animationName === "stellar-marker-pulse"))).toBe(true);
    await page.locator("#stellar-evolution").getByRole("button", { name: "Red giant", exact: true }).click();
    expect(await selected(page).locator("span").evaluate((span) => span.getAnimations().some((animation) => (animation as CSSAnimation).animationName === "stellar-marker-pulse"))).toBe(true);
  });
}
