import { expect, test } from "@playwright/test";

test("guestbook asks for a name after placement and keeps confirmed entries", async ({ page }) => {
  const entries: Record<string, unknown>[] = [];
  await page.route("**/api/guestbook", async (route) => {
    if (route.request().method() === "POST") {
      const entry = { ...route.request().postDataJSON(), placedAt: "2026-11-10T12:00:00Z" };
      entries.push(entry);
      await route.fulfill({ status: 201, json: { entry } });
    } else await route.fulfill({ json: { entries } });
  });
  await page.goto("/side");
  const section = page.locator("#guestbook");
  const loaded = page.waitForResponse("**/api/guestbook");
  await section.scrollIntoViewIfNeeded();
  await loaded;
  await expect.poll(() => page.locator(".guestbook-sticker-options button").count()).toBe(12);
  await expect(section.locator(".guestbook-description")).toHaveText("You made it to the end! Grab a sticker and place it on the landscape for everyone to see.");
  await expect(page.getByText("A little landscape for everyone who passes through.", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Choose a sticker, then click a spot in the landscape.", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Your name", { exact: true })).not.toBeVisible();
  await page.getByRole("button", { name: "Oxeye daisy", exact: true }).click();
  const scene = page.locator(".guestbook-landscape");
  const box = await scene.boundingBox();
  if (!box) throw new Error("Landscape missing");
  // A flower in the sky opens an explanation, without a name field.
  await scene.click({ position: { x: box.width * .4, y: box.height * .2 } });
  await expect(page.getByRole("dialog")).toContainText("Can't place here");
  await expect(page.getByLabel("Your name", { exact: true })).not.toBeVisible();
  await page.getByRole("button", { name: "Okay", exact: true }).click();
  // A valid spot opens confirmation; cancelling never saves an entry.
  await scene.click({ position: { x: box.width * .34, y: box.height * .75 } });
  await expect(page.getByRole("dialog")).toContainText("Leave your sticker here?");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(entries).toHaveLength(0);
  await scene.click({ position: { x: box.width * .34, y: box.height * .75 } });
  await expect(page.getByLabel("Your name", { exact: true })).toHaveAttribute("autocomplete", "off");
  await expect(page.getByLabel("Your name", { exact: true })).toHaveAttribute("data-1p-ignore", "true");
  const note = page.getByLabel("Leave a message? (Optional)", { exact: true });
  expect(await note.evaluate(el => !!(el.compareDocumentPosition(document.querySelector('input[name="guestbook-display-name"]')!) & Node.DOCUMENT_POSITION_PRECEDING))).toBe(true);
  await note.fill("Hello from the garden! <stars>");
  await page.getByLabel("Your name", { exact: true }).fill("Garden visitor");
  await page.getByRole("button", { name: "Place sticker", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(entries).toHaveLength(1);
  await expect(section.locator(".guestbook-count")).toHaveText("1 sticker placed");
  await expect(page.getByText("Your sticker is part of the guestbook.", { exact: true })).toHaveCount(0);
  await page.reload();
  await section.scrollIntoViewIfNeeded();
  const sticker = page.locator(".guestbook-placed");
  await expect(sticker).toHaveCount(1);
  await sticker.focus();
  await expect(page.locator(".guestbook-entry-label")).toBeVisible();
  await expect(sticker).toContainText("Garden visitor");
  await expect(page.locator(".guestbook-entry-label")).not.toContainText("Hello from the garden!");
  await expect(sticker).not.toHaveAttribute("aria-label", /Hello from the garden/);
  const history = page.getByRole("region", { name: "History", exact: true });
  await expect(history).toBeVisible();
  await expect(history).toContainText("Garden visitor");
  await expect(history.locator("time")).toHaveAttribute("datetime", "2026-11-10T12:00:00Z");
  await expect(history.locator(".guestbook-history-message")).toHaveText("Hello from the garden! <stars>");
  await expect(sticker.locator(".guestbook-sticker-art")).toHaveCount(1);
  await expect(page.getByText("Position with keyboard")).toHaveCount(0);
});

test("sticker picker follows the responsive landscape layout without page overflow", async ({ page, isMobile }) => {
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [] } }));
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  while (!await page.getByRole("button", { name: "Cat", exact: true }).count()) {
    await page.getByRole("button", { name: "Next sticker page", exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Cat", exact: true })).toBeVisible();
  while (await page.getByRole("button", { name: "Next sticker page", exact: true }).isEnabled()) {
    await page.getByRole("button", { name: "Next sticker page", exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Mew", exact: true })).toBeVisible();
  await expect(page.locator(".guestbook-sticker-options button")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "Next sticker page", exact: true })).toBeDisabled();
  const scene = await page.locator(".guestbook-picture-frame").boundingBox();
  const picker = await page.locator(".guestbook-picker").boundingBox();
  if (isMobile) {
    expect(picker!.y).toBeGreaterThanOrEqual(scene!.y + scene!.height);
    expect(Math.abs(scene!.width - page.viewportSize()!.width)).toBeLessThan(2);
  } else {
    expect(picker!.x).toBeGreaterThan(scene!.x + scene!.width);
    expect(Math.abs(picker!.height - scene!.height)).toBeLessThan(1);
  }
  expect(await page.locator(".guestbook-landscape").evaluate(el => getComputedStyle(el).cursor)).toBe("none");
  await expect(page.getByRole("button", { name: "Seedling", exact: true })).toHaveCount(0);
  await expect(page.locator(".guestbook-category")).toHaveCount(0);
  const sidebar = page.getByRole("navigation", { name: "Side sections", exact: true });
  if (isMobile) await expect(sidebar).not.toBeVisible();
  else {
    await expect(sidebar.getByRole("heading", { name: "About me", exact: true })).toBeVisible();
    await expect(sidebar.getByRole("heading", { name: "Visitors", exact: true })).toBeVisible();
    expect(await sidebar.locator(".side-quest-index-visitors").evaluate(el => el.nextElementSibling?.getAttribute("href"))).toBe("#buttons");
  }
  expect(await page.locator(".guestbook-sticker-options").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(isMobile ? 7 : 3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("snow stickers can only be placed on the snowy mountain", async ({ page }) => {
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [] } }));
  const loaded = page.waitForResponse("**/api/guestbook");
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await loaded;
  while (!await page.getByRole("button", { name: "Alolan Vulpix", exact: true }).count()) {
    await page.getByRole("button", { name: "Next sticker page", exact: true }).click();
  }
  await page.getByRole("button", { name: "Alolan Vulpix", exact: true }).click();
  const scene = page.locator(".guestbook-landscape");
  const box = (await scene.boundingBox())!;
  await scene.click({ position: { x: box.width * .34, y: box.height * .75 } });
  await expect(page.getByRole("dialog")).toContainText("in the snow");
  await page.getByRole("button", { name: "Okay", exact: true }).click();
  await scene.click({ position: { x: box.width * .46, y: box.height * .24 } });
  await expect(page.getByRole("dialog")).toContainText("Leave your sticker here?");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
});

test("sticker names appear on hover with scale and glow", async ({ page, isMobile }) => {
  test.skip(isMobile, "Hover is a desktop interaction");
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [] } }));
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  const fern = page.getByRole("button", { name: "Fern", exact: true });
  await expect(page.locator(".guestbook-picker-label")).not.toBeVisible();
  await fern.hover();
  await expect(page.locator(".guestbook-picker-label")).toBeVisible();
  await expect.poll(() => fern.locator(".guestbook-art-wrap").evaluate(el => getComputedStyle(el, "::before").opacity)).toBe("1");
  expect(await fern.locator("img").evaluate(el => getComputedStyle(el).filter)).toBe("none");
  expect(await fern.locator("img").evaluate(el => getComputedStyle(el).transform)).toBe("none");
  expect(await fern.locator("img").evaluate(el => getComputedStyle(el).imageRendering)).toBe("crisp-edges");
  expect(await fern.evaluate(el => getComputedStyle(el).borderWidth)).toBe("0px");
});

