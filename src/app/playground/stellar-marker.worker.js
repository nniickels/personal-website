let canvas, context, color, dpr, anchorTime, anchorEpoch, paused, render;
let frame = null;
let ready = false;

// CSS ease-in-out: solve the x coordinate of cubic-bezier(.42, 0, .58, 1).
function ease(x) {
  let t = x;
  for (let i = 0; i < 7; i++) {
    t -= (1.26 * t - .78 * t * t + .52 * t * t * t - x) / (1.26 - 1.56 * t + 1.56 * t * t);
  }
  return 3 * t * t - 2 * t * t * t;
}

function draw(timestamp) {
  const time = anchorTime + (paused ? 0 : performance.timeOrigin + timestamp - anchorEpoch);
  const half = ((time % 2400) + 2400) % 2400 / 1200;
  const progress = ease(half <= 1 ? half : 2 - half);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.globalAlpha = .52 + .3 * progress;
  context.shadowBlur = (8 + 10 * progress) * dpr;
  context.fill();
  if (!ready) {
    ready = true;
    postMessage({ type: "ready" });
  }
  frame = paused || !render ? null : requestAnimationFrame(draw);
}

self.onmessage = ({ data }) => {
  try {
    if (data.type === "init") {
      if (typeof requestAnimationFrame !== "function") throw Error("Worker animation unavailable");
      canvas = data.canvas;
      // Prefer CPU rasterization for this small, continuously blurred surface.
      context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw Error("Worker canvas unavailable");
    }
    ({ color, dpr, anchorTime, anchorEpoch, paused, render } = data);
    const size = Math.round(90 * dpr);
    if (canvas.width !== size || canvas.height !== size) canvas.width = canvas.height = size;
    dpr = size / 90;
    context.shadowColor = color;
    context.shadowOffsetX = 145 * dpr;
    context.fillStyle = "white";
    context.beginPath();
    // Retain the off-canvas disk path between frames; clearRect only clears
    // pixels. Its native Gaussian shadow leaves the DOM border/fill intact.
    context.arc(-100 * dpr, 45 * dpr, 5.5 * dpr, 0, Math.PI * 2);
    if (frame !== null) cancelAnimationFrame(frame);
    frame = render || !ready ? requestAnimationFrame(draw) : null;
  } catch {
    postMessage({ type: "error" });
  }
};
