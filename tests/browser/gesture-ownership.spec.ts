import { expect, test } from "@playwright/test";

test("a secondary touch preserves the original orbit drag and playback intent", async ({ page, browserName, isMobile }) => {
  test.skip(browserName !== "chromium" || !isMobile, "Native multi-touch input uses Chromium CDP in a touch context.");
  await page.route("**/gc/**", route => route.fulfill(route.request().url().endsWith(".js")
    ? { contentType: "application/javascript", body: "" } : { json: { count: "123" } }));
  await page.route("https://webring.ca/**", route => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/playground#orbital-resonance");
  const section = page.locator("#orbital-resonance");
  const scene = section.locator(".resonance-canvas");
  const body = scene.locator(".resonance-body").first();
  await section.getByRole("button", { name: "Play orbits", exact: true }).click();
  await scene.scrollIntoViewIfNeeded();
  const bounds = (await scene.boundingBox())!;
  const first = { id: 11, x: bounds.x + bounds.width * 0.7, y: bounds.y + bounds.height * 0.5 };
  const second = { id: 22, x: bounds.x + bounds.width * 0.25, y: bounds.y + bounds.height * 0.25 };
  const movedFirst = { ...first, x: bounds.x + bounds.width * 0.5, y: bounds.y + bounds.height * 0.7 };
  const movedSecond = { ...second, y: bounds.y + bounds.height * 0.6 };
  const client = await page.context().newCDPSession(page);
  let touchActive = false;
  const settle = () => page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  try {
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [first] });
    touchActive = true;
    // Wait for the first pointer's React commit: it stores resume=true, then pauses.
    await expect(scene).toHaveClass(/is-dragging/);
    await expect(section.getByRole("button", { name: "Play orbits", exact: true })).toBeVisible();
    const before = await body.getAttribute("transform");
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [first, second] });
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [movedFirst, second] });
    await settle();
    const afterOwnerMove = await body.getAttribute("transform");
    expect.soft(afterOwnerMove, "the first touch continues rotating the system").not.toBe(before);
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [movedFirst, movedSecond] });
    await settle();
    expect.soft(await body.getAttribute("transform"), "moving the secondary touch does not rotate the system").toBe(afterOwnerMove);
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    touchActive = false;
    await expect(scene).not.toHaveClass(/is-dragging/);
    await expect(section.getByRole("button", { name: "Pause orbits", exact: true })).toBeVisible();
  } finally {
    if (touchActive) await client.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
    await client.detach();
  }
});