test("bird placement opens confirmation on grass and retired stickers stay out of the picker", async ({ page }) => {
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [] } }));
  const loaded = page.waitForResponse("**/api/guestbook");
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await loaded;
  const labels: string[] = [];
  const pageCounts: number[] = [];
  do {
    pageCounts.push(await page.locator(".guestbook-sticker-options button").count());
    labels.push(...await page.locator(".guestbook-sticker-options button").evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-label")!)));
    if (!await page.getByRole("button", { name: "Next sticker page", exact: true }).isEnabled()) break;
    await page.getByRole("button", { name: "Next sticker page", exact: true }).click();
  } while (true);
  expect(pageCounts.slice(0, -1).every(count => count === 12)).toBe(true);
  expect(pageCounts.at(-1)).toBe(5);
  expect(labels.indexOf("Lotus flower")).toBeLessThan(labels.indexOf("Bloodroot"));
  expect(labels.indexOf("Sunflower")).toBeLessThan(labels.indexOf("Cloud"));
  expect(labels.indexOf("Black swan")).toBeLessThan(labels.indexOf("Cat"));
  expect(labels.indexOf("Pink eyespot moth")).toBeLessThan(labels.indexOf("Chickadee"));
  expect(labels.indexOf("Mew")).toBeLessThan(labels.indexOf("Usagi"));
  expect(labels.at(-1)).toBe("Batman");
  expect(labels.indexOf("Usagi") + 1).toBe(labels.indexOf("Batman"));
  expect(labels.indexOf("Swan") + 1).toBe(labels.indexOf("Black swan"));
  expect(labels).toContain("Fawn");
  expect(labels).toContain("Doe");
  expect(labels.indexOf("Snail")).toBeLessThan(labels.indexOf("Batman"));
  expect(labels.filter(label => label === "Bunny")).toHaveLength(1);
  expect(labels.filter(label => label === "Snail")).toHaveLength(1);
  expect(labels.filter(label => label === "Leaf sheep sea slug")).toHaveLength(1);
  expect(labels).not.toEqual(expect.arrayContaining(["Blossom"]));
  expect(labels).not.toEqual(expect.arrayContaining(["Flying bird"]));
  expect(labels).not.toEqual(expect.arrayContaining(["Seedling"]));
  while (!await page.getByRole("button", { name: "Chickadee", exact: true }).count()) {
    await page.getByRole("button", { name: "Previous sticker page", exact: true }).click();
  }
  await page.getByRole("button", { name: "Chickadee", exact: true }).click();
  const scene = page.locator(".guestbook-landscape");
  const box = (await scene.boundingBox())!;
  await scene.click({ position: { x: box.width * .34, y: box.height * .75 } });
  await expect(page.getByRole("dialog")).toContainText("Leave your sticker here?");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
});

