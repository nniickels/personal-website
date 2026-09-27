import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

// Execute the current functions without loading React or starting a browser.
function extract(file, start, end) {
  const source = readFileSync(new URL(`../src/app/${file}`, import.meta.url), "utf8");
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from);
  return stripTypeScriptTypes(source.slice(from, to).replace(/^export /, ""));
}
const createFrameGate = Function(`${extract("playground/shared.tsx", "export function createFrameGate", "export function useExperimentVisibility")}; return createFrameGate;`)();

for (const saveData of [false, true]) {
  for (const hz of [60, 75, 90, 120, 144, 165]) {
    const gate = createFrameGate(saveData);
    let previous = null;
    let count = 0;
    let elapsed = 0;
    for (let sample = 0; sample < hz * 10; sample++) {
      const now = sample * 1000 / hz;
      if (gate(now, previous)) continue;
      // Match playback's use of actual timestamps, not assumed frame durations.
      if (previous !== null) elapsed += Math.min(0.05, (now - previous) / 1000);
      previous = now;
      count++;
    }
    assert.equal(count, saveData ? 300 : 600, `${hz}Hz, Save-Data=${saveData}`);
    assert.ok(Math.abs(elapsed - previous / 1000) < 1e-9);
  }
}

for (const hz of [60, 120]) {
  const gate = createFrameGate(false);
  let previous = null;
  const rendered = [];
  for (let sample = 0; sample < hz * 10; sample++) {
    const now = sample * 1000 / hz + (sample % 3 - 1) * 0.4;
    if (!gate(now, previous)) { previous = now; rendered.push(now); }
    assert.equal(gate(now, previous), true, "a repeated callback cannot render twice");
  }
  assert.ok(rendered.length >= 599 && rendered.length <= 600, `${hz}Hz jitter`);
  for (const start of rendered) {
    assert.ok(rendered.filter((now) => now >= start && now < start + 1000).length <= 61);
  }
}

for (const saveData of [false, true]) {
  const gate = createFrameGate(saveData);
  let previous = null;
  for (let sample = 0; sample <= 60; sample++) {
    const now = sample * 1000 / 30;
    if (!gate(now, previous)) previous = now;
  }
  let fallback = 0;
  let recovered = 0;
  for (let sample = 1; sample <= 600; sample++) {
    const now = 2000 + sample * 1000 / 60;
    if (!gate(now, previous)) {
      previous = now;
      if (sample <= 60) fallback++;
      if (sample > 540) recovered++;
    }
  }
  assert.equal(fallback, 30, "slow delivery activates the 30fps fallback");
  assert.equal(recovered, saveData ? 30 : 60, "healthy delivery recovers without overriding Save-Data");
  assert.equal(gate(30_000, previous), false);
  assert.equal(gate(30_000, 30_000), true, "a long stall cannot queue catch-up frames");
}

console.log("Scheduling checks passed: cadence, jitter, recovery, Save-Data, and elapsed time.");
