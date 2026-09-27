"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import MarkerWorker from "./stellar-marker.worker.js?worker";

export default function StellarMarker({ active, visible, color }: {
  active: boolean;
  visible: boolean;
  color: string;
}) {
  const markerRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLElement>(null);
  const options = useRef({ visible, color });
  const update = useRef<(() => void) | undefined>(undefined);

  useLayoutEffect(() => {
    options.current = { visible, color };
    update.current?.();
  }, [visible, color]);

  useEffect(() => {
    const marker = markerRef.current;
    const glow = glowRef.current;
    if (!active || !marker || !glow) return;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let density = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    let worker: Worker | undefined;
    let canvas: HTMLCanvasElement | undefined;
    let elapsed: (() => number) | undefined;
    let render = false;

    const stop = () => {
      const time = marker.hasAttribute("data-worker-glow") ? elapsed?.() : undefined;
      update.current = undefined;
      elapsed = undefined;
      worker?.terminate();
      worker = undefined;
      canvas?.remove();
      canvas = undefined;
      glow.removeAttribute("data-ready");
      marker.removeAttribute("data-worker-glow");
      if (time !== undefined) {
        const fallback = marker.getAnimations().find((item) =>
          (item as CSSAnimation).animationName === "stellar-marker-pulse");
        if (fallback) fallback.currentTime = time;
      }
    };
    const start = () => {
      stop();
      if (reducedMotion.matches || !HTMLCanvasElement.prototype.transferControlToOffscreen) return;
      const animation = marker.getAnimations().find((item) =>
        (item as CSSAnimation).animationName === "stellar-marker-pulse");
      if (!animation) {
        update.current = start; // Activity may still be opening the mobile panel.
        return;
      }

      try {
        canvas = document.createElement("canvas");
        glow.append(canvas);
        const offscreen = canvas.transferControlToOffscreen();
        const currentWorker = new MarkerWorker();
        worker = currentWorker;
        let time = Number(animation.currentTime);
        let epoch = Number(document.timeline.currentTime);
        let running = options.current.visible && !document.hidden;
        elapsed = () => time + (running ? Number(document.timeline.currentTime) - epoch : 0);

        // Copy the native CSS clock once; only controls/visibility touch the host
        // timeline afterwards. Every animation frame stays in the worker.
        const state = () => {
          const now = Number(document.timeline.currentTime);
          if (running) time += now - epoch;
          epoch = now;
          running = options.current.visible && !document.hidden;
          return {
            anchorTime: time,
            anchorEpoch: performance.timeOrigin + epoch,
            paused: !running,
            render,
            color: options.current.color,
            dpr: devicePixelRatio,
          };
        };
        update.current = () => currentWorker.postMessage({ type: "sync", ...state() });
        currentWorker.onmessage = ({ data }) => {
          if (worker !== currentWorker) return;
          if (data.type === "ready") {
            marker.setAttribute("data-worker-glow", "");
            glow.setAttribute("data-ready", "");
          } else if (data.type === "error") stop();
        };
        currentWorker.onerror = (event) => { event.preventDefault(); stop(); };
        currentWorker.postMessage({ type: "init", canvas: offscreen, ...state() }, [offscreen]);
      } catch {
        stop(); // Original CSS remains the fallback on unsupported devices.
      }
    };
    const sync = () => update.current?.();
    // Rendering can stop outside the marker's viewport without stopping its
    // logical CSS clock while the rest of the experiment remains visible.
    const observer = new IntersectionObserver((entries) => {
      render = entries[entries.length - 1].isIntersecting;
      sync();
    }, { rootMargin: "120px" });
    observer.observe(glow);
    const resize = () => {
      density.removeEventListener("change", resize);
      density = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
      density.addEventListener("change", resize);
      sync();
    };
    start();
    reducedMotion.addEventListener("change", start);
    density.addEventListener("change", resize);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", start);
      density.removeEventListener("change", resize);
      document.removeEventListener("visibilitychange", sync);
      stop();
    };
  }, [active]);

  return <>
    <span ref={markerRef} aria-hidden="true" />
    <i ref={glowRef} className="stellar-marker-glow" aria-hidden="true" />
  </>;
}