test("placed stickers use three relative sizes", async ({ page }) => {
  const entries = ["fern", "cat", "deer"].map((sticker, index) => ({ id: sticker, sticker, name: "Visitor", x: .1 + index * .3, y: .8, placedAt: "2026-11-10T12:00:00Z" }));
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries } }));
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await expect(page.locator(".guestbook-placed")).toHaveCount(3);
  const widths = await page.locator(".guestbook-placed").evaluateAll(elements => elements.map(el => el.getBoundingClientRect().width));
  expect(widths[0]).toBeLessThan(widths[1]);
  expect(widths[1]).toBeLessThan(widths[2]);
  for (const image of await page.locator(".guestbook-placed img").all()) {
    await expect(image).toHaveAttribute("src", /\.svg$/);
    expect(await image.evaluate(el => getComputedStyle(el).imageRendering)).toBe("crisp-edges");
  }

});

test("a new sticker can overlap an existing sticker", async ({ page, isMobile }) => {
  const entries = [{ id: "existing", sticker: "deer", name: "Earlier visitor", x: .30, y: .83, placedAt: "2026-11-10T12:00:00Z" }];
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries } }));
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await expect(page.locator(".guestbook-placed")).toHaveCount(1);
  await page.getByRole("button", { name: "Oxeye daisy", exact: true }).click();
  const scene = page.locator(".guestbook-landscape");
  const box = (await scene.boundingBox())!;
  const position = { x: box.width * .32, y: box.height * .83 };
  await scene.click({ position });
  if (isMobile) {
    await expect(page.locator(".guestbook-entry-label")).toBeVisible();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await scene.click({ position });
  }
  await expect(page.getByRole("dialog")).toContainText("Leave your sticker here?");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
});

test("stickers use pixel sprite assets", async ({ page }) => {
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [{ id: "palette", sticker: "fern", name: "Palette visitor", x: .3, y: .85, placedAt: "2026-11-10T12:00:00Z" }] } }));
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Fern", exact: true }).locator("img")).toHaveAttribute("src", "/guestbook/stickers/fern-soft.svg");
  const placed = page.locator(".guestbook-placed img");
  await expect(placed).toHaveAttribute("src", "/guestbook/stickers/fern-soft.svg");
  const picker = page.getByRole("button", { name: "Fern", exact: true });
  await picker.click();
  expect(await page.locator(".guestbook-landscape").evaluate(el => getComputedStyle(el).cursor)).toBe("none");
  expect(await placed.evaluate(el => getComputedStyle(el).filter)).not.toMatch(/saturate|contrast|brightness/);
  await picker.hover();
  expect(await picker.locator("img").evaluate(el => getComputedStyle(el).filter)).not.toMatch(/saturate|contrast|brightness/);
  while (await page.getByRole("button", { name: "Next sticker page", exact: true }).isEnabled()) await page.getByRole("button", { name: "Next sticker page", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mew", exact: true }).locator("img")).toHaveAttribute("src", "/guestbook/stickers/mew.svg");
  await expect(page.getByRole("button", { name: "Celebi", exact: true }).locator("img")).toHaveAttribute("src", "/guestbook/stickers/celebi.svg");
});

