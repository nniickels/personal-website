"use client";
import type { InputHTMLAttributes, ReactNode } from "react";
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
};

// Autonomous playback follows the display up to 60 updates/sec. Only opt into
// 30 updates/sec for Save-Data or when observed frame delivery is struggling;
// touch input by itself says nothing about the device's rendering capability.
export function createFrameGate(saveData: boolean) {
  let interval = 1000 / (saveData ? 30 : 60);
  let lastCallback: number | null = null;
  let samples = 0;
  let delayed = 0;
  return (now: number, lastRenderedAt: number | null) => {
    if (lastCallback !== null && samples < 60) {
      const elapsed = now - lastCallback;
      if (elapsed > 24 && elapsed < 200) delayed++;
      samples++;
      if (samples >= 30 && delayed / samples > 0.25) interval = 1000 / 30;
    }
    lastCallback = now;
    return lastRenderedAt !== null && now - lastRenderedAt < interval - 0.5;
  };
}

export function useExperimentVisibility<T extends HTMLElement>() {
  const elementRef = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    let intersects = false;
    const update = () => setIsVisible(intersects && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      intersects = entry.isIntersecting;
      update();
    }, { rootMargin: "120px 0px", threshold: 0.01 });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);

  return [elementRef, isVisible] as const;
}

// Only the latest sample needs rendering. Flush at the end of a gesture so a
// release before the next frame cannot lose its final value. Activity hiding
// also cancels pending work instead of applying it when the panel is reopened.
export function useFrameValue<T>(commit: (value: T) => void) {
  const latestCommit = useRef(commit);
  useLayoutEffect(() => { latestCommit.current = commit; });
  const queue = useMemo(() => {
    let frame: number | null = null;
    let pending: { value: T } | null = null;
    const cancel = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      pending = null;
    };
    const flush = () => {
      const sample = pending;
      cancel();
      if (sample) latestCommit.current(sample.value);
    };
    return {
      push(value: T) {
        pending = { value };
        if (frame === null) frame = requestAnimationFrame(flush);
      },
      flush,
      cancel,
      hasPending: () => pending !== null,
    };
  }, []);
  useLayoutEffect(() => queue.cancel, [queue]);
  return queue;
}

// The native thumb responds immediately; experiment state follows the latest
// value each display frame. No debounce, reduced frame rate, or deferred scene.
export const FrameRange = memo(function FrameRange({ value, onValueChange, ...props }:
  Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "type"> & {
    value: number; onValueChange: (value: number) => void;
  }) {
  const [draft, setDraft] = useState(value);
  const queue = useFrameValue(onValueChange);
  useLayoutEffect(() => {
    if (!queue.hasPending()) setDraft(value);
  }, [value, queue]);
  return <input {...props} type="range" value={draft}
    onChange={(event) => {
      const next = Number(event.currentTarget.value);
      setDraft(next);
      queue.push(next);
    }}
    onPointerUp={(event) => { queue.flush(); props.onPointerUp?.(event); }}
    onPointerCancel={(event) => { queue.flush(); props.onPointerCancel?.(event); }}
    onLostPointerCapture={(event) => { queue.flush(); props.onLostPointerCapture?.(event); }}
    onKeyUp={(event) => { queue.flush(); props.onKeyUp?.(event); }}
    onBlur={(event) => { queue.flush(); props.onBlur?.(event); }}
  />;
});

export const SimulatorSlider = memo(function SimulatorSlider({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: SliderProps) {
  return (
    <label className="simulator-slider">
      <span>
        {label}
        <output>{displayValue}</output>
      </span>
      <FrameRange
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={onChange}
        aria-label={label}
      />
    </label>
  );
});

export function ExperimentGuide({
  children,
  open,
  onOpenChange,
}: {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <details
      className="experiment-guide"
      open={open}
      onToggle={(event) => onOpenChange?.(event.currentTarget.open)}
    >
      <summary>
        <span className="experiment-guide-caret" aria-hidden="true" />
        Explanation
      </summary>
      <div className="experiment-guide-reveal">
        <div className="experiment-guide-content">{children}</div>
      </div>
    </details>
  );
}

export const lensingFieldStars = Array.from({ length: 34 }, (_, index) => ({
  x: 18 + ((index * 83) % 584),
  y: 16 + ((index * 47) % 348),
  radius: 0.7 + (index % 3) * 0.45,
  opacity: 0.18 + (index % 5) * 0.1,
}));

export const LENS_CENTER = { x: 310, y: 185 } as const;

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function formatMass(logMass: number) {
  if (logMass < 6) {
    return `${Math.round(10 ** logMass).toLocaleString()} M☉`;
  }

  const exponent = Math.floor(logMass);
  const mantissa = 10 ** (logMass - exponent);
  return `${mantissa.toFixed(2)} × 10^${exponent} M☉`;
}
