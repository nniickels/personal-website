import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

test("stellar marker worker preserves the CSS pulse, paused clock, and DPR geometry", async () => {
  const frames = new Map();
  const messages = [];
  const draws = [];
  let nextFrame = 0;
  const context = {
    clearRect() {}, beginPath() {},
    arc(...args) { this.circle = args; },
    fill() { draws.push({ alpha: this.globalAlpha, blur: this.shadowBlur, circle: this.circle }); },
  };
  const canvas = { width: 0, height: 0, getContext: () => context };
  const scope = {
    self: {}, performance: { timeOrigin: 100_000 },
    postMessage: message => messages.push(message),
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
  };
  runInNewContext(await readFile(new URL("../src/app/playground/stellar-marker.worker.js", import.meta.url), "utf8"), scope);
  const send = data => scope.self.onmessage({ data });
  const tick = timestamp => {
    assert.equal(frames.size, 1);
    const [id, callback] = frames.entries().next().value;
    frames.delete(id);
    callback(timestamp);
  };
  const state = { color: "#ffd89a", dpr: 2, anchorTime: 0, anchorEpoch: 100_000, paused: false, render: true };
  send({ type: "init", canvas, ...state, render: false });
  tick(0);
  assert.equal(messages[0].type, "ready");
  assert.equal(canvas.width, 180);
  assert.equal(canvas.height, 180);
  assert.equal(draws.at(-1).alpha, .52);
  assert.equal(draws.at(-1).blur, 16);
  assert.deepEqual(Array.from(draws.at(-1).circle), [-200, 90, 11, 0, Math.PI * 2]);
  assert.equal(frames.size, 0); // Even an offscreen start completes the CSS handoff.
  send({ type: "sync", ...state });
  tick(600);
  assert.equal(draws.at(-1).alpha, .67);
  assert.equal(draws.at(-1).blur, 26);
  tick(1200);
  assert.ok(Math.abs(draws.at(-1).alpha - .82) < 1e-12);
  assert.equal(draws.at(-1).blur, 36);
  send({ type: "sync", ...state, anchorTime: 600, paused: true });
  tick(9000);
  assert.equal(draws.at(-1).blur, 26);
  assert.equal(frames.size, 0);
  send({ type: "sync", ...state, anchorTime: 600, anchorEpoch: 109_000 });
  tick(9600);
  assert.equal(draws.at(-1).blur, 36);
  assert.equal(messages.length, 1);
  send({ type: "sync", ...state, dpr: 1.25, anchorTime: 0, paused: true });
  tick(9700);
  assert.equal(canvas.width, 113);
  assert.equal(draws.at(-1).circle[1], canvas.height / 2);
  const drawingCount = draws.length;
  send({ type: "sync", ...state, render: false });
  assert.equal(frames.size, 0);
  assert.equal(draws.length, drawingCount);
  // Becoming visible catches up to the original running clock; it does not
  // resume the old raster's phase or spend frames drawing outside the viewport.
  send({ type: "sync", ...state });
  tick(10_800);
  assert.equal(draws.at(-1).blur, 36);
  assert.equal(draws.length, drawingCount + 1);
  // A transferred HTML canvas starts at 300×150. Matching only its width
  // must not leave the first glow stretched at a fractional display density.
  const nativeCanvas = { width: 300, height: 150, getContext: () => context };
  send({ type: "init", canvas: nativeCanvas, ...state, dpr: 10 / 3, paused: true });
  tick(11_000);
  assert.equal(nativeCanvas.width, 300);
  assert.equal(nativeCanvas.height, 300);
  assert.equal(draws.at(-1).circle[1], nativeCanvas.height / 2);
});