for (const fallback of [false, true]) {
  test(`landscape fullscreen keeps placement and the sticker picker working${fallback ? " without the Fullscreen API" : ""}`, async ({ page, isMobile }) => {
    if (fallback) await page.addInitScript(() => {
      Object.defineProperty(Element.prototype, "requestFullscreen", { value: undefined, configurable: true });
    });
    await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [] } }));
    await page.goto("/side");
    const section = page.locator("#guestbook");
    await section.scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Fullscreen", exact: true }).click();
    await expect(section).toHaveClass(/is-expanded/);
    await expect(section.getByRole("heading", { name: "Guestbook", exact: true })).not.toBeVisible();
    await expect(section.locator(".guestbook-description")).not.toBeVisible();
    await expect(section.locator(".guestbook-picker-title")).not.toBeVisible();
    await expect(section.locator(".guestbook-fullscreen")).toHaveText("");
    await expect(section.locator(".guestbook-landscape")).toHaveAttribute("aria-label", /pond/);
    await expect(page.getByRole("button", { name: "Exit fullscreen", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".guestbook-sticker-options button")).toHaveCount(65);
    await expect(page.getByRole("navigation", { name: "Sticker pages", exact: true })).toHaveCount(0);
    const viewport = page.viewportSize()!;
    const pickerBox = (await page.locator(".guestbook-picker").boundingBox())!;
    expect(pickerBox.x + pickerBox.width).toBeLessThanOrEqual(viewport.width);
    expect(pickerBox.y + pickerBox.height).toBeLessThanOrEqual(viewport.height + 1);
    if (isMobile) {
      const frame = (await page.locator(".guestbook-picture-frame").boundingBox())!;
      const controls = (await page.locator(".guestbook-landscape-controls").boundingBox())!;
      expect(controls.y + controls.height).toBeLessThanOrEqual(frame.y);
      expect(pickerBox.y).toBeGreaterThanOrEqual(frame.y + frame.height);
      await expect(page.locator(".guestbook-count")).toBeVisible();
    }
    await page.getByRole("button", { name: "Oxeye daisy", exact: true }).click();
    const scene = page.locator(".guestbook-landscape");
    const box = (await scene.boundingBox())!;
    await scene.click({ position: { x: box.width * .34, y: box.height * .75 } });
    await expect(page.getByRole("dialog")).toContainText("Leave your sticker here?");
    await expect(page.getByLabel("Your name", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("button", { name: "Exit fullscreen", exact: true }).click();
    await expect(section).not.toHaveClass(/is-expanded/);
    expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
    await expect(page.locator(".guestbook-sticker-options button")).toHaveCount(12);
    await expect(page.getByRole("button", { name: "Fullscreen", exact: true })).toHaveAttribute("aria-pressed", "false");
  });
}

async function dragGuestbookSticker(page: import("@playwright/test").Page, name: string, destination: { x: number; y: number }, touch: boolean, holdMs = 0) {
  const button = page.getByRole("button", { name, exact: true });
  const box = (await button.boundingBox())!;
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const expanded = await page.locator("#guestbook").evaluate(el => el.classList.contains("is-expanded"));
  const moves = [touch && !expanded ? { x: start.x, y: start.y - 12 } : { x: start.x - 12, y: start.y }, ...Array.from({ length: 6 }, (_, i) => ({ x: start.x + (destination.x - start.x) * (i + 1) / 6, y: start.y + (destination.y - start.y) * (i + 1) / 6 }))];
  if (touch) {
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
    if (holdMs) await page.waitForTimeout(holdMs);
    for (const point of moves) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point] });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (const point of moves) await page.mouse.move(point.x, point.y);
    await page.mouse.up();
  }
}

test("dragging an unselected sticker asks for a name before saving", async ({ page, isMobile }) => {
  const entries: Record<string, unknown>[] = [];
  await page.route("**/api/guestbook", async route => {
    if (route.request().method() === "POST") {
      const entry = { ...route.request().postDataJSON(), placedAt: "2026-11-11T12:00:00Z" };
      entries.push(entry);
      await route.fulfill({ status: 201, json: { entry } });
    } else await route.fulfill({ json: { entries } });
  });
  const loaded = page.waitForResponse("**/api/guestbook");
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await loaded;
  const box = (await page.locator(".guestbook-landscape").boundingBox())!;
  await dragGuestbookSticker(page, "Oxeye daisy", { x: box.x + box.width * .34, y: box.y + box.height * .75 }, isMobile, 750);
  await expect(page.getByRole("dialog")).toContainText("Leave your sticker here?");
  expect(entries).toHaveLength(0);
  await expect(page.locator(".guestbook-drag-ghost")).toHaveCount(0);
  await page.getByLabel("Your name", { exact: true }).fill("Drag visitor");
  await page.getByRole("button", { name: "Place sticker", exact: true }).click();
  await expect(page.locator(".guestbook-placed")).toHaveCount(1);
  expect(entries[0]).toMatchObject({ sticker: "daisy", name: "Drag visitor" });
});

