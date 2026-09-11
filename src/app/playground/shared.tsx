"use client";
import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
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

export function SimulatorSlider({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: SliderProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.currentTarget.value));
  };

  return (
    <label className="simulator-slider">
      <span>
        {label}
        <output>{displayValue}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        aria-label={label}
      />
    </label>
  );
}

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