test("dragging respects terrain and cancelling outside the scene keeps click selection working", async ({ page, isMobile }) => {
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [] } }));
  const loaded = page.waitForResponse("**/api/guestbook");
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await loaded;
  const box = (await page.locator(".guestbook-landscape").boundingBox())!;
  await dragGuestbookSticker(page, "Fern", { x: box.x + box.width * .4, y: box.y + box.height * .1 }, isMobile);
  await expect(page.getByRole("dialog")).toContainText("Can't place here");
  await expect(page.getByLabel("Your name", { exact: true })).not.toBeVisible();
  await page.getByRole("button", { name: "Okay", exact: true }).click();
  await dragGuestbookSticker(page, "Fern", { x: box.x + box.width / 2, y: box.y - 30 }, isMobile);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".guestbook-drag-ghost")).toHaveCount(0);
  await page.getByRole("button", { name: "Lily pad", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lily pad", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("fullscreen sticker sheet expands below the landscape and scrolls vertically", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch scrolling is checked on the phone viewport");
  await page.setViewportSize({ width: page.viewportSize()!.width, height: 600 });
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [] } }));
  const loaded = page.waitForResponse("**/api/guestbook");
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await loaded;
  await page.getByRole("button", { name: "Fullscreen", exact: true }).click();
  await expect(page.locator(".guestbook-sticker-options button")).toHaveCount(65);
  const grid = page.locator(".guestbook-sticker-options");
  const box = (await grid.boundingBox())!;
  const session = await page.context().newCDPSession(page);
  const start = { x: box.x + box.width / 2, y: box.y + box.height - 20 };
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
  for (let step = 1; step <= 8; step++) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start.x, y: start.y - (box.height - 40) * step / 8 }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
  await expect.poll(() => grid.evaluate(el => el.scrollTop)).toBeGreaterThan(20);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".guestbook-drag-ghost")).toHaveCount(0);
});

test("grass along the mountain base uses image coordinates for clicks and drops", async ({ page, isMobile }) => {
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [] } }));
  const loaded = page.waitForResponse("**/api/guestbook");
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await loaded;
  // A wider border exposes the mismatch between image and container coordinates.
  await page.addStyleTag({ content: ".guestbook-landscape { border-width: 8px !important; }" });
  await page.getByRole("button", { name: "Fern", exact: true }).click();
  const image = page.locator(".guestbook-scenery");
  for (const x of [.3, .5, .7]) {
    const box = (await image.boundingBox())!;
    await image.click({ position: { x: box.width * x, y: box.height * 327 / 576 } });
    await expect(page.getByRole("dialog")).toContainText("Leave your sticker here?");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
  }
  await image.scrollIntoViewIfNeeded();
  const box = (await image.boundingBox())!;
  await dragGuestbookSticker(page, "Fern", { x: box.x + box.width * .5, y: box.y + box.height * 327 / 576 }, isMobile);
  await expect(page.getByRole("dialog")).toContainText("Leave your sticker here?");
});


test("hover and drag previews use the final sticker size", async ({ page, isMobile }) => {
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [] } }));
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  for (const fullscreen of [false, true]) {
    if (fullscreen) await page.getByRole("button", { name: "Fullscreen", exact: true }).click();
    const button = page.getByRole("button", { name: "Fern", exact: true });
    await button.click();
    const scene = page.locator(".guestbook-scenery");
    const box = await scene.boundingBox();
    if (!box) throw new Error("Missing scenery");
    const target = { x: box.x + box.width * .3, y: box.y + box.height * .8 };
    if (!isMobile) {
      await page.mouse.move(target.x, target.y);
      const preview = page.locator(".guestbook-live-preview");
      await expect(preview).toBeVisible();
      expect((await preview.boundingBox())!.width).toBeCloseTo(box.width * .04, 0);
      await expect(preview.locator("img")).toHaveCSS("filter", "none");
    }
    const start = await button.boundingBox();
    if (!start) throw new Error("Missing sticker");
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x, target.y, { steps: 6 });
    const preview = page.locator(".guestbook-live-preview");
    await expect(preview).toBeVisible();
    const width = (await preview.boundingBox())!.width;
    expect(width).toBeCloseTo(box.width * .04, 0);
    await expect(page.locator(".guestbook-drag-ghost")).toHaveCount(0);
    await page.mouse.up();
    await expect(page.getByLabel("Your name", { exact: true })).toBeVisible();
    expect((await page.locator(".guestbook-preview").boundingBox())!.width).toBeCloseTo(width, 1);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
  }
});

test("a sunflower may cross the mountain edge when its base is on grass", async ({ page, isMobile }) => {
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [] } }));
  const loaded = page.waitForResponse("**/api/guestbook");
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await loaded;
  while (!await page.getByRole("button", { name: "Sunflower", exact: true }).count())
    await page.getByRole("button", { name: "Next sticker page", exact: true }).click();
  await page.getByRole("button", { name: "Sunflower", exact: true }).click();
  const image = page.locator(".guestbook-scenery");
  const box = (await image.boundingBox())!;
  await image.click({ position: { x: box.width * .3, y: box.height * .54 } });
  await expect(page.getByRole("heading", { name: "Leave your sticker here?", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await image.scrollIntoViewIfNeeded();
  const current = (await image.boundingBox())!;
  await dragGuestbookSticker(page, "Sunflower", { x: current.x + current.width * .3, y: current.y + current.height * .54 }, isMobile);
  await expect(page.getByRole("heading", { name: "Leave your sticker here?", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  // Its centre is above the pond, but the base reaches into water.
  await image.click({ position: { x: current.width * .65, y: current.height * .61 } });
  await expect(page.getByRole("dialog")).toContainText("Choose a spot in the grass");
});


test("fullscreen sticker names escape the scrolling picker", async ({ page, isMobile }) => {
  test.skip(isMobile, "Hover is a desktop interaction");
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [] } }));
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Fullscreen", exact: true }).click();
  await page.getByRole("button", { name: "Swallowtail butterfly", exact: true }).hover();
  const label = page.getByRole("tooltip");
  await expect(label).toHaveText("Swallowtail butterfly");
  await expect(label).toBeVisible();
  expect(await label.evaluate(el => el.matches(":popover-open"))).toBe(true);
  const box = (await label.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  const picker = (await page.locator(".guestbook-picker").boundingBox())!;
  expect(box.x).toBeLessThan(picker.x);
  await page.locator(".guestbook-sticker-options").evaluate(el => el.scrollTop = el.scrollHeight);
  await expect(label).not.toBeVisible();
});


test("the sticker sheet and landscape footer use the requested styling", async ({ page, isMobile }) => {
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [] } }));
  const loaded = page.waitForResponse("**/api/guestbook");
  await page.goto("/side");
  const section = page.locator("#guestbook");
  await section.scrollIntoViewIfNeeded();
  await loaded;
  await expect(section.locator(".guestbook-count")).toHaveText("0 stickers placed");
  const title = section.locator(".guestbook-picker-title");
  await expect(title).toHaveText("sticker sheet");
  expect(await title.evaluate(el => getComputedStyle(el).fontFamily)).toContain("STIX Two Text");
  await expect(title).toHaveCSS("font-weight", "700");
  expect(parseFloat(await title.evaluate(el => getComputedStyle(el).fontSize))).toBeLessThan(16);
  await expect(title).toHaveCSS("font-style", "italic");
  await expect(section.locator(".guestbook-picker")).toHaveCSS("background-color", "rgb(43, 48, 50)");
  await page.evaluate(() => document.documentElement.dataset.theme = "light");
  await expect(section.locator(".guestbook-picker")).toHaveCSS("background-color", "rgb(245, 246, 242)");
  expect(await section.locator(".guestbook-picker").evaluate(el => getComputedStyle(el).backgroundImage)).toContain("repeating-linear-gradient");
  const frame = (await section.locator(".guestbook-picture-frame").boundingBox())!;
  const button = (await page.getByRole("button", { name: "Fullscreen", exact: true }).boundingBox())!;
  const count = (await section.locator(".guestbook-count").boundingBox())!;
  if (isMobile) expect(button.y + button.height).toBeLessThanOrEqual(frame.y);
  else expect(button.y).toBeGreaterThanOrEqual(frame.y + frame.height);
  expect(count.x).toBeGreaterThan(button.x + button.width);
  expect(Math.abs(count.y + count.height / 2 - button.y - button.height / 2)).toBeLessThan(2);
});

test("sticker history shows message, sticker, and placement number in order", async ({ page, isMobile }) => {
  const entries = [
    { id: "earlier", sticker: "daisy", name: "Earlier visitor", message: "First hello.", x: .3, y: .8, placedAt: "2026-11-09T12:00:00Z" },
    { id: "later", sticker: "fern", name: "Later visitor", message: "Second hello.\nA new line.", x: .4, y: .8, placedAt: "2026-11-10T12:00:00Z" },
  ];
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries } }));
  const loaded = page.waitForResponse("**/api/guestbook");
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await loaded;
  const history = page.getByRole("region", { name: "History", exact: true });
  await expect(history.locator("tbody tr")).toHaveCount(2);
  await expect(history.locator(".guestbook-history-name")).toHaveText(["Later visitor", "Earlier visitor"]);
  await expect(history.locator("time").first()).not.toContainText(",");
  await expect(history.locator("td.guestbook-history-number")).toHaveText(["2", "1"]);
  const cells = history.locator("tbody tr").first().locator("td");
  await expect(cells.nth(2)).toHaveClass("guestbook-history-message");
  await expect(cells.nth(3)).toHaveClass("guestbook-history-sticker");
  await expect(cells.nth(4)).toHaveClass("guestbook-history-number");
  const messageBox = (await cells.nth(2).boundingBox())!;
  const stickerBox = (await cells.nth(3).boundingBox())!;
  const numberBox = (await cells.nth(4).boundingBox())!;
  expect(stickerBox.x).toBeGreaterThan(messageBox.x);
  expect(numberBox.x).toBeGreaterThan(stickerBox.x);
  await expect(cells.nth(4)).toHaveCSS("text-align", "right");
  await expect(history.locator(".guestbook-history-message").first()).toHaveText("Second hello.\nA new line.");
  const controls = (await page.locator(".guestbook-landscape-controls").boundingBox())!;
  const heading = (await history.getByRole("heading").boundingBox())!;
  expect(heading.y).toBeGreaterThan(controls.y + controls.height + 16);
  if (isMobile) {
    const picker = (await page.locator(".guestbook-picker").boundingBox())!;
    expect(heading.y).toBeGreaterThan(picker.y + picker.height);
  }
  await page.locator('.guestbook-placed[aria-label^="Fern"]').focus();
  await expect(page.locator(".guestbook-entry-label").filter({ hasText: "Later visitor" })).not.toContainText("Second hello");
  await page.getByRole("button", { name: "Fullscreen", exact: true }).click();
  await expect(history).not.toBeVisible();
});


test("history opens at the latest entry and can scroll back to older logs", async ({ page }) => {
  const entries = Array.from({ length: 45 }, (_, i) => ({ id: String(i), sticker: "daisy", name: `Visitor ${i + 1}`, message: `Message ${i + 1}`, x: .3, y: .8, placedAt: new Date(Date.UTC(2026, 10, 1, 12, i)).toISOString() }));
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries } }));
  const loaded = page.waitForResponse("**/api/guestbook");
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await loaded;
  const history = page.getByRole("region", { name: "History", exact: true });
  const log = page.getByRole("region", { name: "History entries", exact: true });
  await expect(history.getByRole("heading")).toHaveText("History");
  await expect(log).toHaveCSS("padding-right", "16px");
  await expect(log).toHaveCSS("scrollbar-gutter", "stable");
  await expect(history.locator("th")).toHaveText(["date", "name", "message", "sticker", "#"]);
  await expect(history.locator("th").first()).toHaveCSS("border-bottom-width", "1px");
  await expect(history.locator("th").first()).not.toHaveCSS("box-shadow", "none");
  expect(await log.evaluate(el => getComputedStyle(el).fontFamily)).toContain("Barlow Semi Condensed");
  await expect(history.locator(".guestbook-history-name").first()).toHaveText("Visitor 45");
  expect(parseFloat(await log.evaluate(el => getComputedStyle(el).maxHeight))).toBeCloseTo(307.2, 1);
  await expect(history.locator(".guestbook-history-sticker").first()).toHaveText("Oxeye daisy");
  await expect.poll(() => log.evaluate(el => el.scrollTop)).toBe(0);
  await expect(log).toHaveCSS("border-top-width", "1px");
  await expect(log).toHaveCSS("border-bottom-width", "1px");
  await log.evaluate(el => { el.scrollTop = el.scrollHeight; el.dispatchEvent(new Event("scroll")); });
  await expect.poll(() => log.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  const readingPosition = await log.evaluate(el => el.scrollTop);
  const updated = page.waitForResponse("**/api/guestbook");
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await updated;
  await expect.poll(() => log.evaluate(el => el.scrollTop)).toBe(readingPosition);
});

test("Buttons includes the raised laggy link to Boris's site", async ({ page }) => {
  await page.goto("/side");
  const link = page.locator("#buttons").getByRole("link", { name: "laggy — Boris Kafidov", exact: true });
  await expect(link).toHaveAttribute("href", "https://kafidov.dev/");
  await expect(link.locator("img")).toHaveAttribute("src", "/buttons/laggy.svg");
  expect((await page.request.get("/buttons/laggy.svg")).ok()).toBe(true);
  await expect(page.locator("#buttons").getByRole("link", { name: "Wildlife in the forest — Morten Hilmer", exact: true })).toHaveAttribute("href", "https://www.youtube.com/watch?v=F0GOOP82094");
  expect((await page.request.get("/buttons/bunny-stream.svg")).ok()).toBe(true);
  const buttons = page.locator("#buttons .site-button-wall img");
  await expect(buttons).toHaveCount(2);
  await expect(buttons.first()).toHaveCSS("width", "88px");
  await expect(buttons.first()).toHaveCSS("height", "31px");
  await expect(page.locator(".site-button-wall")).toHaveCSS("column-gap", "24px");
});


test("placement character counters update and enforce Unicode character limits", async ({ page }) => {
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries: [] } }));
  const loaded = page.waitForResponse("**/api/guestbook");
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await loaded;
  await page.getByRole("button", { name: "Oxeye daisy", exact: true }).click();
  const scene = page.locator(".guestbook-scenery");
  const box = (await scene.boundingBox())!;
  await scene.click({ position: { x: box.width * .3, y: box.height * .8 } });
  const dialog = page.getByRole("dialog");
  await expect(page.getByLabel("Your name", { exact: true })).toBeFocused();
  await expect(dialog).toContainText("0/20 characters used");
  await expect(dialog).toContainText("0/150 characters used");
  const note = page.getByLabel("Leave a message? (Optional)", { exact: true });
  await note.fill("Hello!");
  await expect(dialog).toContainText("6/150 characters used");
  await note.fill("🌸".repeat(151));
  await expect(note).toHaveValue("🌸".repeat(150));
  await expect(dialog).toContainText("150/150 characters used");
  const name = page.getByLabel("Your name", { exact: true });
  await name.fill("🌟".repeat(21));
  await expect(name).toHaveValue("🌟".repeat(20));
  await expect(dialog).toContainText("20/20 characters used");
  await name.fill("nic");
  await expect(dialog).toContainText("3/20 characters used");
  const nameBox = (await name.boundingBox())!;
  const messageBox = (await note.boundingBox())!;
  expect(nameBox.height).toBeGreaterThanOrEqual(42);
  expect(Math.abs(nameBox.width - messageBox.width)).toBeLessThan(1);
});


test("flower sizing grows the requested flowers and preserves the exceptions", async ({ page }) => {
  const enlarged = ["bloodroot", "daisy", "lavender", "tulip", "columbine", "sweet-peas", "snapdragon", "dahlia", "peony", "calla-lily", "lotus"];
  const exceptions = ["pansies", "pink-orchid", "yellow-orchid", "lily-of-the-valley", "bleeding-hearts", "sunflower"];
  const ids = [...enlarged, ...exceptions];
  const entries = ids.map(sticker => ({ id: sticker, sticker, name: "Visitor", x: .5, y: .8, placedAt: "2026-11-10T12:00:00Z" }));
  await page.route("**/api/guestbook", route => route.fulfill({ json: { entries } }));
  const loaded = page.waitForResponse("**/api/guestbook");
  await page.goto("/side");
  await page.locator("#guestbook").scrollIntoViewIfNeeded();
  await loaded;
  await expect(page.locator(".guestbook-placed")).toHaveCount(ids.length);
  const widths = await page.locator(".guestbook-placed").evaluateAll(elements => elements.map(el => (el as HTMLElement).style.width));
  for (let i = 0; i < enlarged.length; i++) expect(widths[i], enlarged[i]).toBe("5.6%");
  for (let i = 0; i < exceptions.length; i++) expect(widths[enlarged.length + i], exceptions[i]).toBe(exceptions[i] === "sunflower" ? "5.6%" : "7.6%");
  const log = page.locator(".guestbook-history-log");
  await expect(log).toHaveCSS("font-family", /Barlow Semi Condensed/);
  expect(await page.evaluate(async () => { await document.fonts.load('12px "Barlow Semi Condensed"'); return document.fonts.check('12px "Barlow Semi Condensed"'); })).toBe(true);
});

test("site buttons show their destination links above on hover", async ({ page, isMobile }) => {
  test.skip(isMobile, "Hover is a desktop interaction");
  await page.goto("/side");
  const buttons = page.locator("#buttons .site-button-wall a");
  await expect(buttons).toHaveCount(2);
  const destinations = ["https://kafidov.dev/", "https://www.youtube.com/watch?v=F0GOOP82094"];
  for (let i = 0; i < destinations.length; i++) {
    const button = buttons.nth(i);
    await expect(button).toHaveAttribute("href", destinations[i]);
    await button.hover();
    const tooltip = button.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText(destinations[i]);
    const label = (await tooltip.boundingBox())!, box = (await button.boundingBox())!;
    expect(label.y + label.height).toBeLessThan(box.y);
  }
});
