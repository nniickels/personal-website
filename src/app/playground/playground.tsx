"use client";

import type {
  CSSProperties,
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NightSky, SiteFooter, SiteHeader } from "../portfolio";

const HUBBLE_CONSTANT = 67.4;
const OMEGA_MATTER = 0.315;
const OMEGA_LAMBDA = 0.685;
const EDDINGTON_TIME_GYR = 0.45;
const SOLAR_MASS = "M☉";
const VISUAL_LOG_MASS_MIN = 1;
const VISUAL_LOG_MASS_REFERENCE_MAX = 15;
const GROWTH_CHART_LOG_MASS_MIN = 1;
const GROWTH_CHART_DEFAULT_LOG_MASS_MAX = 20;
const STELLAR_TIMELINE_START_FRACTION = 5 / 6;
const STELLAR_PHASE_POSITIONS = [0, 100 / 3, 200 / 3, 100] as const;

const playgroundNavigation = [
  { label: "Black-Hole Growth", href: "#black-hole-growth" },
  { label: "Stellar Evolution", href: "#stellar-evolution" },
  { label: "Gravitational Lensing", href: "#gravitational-lensing" },
  { label: "Orbital Resonance", href: "#orbital-resonance" },
] as const;

let playgroundScrollAnimationFrame: number | null = null;

function navigateToPlaygroundExperiment(
  event: ReactMouseEvent<HTMLAnchorElement>,
  href: string,
) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  event.preventDefault();
  const target = document.querySelector(href);
  if (!(target instanceof HTMLElement)) return;

  window.history.replaceState(null, "", href);
  const headerHeight = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--header-height"),
  ) || 48;
  const destination = Math.max(
    0,
    target.getBoundingClientRect().top + window.scrollY - headerHeight - 16,
  );

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, destination);
    return;
  }

  if (playgroundScrollAnimationFrame !== null) {
    window.cancelAnimationFrame(playgroundScrollAnimationFrame);
  }

  const start = window.scrollY;
  const distance = destination - start;
  const duration = 260;
  const startedAt = performance.now();

  const animateScroll = (now: number) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    window.scrollTo(0, start + distance * easedProgress);

    if (progress < 1) {
      playgroundScrollAnimationFrame = window.requestAnimationFrame(animateScroll);
    } else {
      playgroundScrollAnimationFrame = null;
    }
  };

  playgroundScrollAnimationFrame = window.requestAnimationFrame(animateScroll);
}

const presets = [
  {
    name: "Stellar seed",
    seedLogMass: 2,
    seedRedshift: 25,
    observedRedshift: 7,
    eddingtonRatio: 1,
    dutyCycle: 0.7,
    spin: 0.2,
  },
  {
    name: "Direct collapse",
    seedLogMass: 5,
    seedRedshift: 20,
    observedRedshift: 7,
    eddingtonRatio: 1,
    dutyCycle: 0.7,
    spin: 0.7,
  },
  {
    name: "Rapid growth",
    seedLogMass: 4,
    seedRedshift: 25,
    observedRedshift: 7,
    eddingtonRatio: 1.5,
    dutyCycle: 0.9,
    spin: 0.4,
  },
] as const;

function cosmicAgeAtRedshift(redshift: number) {
  const hubbleTimeGyr = 9.778 / (HUBBLE_CONSTANT / 100);
  const argument = Math.sqrt(OMEGA_LAMBDA / OMEGA_MATTER) / (1 + redshift) ** 1.5;
  return (
    (2 * hubbleTimeGyr) /
    (3 * Math.sqrt(OMEGA_LAMBDA)) *
    Math.asinh(argument)
  );
}

function redshiftAtCosmicAge(ageGyr: number) {
  const hubbleTimeGyr = 9.778 / (HUBBLE_CONSTANT / 100);
  const argument = Math.sinh(
    (3 * Math.sqrt(OMEGA_LAMBDA) * ageGyr) / (2 * hubbleTimeGyr),
  );
  const scaleFactor = (argument / Math.sqrt(OMEGA_LAMBDA / OMEGA_MATTER)) ** (2 / 3);
  return Math.max(0, 1 / scaleFactor - 1);
}

function formatMass(logMass: number) {
  if (logMass < 6) {
    return `${Math.round(10 ** logMass).toLocaleString()} ${SOLAR_MASS}`;
  }

  const exponent = Math.floor(logMass);
  const mantissa = 10 ** (logMass - exponent);
  return `${mantissa.toFixed(2)} × 10^${exponent} ${SOLAR_MASS}`;
}

function formatDuration(gyr: number) {
  if (gyr < 1) return `${Math.round(gyr * 1_000)} Myr`;
  return `${gyr.toFixed(2)} Gyr`;
}

function radiativeEfficiencyFromSpin(spin: number) {
  const boundedSpin = clamp(spin, -0.998, 0.998);
  const z1 =
    1 +
    Math.cbrt(1 - boundedSpin ** 2) *
      (Math.cbrt(1 + boundedSpin) + Math.cbrt(1 - boundedSpin));
  const z2 = Math.sqrt(3 * boundedSpin ** 2 + z1 ** 2);
  const iscoRadius =
    3 +
    z2 -
    Math.sign(boundedSpin || 1) *
      Math.sqrt((3 - z1) * (3 + z1 + 2 * z2));

  return 1 - Math.sqrt(1 - 2 / (3 * iscoRadius));
}

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
};

function SimulatorSlider({
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

function ExperimentGuide({ children }: { children: ReactNode }) {
  return (
    <details className="experiment-guide">
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

function VariablesGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`simulator-advanced variable-guide${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="simulator-advanced-toggle"
        aria-expanded={open}
        aria-controls="black-hole-variables-guide"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="simulator-advanced-caret" aria-hidden="true" />
        Variables guide
      </button>
      <div className="simulator-advanced-reveal">
        <div
          id="black-hole-variables-guide"
          className="simulator-advanced-content variable-guide-content"
        >
          <dl>
            <div>
              <dt>Seed mass</dt>
              <dd>
                10–100 M☉ suits ordinary stellar remnants, 10²–10⁴ M☉ massive Population III
                remnants or cluster products, and 10⁴–10⁶ M☉ proposed direct-collapse seeds.
              </dd>
            </div>
            <div>
              <dt>Accretion rate</dt>
              <dd>
                The Eddington ratio is λ = L / Lₑdd. About 0.1 is weak feeding, 1 a near-Eddington
                quasar, and above 1 idealized super-Eddington growth. “× reference” compares the
                growth rate with 10% efficiency, so it varies with spin.
              </dd>
            </div>
            <div>
              <dt>Spin, a*</dt>
              <dd>
                Near zero can follow chaotic feeding or mixed mergers. Positive spin can follow
                aligned feeding; negative spin means a counter-rotating disk.
              </dd>
            </div>
            <div>
              <dt>Seed redshift</dt>
              <dd>
                z ≈ 20–30 suits first stellar remnants; z ≈ 10–20 many direct-collapse scenarios.
              </dd>
            </div>
            <div>
              <dt>Observation redshift</dt>
              <dd>
                z ≈ 6–10 probes the first billion years and early quasars. Lower values allow more growth time.
              </dd>
            </div>
            <div>
              <dt>Duty cycle</dt>
              <dd>
                About 10% is intermittent, 50% sustained but episodic, and 100% continuously active.
              </dd>
            </div>
            <div>
              <dt>Radiative efficiency</dt>
              <dd>
                The thin-disk relation gives about 5.7% at zero spin, less for retrograde disks,
                and more for rapidly prograde disks.
              </dd>
            </div>
            <div>
              <dt>Variable presets</dt>
              <dd>
                <strong>Stellar seed</strong> starts with a 10² M☉ remnant at z = 25 and tests sustained,
                near-Eddington growth. <strong>Direct collapse</strong> starts with a 10⁵ M☉ seed at z = 20,
                giving growth a large head start despite its higher-spin efficiency. <strong>Rapid growth</strong>
                starts at 10⁴ M☉ and z = 25 with a 1.5 Eddington ratio and 90% duty cycle, representing
                an idealized, sustained super-Eddington route.
              </dd>
            </div>
          </dl>
          <p>
            These ranges and presets are illustrative, not fits to individual black holes. Real systems can shift between regimes.
          </p>
        </div>
      </div>
    </div>
  );
}

export function BlackHoleGrowthSimulator() {
  const [seedLogMass, setSeedLogMass] = useState(5);
  const [seedRedshift, setSeedRedshift] = useState(20);
  const [observedRedshift, setObservedRedshift] = useState(7);
  const [eddingtonRatio, setEddingtonRatio] = useState(1);
  const [spin, setSpin] = useState(0.7);
  const [dutyCycle, setDutyCycle] = useState(0.7);
  const efficiency = radiativeEfficiencyFromSpin(spin);
  const effectiveAccretionRate = eddingtonRatio * (0.1 / efficiency);
  const [progress, setProgress] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [viewYaw, setViewYaw] = useState(-9);
  const [viewPitch, setViewPitch] = useState(68);
  const [rotatingView, setRotatingView] = useState(false);
  const animationFrame = useRef<number | null>(null);
  const blackHoleDrag = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
  } | null>(null);
  const chartMarkerPointer = useRef<number | null>(null);

  const model = useMemo(() => {
    const seedAge = cosmicAgeAtRedshift(seedRedshift);
    const observedAge = cosmicAgeAtRedshift(observedRedshift);
    const growthTime = Math.max(0, observedAge - seedAge);
    const effectiveEfoldingTime =
      (EDDINGTON_TIME_GYR * efficiency) /
      ((1 - efficiency) * eddingtonRatio * dutyCycle);
    const growthDex = growthTime / effectiveEfoldingTime / Math.LN10;
    const finalLogMass = seedLogMass + growthDex;
    const currentAge = seedAge + growthTime * progress;
    const currentLogMass = seedLogMass + growthDex * progress;

    return {
      seedAge,
      observedAge,
      growthTime,
      effectiveEfoldingTime,
      finalLogMass,
      currentAge,
      currentLogMass,
      currentRedshift: redshiftAtCosmicAge(currentAge),
    };
  }, [dutyCycle, eddingtonRatio, efficiency, observedRedshift, progress, seedLogMass, seedRedshift]);

  useEffect(() => {
    if (!playing) return;

    const initialProgress = progress >= 1 ? 0.02 : progress;
    const startedAt = performance.now();
    const duration = Math.max(1_500, 8_500 * (1 - initialProgress));

    const animate = (now: number) => {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const easedElapsed = 1 - (1 - elapsed) ** 1.7;
      const nextProgress = Math.min(
        1,
        initialProgress + easedElapsed * (1 - initialProgress),
      );
      setProgress(nextProgress);
      if (nextProgress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        setPlaying(false);
      }
    };

    setProgress(initialProgress);
    animationFrame.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    };
  }, [playing]);

  const updateControl = (setter: (value: number) => void) => (value: number) => {
    setPlaying(false);
    setProgress(1);
    setter(value);
  };

  const updateSeedRedshift = (value: number) => {
    setPlaying(false);
    setProgress(1);
    setSeedRedshift(value);
    setObservedRedshift((current) => Math.min(current, value - 1));
  };

  const applyPreset = (preset: (typeof presets)[number]) => {
    setPlaying(false);
    setSeedLogMass(preset.seedLogMass);
    setSeedRedshift(preset.seedRedshift);
    setObservedRedshift(preset.observedRedshift);
    setEddingtonRatio(preset.eddingtonRatio);
    setDutyCycle(preset.dutyCycle);
    setSpin(preset.spin);
    setProgress(1);
  };

  const resetSimulation = () => {
    applyPreset(presets[1]);
    setViewYaw(-9);
    setViewPitch(68);
  };

  const beginBlackHoleRotation = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    blackHoleDrag.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    setRotatingView(true);
  };

  const rotateBlackHole = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = blackHoleDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.lastX;
    const deltaY = event.clientY - drag.lastY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    setViewYaw((current) => {
      const next = current + deltaX * 0.55;
      return ((next + 180) % 360 + 360) % 360 - 180;
    });
    setViewPitch((current) => clamp(current - deltaY * 0.42, 18, 84));
  };

  const endBlackHoleRotation = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = blackHoleDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    blackHoleDrag.current = null;
    setRotatingView(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const togglePlayback = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (progress >= 1) setProgress(0.02);
    setPlaying(true);
  };

  const chart = useMemo(() => {
    const width = 620;
    const height = 250;
    const left = 58;
    const right = 598;
    const top = 20;
    const bottom = 205;
    const yMin = GROWTH_CHART_LOG_MASS_MIN;
    const yMax = Math.max(
      GROWTH_CHART_DEFAULT_LOG_MASS_MAX,
      Math.ceil(model.finalLogMass + 0.25),
    );
    const xAt = (fraction: number) => left + fraction * (right - left);
    const yAt = (logMass: number) => {
      const clamped = Math.min(yMax, Math.max(yMin, logMass));
      return bottom - ((clamped - yMin) / (yMax - yMin)) * (bottom - top);
    };
    const points = Array.from({ length: 81 }, (_, index) => {
      const fraction = index / 80;
      return `${xAt(fraction).toFixed(2)},${yAt(seedLogMass + (model.finalLogMass - seedLogMass) * fraction).toFixed(2)}`;
    }).join(" ");

    return {
      width,
      height,
      left,
      right,
      top,
      bottom,
      yMin,
      yMax,
      points,
      targetY: yAt(9),
      currentX: xAt(progress),
      currentY: yAt(model.currentLogMass),
    };
  }, [model.currentLogMass, model.finalLogMass, progress, seedLogMass]);

  const updateProgressFromChartPointer = (event: ReactPointerEvent<SVGCircleElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const bounds = svg.getBoundingClientRect();
    const pointerX = ((event.clientX - bounds.left) / bounds.width) * chart.width;
    setProgress(clamp((pointerX - chart.left) / (chart.right - chart.left), 0, 1));
  };

  const beginChartScrub = (event: ReactPointerEvent<SVGCircleElement>) => {
    event.preventDefault();
    setPlaying(false);
    chartMarkerPointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateProgressFromChartPointer(event);
  };

  const scrubChart = (event: ReactPointerEvent<SVGCircleElement>) => {
    if (chartMarkerPointer.current !== event.pointerId) return;
    updateProgressFromChartPointer(event);
  };

  const endChartScrub = (event: ReactPointerEvent<SVGCircleElement>) => {
    if (chartMarkerPointer.current !== event.pointerId) return;
    chartMarkerPointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const scrubChartWithKeyboard = (event: ReactKeyboardEvent<SVGCircleElement>) => {
    const increments: Partial<Record<string, number>> = {
      ArrowLeft: -0.01,
      ArrowDown: -0.01,
      ArrowRight: 0.01,
      ArrowUp: 0.01,
      PageDown: -0.05,
      PageUp: 0.05,
    };
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setPlaying(false);
      setProgress(event.key === "Home" ? 0 : 1);
      return;
    }
    const increment = increments[event.key];
    if (increment === undefined) return;
    event.preventDefault();
    setPlaying(false);
    setProgress((current) => clamp(current + increment, 0, 1));
  };

  const visualMassScale = Math.max(
    0,
    (model.currentLogMass - VISUAL_LOG_MASS_MIN) /
      (VISUAL_LOG_MASS_REFERENCE_MAX - VISUAL_LOG_MASS_MIN),
  );
  const visualStyle = {
    "--mass-scale": visualMassScale,
    "--spin-duration": `${(6.2 - Math.abs(spin) * 4.8).toFixed(2)}s`,
    "--spin-direction": spin < 0 ? "reverse" : "normal",
    "--spin-opacity": Math.abs(spin) < 0.03 ? 0.2 : 0.9,
    "--disk-luminosity": (0.32 + Math.min(1, eddingtonRatio / 1.5) * 0.68).toFixed(2),
    "--disk-inner-edge": `${clamp(22 - spin * 4.5, 17.5, 26.5).toFixed(1)}%`,
    "--view-yaw": `${viewYaw.toFixed(1)}deg`,
    "--view-pitch": `${viewPitch.toFixed(1)}deg`,
  } as CSSProperties;
  const activePresetName = presets.find((preset) =>
    Math.abs(seedLogMass - preset.seedLogMass) < 0.001 &&
    Math.abs(seedRedshift - preset.seedRedshift) < 0.001 &&
    Math.abs(observedRedshift - preset.observedRedshift) < 0.001 &&
    Math.abs(eddingtonRatio - preset.eddingtonRatio) < 0.001 &&
    Math.abs(dutyCycle - preset.dutyCycle) < 0.001 &&
    Math.abs(spin - preset.spin) < 0.001
  )?.name;

  return (
    <section id="black-hole-growth" className="black-hole-simulator" aria-labelledby="black-hole-simulator-title">
      <header className="simulator-heading">
        <p className="simulator-kicker">Experiment 01</p>
        <h2 id="black-hole-simulator-title">Black-Hole Growth Simulator</h2>
        <p>
          Test whether a black-hole seed can grow into an early-universe giant under a simple
          constant-Eddington-ratio accretion model.
        </p>
      </header>

      <ExperimentGuide>
        <p>
          The dark sphere marks the event-horizon region and the tilted ring is a stylized
          accretion disk, neither ray-traced nor drawn to physical scale. The bright lower
          semicircle is the near side of the disk, while the upper arc is the far side. They are
          depth cues, not measurements. The moving texture indicates spin direction and relative
          speed. Seed mass sets the starting mass, accretion rate sets the Eddington ratio,
          spin sets thin-disk radiative efficiency, redshifts set the time interval, and duty cycle
          sets how often the black hole is active.
        </p>
        <p>
          The graph plots cosmic time horizontally and logarithmic mass vertically, so exponential
          growth appears nearly straight. The dot and vertical line mark playback, and 10⁹ M☉ is a benchmark, not
          a limit. Larger seeds, higher Eddington ratios, longer growth, and higher duty cycles
          increase final mass. High prograde spin can slow growth by raising radiative efficiency.
          Fuel limits, feedback, mergers, and changing accretion states are not included.
        </p>
      </ExperimentGuide>

      <VariablesGuide />

      <div className="simulator-presets" aria-label="Growth scenarios">
        <span className="simulator-presets-label">Variable presets:</span>
        {presets.map((preset) => {
          const isActive = preset.name === activePresetName;
          return (
            <button
              type="button"
              className={isActive ? "is-active" : undefined}
              aria-pressed={isActive}
              key={preset.name}
              onClick={() => applyPreset(preset)}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      <div className="simulator-workspace">
        <div className="simulator-visual-panel">
          <p className="rotation-hint">Drag to rotate in 3D; drag the plot dot to inspect mass growth</p>
          <div
            className={`black-hole-stage${rotatingView ? " is-dragging" : ""}`}
            style={visualStyle}
            role="img"
            aria-label="Growing black hole with a draggable three-dimensional accretion disk"
            onPointerDown={beginBlackHoleRotation}
            onPointerMove={rotateBlackHole}
            onPointerUp={endBlackHoleRotation}
            onPointerCancel={endBlackHoleRotation}
          >
            <div className="black-hole-orbit-plane">
              <div className="accretion-disk" aria-hidden="true">
                <span className="accretion-texture" />
                <span className="accretion-flow accretion-flow--outer" />
                <span className="accretion-flow accretion-flow--middle" />
                <span className="accretion-flow accretion-flow--inner" />
              </div>
            </div>
            <div className="black-hole-core" aria-hidden="true" />
            <div className="black-hole-orbit-plane black-hole-orbit-plane--foreground" aria-hidden="true">
              <div className="accretion-disk accretion-disk--foreground">
                <span className="accretion-texture" />
                <span className="accretion-flow accretion-flow--outer" />
                <span className="accretion-flow accretion-flow--middle" />
                <span className="accretion-flow accretion-flow--inner" />
              </div>
            </div>
            <div className="black-hole-glow" />
          </div>

          <div className="simulator-now" aria-live="polite">
            <span>z = {model.currentRedshift.toFixed(1)}</span>
            <strong>{formatMass(model.currentLogMass)}</strong>
          </div>
        </div>

        <div className="simulator-controls">
          <SimulatorSlider
            label="Seed mass"
            value={seedLogMass}
            min={1}
            max={6}
            step={0.1}
            displayValue={formatMass(seedLogMass)}
            onChange={updateControl(setSeedLogMass)}
          />
          <SimulatorSlider
            label="Seed redshift"
            value={seedRedshift}
            min={8}
            max={30}
            step={1}
            displayValue={`z = ${seedRedshift.toFixed(0)}`}
            onChange={updateSeedRedshift}
          />
          <SimulatorSlider
            label="Accretion rate"
            value={eddingtonRatio}
            min={0.1}
            max={2}
            step={0.05}
            displayValue={`${effectiveAccretionRate.toFixed(2)} × reference`}
            onChange={updateControl(setEddingtonRatio)}
          />
          <div className={`simulator-advanced${advancedOpen ? " is-open" : ""}`}>
            <button
              type="button"
              className="simulator-advanced-toggle"
              aria-expanded={advancedOpen}
              aria-controls="black-hole-advanced-settings"
              onClick={() => setAdvancedOpen((current) => !current)}
            >
              <span className="simulator-advanced-caret" aria-hidden="true" />
              Advanced settings
            </button>
            <div className="simulator-advanced-reveal">
              <div id="black-hole-advanced-settings" className="simulator-advanced-content">
                <SimulatorSlider
                  label="Spin"
                  value={spin}
                  min={-0.998}
                  max={0.998}
                  step={0.01}
                  displayValue={`a* = ${spin.toFixed(2)}`}
                  onChange={updateControl(setSpin)}
                />
                <SimulatorSlider
                  label="Observation redshift"
                  value={observedRedshift}
                  min={4}
                  max={Math.min(15, seedRedshift - 1)}
                  step={0.5}
                  displayValue={`z = ${observedRedshift.toFixed(1)}`}
                  onChange={updateControl(setObservedRedshift)}
                />
                <SimulatorSlider
                  label="Duty cycle"
                  value={dutyCycle}
                  min={0.1}
                  max={1}
                  step={0.05}
                  displayValue={`${Math.round(dutyCycle * 100)}%`}
                  onChange={updateControl(setDutyCycle)}
                />
                <div className="simulator-derived-setting">
                  <span>Radiative efficiency</span>
                  <output>{(efficiency * 100).toFixed(1)}% — derived from spin</output>
                </div>
              </div>
            </div>
          </div>

          <div className="simulator-actions">
            <button type="button" className="simulator-primary-action" onClick={togglePlayback}>
              {playing ? "Pause growth" : progress > 0 && progress < 1 ? "Continue growth" : "Play growth"}
            </button>
            <button type="button" onClick={resetSimulation}>Reset</button>
          </div>
        </div>

        <figure className="growth-chart-figure">
          <svg
            className="growth-chart"
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            role="img"
            aria-label="Logarithmic black-hole mass growth over cosmic time"
          >
            <line className="growth-chart-axis" x1={chart.left} y1={chart.bottom} x2={chart.right} y2={chart.bottom} />
            <line className="growth-chart-axis" x1={chart.left} y1={chart.top} x2={chart.left} y2={chart.bottom} />
            <line className="growth-chart-target" x1={chart.left} y1={chart.targetY} x2={chart.right} y2={chart.targetY} />
            <text className="growth-chart-label" x={chart.right - 4} y={chart.targetY - 7} textAnchor="end">
              10⁹ M☉ benchmark
            </text>
            <polyline className="growth-chart-line" points={chart.points} />
            <line className="growth-chart-progress" x1={chart.currentX} y1={chart.top} x2={chart.currentX} y2={chart.bottom} />
            <circle
              className="growth-chart-marker-hit"
              cx={chart.currentX}
              cy={chart.currentY}
              r="15"
              role="slider"
              tabIndex={0}
              aria-label="Inspect growth time"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              aria-valuetext={`z = ${model.currentRedshift.toFixed(1)}, ${formatMass(model.currentLogMass)}`}
              onPointerDown={beginChartScrub}
              onPointerMove={scrubChart}
              onPointerUp={endChartScrub}
              onPointerCancel={endChartScrub}
              onKeyDown={scrubChartWithKeyboard}
            />
            <circle className="growth-chart-marker" cx={chart.currentX} cy={chart.currentY} r="5" />
            <text className="growth-chart-label" x={chart.left} y={chart.bottom + 17}>seed</text>
            <text className="growth-chart-label" x={chart.right} y={chart.bottom + 17} textAnchor="end">observed</text>
            <text
              className="growth-chart-axis-title"
              x={(chart.left + chart.right) / 2}
              y={chart.height - 5}
              textAnchor="middle"
            >
              Cosmic time (seed → observation)
            </text>
            <text
              className="growth-chart-axis-title"
              x="14"
              y={(chart.top + chart.bottom) / 2}
              textAnchor="middle"
              transform={`rotate(-90 14 ${(chart.top + chart.bottom) / 2})`}
            >
              Black-hole mass (M☉, log₁₀ scale)
            </text>
            <text className="growth-chart-label" x={chart.left - 10} y={chart.top + 4} textAnchor="end">
              10^{chart.yMax.toFixed(0)}
            </text>
            <text className="growth-chart-label" x={chart.left - 10} y={chart.bottom + 4} textAnchor="end">
              10^{chart.yMin.toFixed(0)}
            </text>
          </svg>
          <figcaption className="growth-chart-caption">
            <strong>Projected mass growth</strong>
            <span>
              Time runs from the seed epoch to observation from left to right; mass increases
              logarithmically upward. The solid curve is the model, the dot and vertical line
              mark playback. Drag the dot to inspect any time in the simulation. The dashed line is
              the 10⁹ M☉ comparison benchmark. The vertical
              scale normally extends to 10²⁰ M☉ and expands automatically when a selected setup
              projects a larger result, preventing the curve from clipping.
            </span>
          </figcaption>
        </figure>
      </div>

      <dl className="simulator-results">
        <div>
          <dt>Time available</dt>
          <dd>{formatDuration(model.growthTime)}</dd>
        </div>
        <div>
          <dt>Effective e-folding time</dt>
          <dd>{formatDuration(model.effectiveEfoldingTime)}</dd>
        </div>
        <div>
          <dt>Projected mass</dt>
          <dd>{formatMass(model.finalLogMass)}</dd>
        </div>
      </dl>

      <p className="simulator-method-note">
        Toy model: a flat ΛCDM expansion without radiation sets the available time. Mass then grows
        exponentially at fixed Eddington ratio, duty cycle, spin, and spin-derived thin-disk
        efficiency. It omits finite fuel, feedback, mergers, and evolving accretion or spin. Outputs
        are mathematical projections, not physical predictions.
      </p>
    </section>
  );
}

const lensingFieldStars = Array.from({ length: 34 }, (_, index) => ({
  x: 18 + ((index * 83) % 584),
  y: 16 + ((index * 47) % 348),
  radius: 0.7 + (index % 3) * 0.45,
  opacity: 0.18 + (index % 5) * 0.1,
}));

const LENS_CENTER = { x: 310, y: 185 } as const;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function GravitationalLensingSandbox() {
  const [sourcePosition, setSourcePosition] = useState({ x: 410, y: 135 });
  const [displaySourcePosition, setDisplaySourcePosition] = useState({ x: 410, y: 135 });
  const displaySourceRef = useRef(displaySourcePosition);
  const lensAnimationFrame = useRef<number | null>(null);
  const [lensLogMass, setLensLogMass] = useState(12);
  const [distanceRatio, setDistanceRatio] = useState(0.5);
  const [sourceSize, setSourceSize] = useState(10);
  const [sourceRotation, setSourceRotation] = useState(-22);
  const activePointer = useRef<number | null>(null);
  const previousPointerX = useRef<number | null>(null);

  useEffect(() => {
    const from = displaySourceRef.current;
    const startedAt = performance.now();
    const duration = activePointer.current === null ? 260 : 110;

    const animate = (now: number) => {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - elapsed) ** 3;
      const nextPosition = {
        x: from.x + (sourcePosition.x - from.x) * eased,
        y: from.y + (sourcePosition.y - from.y) * eased,
      };
      displaySourceRef.current = nextPosition;
      setDisplaySourcePosition(nextPosition);

      if (elapsed < 1) {
        lensAnimationFrame.current = requestAnimationFrame(animate);
      }
    };

    lensAnimationFrame.current = requestAnimationFrame(animate);
    return () => {
      if (lensAnimationFrame.current !== null) {
        cancelAnimationFrame(lensAnimationFrame.current);
      }
    };
  }, [sourcePosition]);

  const lensModel = useMemo(() => {
    const dx = displaySourcePosition.x - LENS_CENTER.x;
    const dy = displaySourcePosition.y - LENS_CENTER.y;
    const beta = Math.hypot(dx, dy);
    const directionX = beta > 0.01 ? dx / beta : 1;
    const directionY = beta > 0.01 ? dy / beta : 0;
    const einsteinRadius = clamp(
      55 * Math.sqrt(10 ** (lensLogMass - 12) * (distanceRatio / 0.5)),
      18,
      138,
    );
    const discriminant = Math.sqrt(beta ** 2 + 4 * einsteinRadius ** 2);
    const thetaPlus = (beta + discriminant) / 2;
    const thetaMinus = (beta - discriminant) / 2;
    const safeU = Math.max(beta / einsteinRadius, 0.025);
    const magnificationTerm =
      (safeU ** 2 + 2) / (2 * safeU * Math.sqrt(safeU ** 2 + 4));
    const plusMagnification = 0.5 + magnificationTerm;
    const minusMagnification = Math.abs(0.5 - magnificationTerm);
    const totalMagnification = plusMagnification + minusMagnification;
    const angle = (Math.atan2(directionY, directionX) * 180) / Math.PI + 90;
    const ringStrength = clamp(1 - beta / Math.max(1, einsteinRadius * 0.42), 0, 1);

    return {
      beta,
      einsteinRadius,
      totalMagnification,
      ringStrength,
      angle,
      imageSeparation: discriminant,
      plus: {
        x: LENS_CENTER.x + directionX * thetaPlus,
        y: LENS_CENTER.y + directionY * thetaPlus,
        magnification: plusMagnification,
      },
      minus: {
        x: LENS_CENTER.x + directionX * thetaMinus,
        y: LENS_CENTER.y + directionY * thetaMinus,
        magnification: minusMagnification,
      },
    };
  }, [displaySourcePosition, distanceRatio, lensLogMass]);

  const moveSource = (event: ReactPointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 620;
    const y = ((event.clientY - bounds.top) / bounds.height) * 370;
    setSourcePosition({ x: clamp(x, 24, 596), y: clamp(y, 24, 346) });
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    activePointer.current = event.pointerId;
    previousPointerX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveSource(event);
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (activePointer.current !== event.pointerId) return;
    if (previousPointerX.current !== null) {
      const deltaX = event.clientX - previousPointerX.current;
      setSourceRotation((current) => current + deltaX * 0.7);
    }
    previousPointerX.current = event.clientX;
    moveSource(event);
  };

  const handlePointerEnd = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    previousPointerX.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const resetLensing = () => {
    setSourcePosition({ x: 410, y: 135 });
    setLensLogMass(12);
    setDistanceRatio(0.5);
    setSourceSize(10);
    setSourceRotation(-22);
  };

  const renderImage = (
    image: typeof lensModel.plus,
    className: string,
  ) => {
    const tangentialRadius = clamp(
      sourceSize * Math.sqrt(Math.max(image.magnification, 0.1)) * 1.55,
      sourceSize,
      78,
    );
    const radialRadius = clamp(
      sourceSize / Math.sqrt(Math.max(image.magnification, 0.2)),
      3.2,
      sourceSize,
    );

    return (
      <g
        className={`lensing-image ${className}`}
        transform={`translate(${image.x} ${image.y}) rotate(${lensModel.angle})`}
      >
        <ellipse rx={tangentialRadius} ry={radialRadius} />
        <ellipse className="lensing-image-core" rx={tangentialRadius * 0.56} ry={radialRadius * 0.55} />
      </g>
    );
  };

  return (
    <section id="gravitational-lensing" className="gravitational-lensing-sandbox" aria-labelledby="lensing-sandbox-title">
      <header className="simulator-heading">
        <p className="simulator-kicker">Experiment 03</p>
        <h2 id="lensing-sandbox-title">Gravitational Lensing Sandbox</h2>
        <p>
          Drag the background galaxy around a foreground lens and watch gravity split, stretch,
          and magnify its apparent image.
        </p>
      </header>

      <ExperimentGuide>
        <p>
          The lens is a massive foreground galaxy or cluster whose gravity bends light from the
          background galaxy. The central dark marker represents its mass as a single point, not its
          visible shape or size. The labeled source is the galaxy&apos;s true position, the bright arcs
          are its apparent images, and the dashed circle is the Einstein radius. Lens mass and the
          distance factor set the bending scale. Source size changes the drawn arcs but not the
          point-source magnification estimate.
        </p>
        <p>
          Near alignment, the two images brighten and stretch toward the Einstein radius. Perfect
          alignment forms an Einstein ring. The ideal point-source magnification diverges there, so
          the readout stops at “&gt; 40×.” This point-mass model demonstrates geometry, not
          observational predictions.
        </p>
      </ExperimentGuide>

      <div className="lensing-workspace">
        <div className="lensing-visual-panel">
          <div className="lensing-instruction">
            <span>Drag to move and rotate the source galaxy</span>
            <strong>{lensModel.ringStrength > 0.82 ? "Einstein ring" : "Two-image lens"}</strong>
          </div>

          <svg
            className="lensing-canvas"
            viewBox="0 0 620 370"
            role="img"
            aria-label="Interactive gravitational lens showing a foreground lens, draggable source galaxy, and lensed images"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          >
            <defs>
              <radialGradient id="lensing-galaxy-gradient">
                <stop offset="0" stopColor="#c8a8ff" stopOpacity="0.95" />
                <stop offset="0.32" stopColor="#9f79e8" stopOpacity="0.55" />
                <stop offset="1" stopColor="#7953c6" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="lensing-lens-gradient">
                <stop offset="0" stopColor="#efc77f" stopOpacity="0.58" />
                <stop offset="0.45" stopColor="#d99b55" stopOpacity="0.2" />
                <stop offset="1" stopColor="#b46e38" stopOpacity="0" />
              </radialGradient>
              <filter id="lensing-soft-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="3.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect className="lensing-field" width="620" height="370" rx="10" />
            {lensingFieldStars.map((star, index) => (
              <circle
                className="lensing-field-star"
                key={`${star.x}-${star.y}-${index}`}
                cx={star.x}
                cy={star.y}
                r={star.radius}
                opacity={star.opacity}
              />
            ))}

            <circle
              className="einstein-guide"
              cx={LENS_CENTER.x}
              cy={LENS_CENTER.y}
              r={lensModel.einsteinRadius}
            />
            <circle
              className="einstein-ring"
              cx={LENS_CENTER.x}
              cy={LENS_CENTER.y}
              r={lensModel.einsteinRadius}
              style={{ opacity: lensModel.ringStrength }}
            />

            {lensModel.ringStrength < 0.94 && renderImage(lensModel.minus, "lensing-image--minus")}
            {lensModel.ringStrength < 0.94 && renderImage(lensModel.plus, "lensing-image--plus")}

            <g className="lensing-lens" transform={`translate(${LENS_CENTER.x} ${LENS_CENTER.y})`}>
              <circle r="36" />
              <circle className="lensing-lens-core" r="13" />
              <text y="55" textAnchor="middle">foreground lens</text>
            </g>

            <g
              className="lensing-source"
              transform={`translate(${displaySourcePosition.x} ${displaySourcePosition.y}) rotate(${sourceRotation})`}
            >
              <circle className="lensing-source-handle" r={Math.max(18, sourceSize * 1.9)} />
              <ellipse rx={sourceSize * 1.55} ry={sourceSize * 0.72} />
              <ellipse className="lensing-source-core" rx={sourceSize * 0.55} ry={sourceSize * 0.34} />
              <text y={Math.max(29, sourceSize * 2.5)} textAnchor="middle">source</text>
            </g>
          </svg>
        </div>

        <div className="lensing-controls simulator-controls">
          <SimulatorSlider
            label="Lens mass"
            value={lensLogMass}
            min={10}
            max={13.5}
            step={0.1}
            displayValue={formatMass(lensLogMass)}
            onChange={setLensLogMass}
          />
          <SimulatorSlider
            label="Distance factor"
            value={distanceRatio}
            min={0.1}
            max={0.9}
            step={0.05}
            displayValue={`Dₗₛ / Dₛ = ${distanceRatio.toFixed(2)}`}
            onChange={setDistanceRatio}
          />
          <SimulatorSlider
            label="Source size"
            value={sourceSize}
            min={5}
            max={18}
            step={1}
            displayValue={`${sourceSize.toFixed(0)} px`}
            onChange={setSourceSize}
          />

          <div className="simulator-actions lensing-actions">
            <button
              type="button"
              className="simulator-primary-action"
              onClick={() => setSourcePosition({ ...LENS_CENTER })}
            >
              Perfect alignment
            </button>
            <button type="button" onClick={resetLensing}>Reset</button>
          </div>
        </div>
      </div>

      <dl className="simulator-results lensing-results">
        <div>
          <dt>Einstein radius</dt>
          <dd>{lensModel.einsteinRadius.toFixed(1)} canvas units</dd>
        </div>
        <div>
          <dt>Total magnification</dt>
          <dd>{lensModel.beta < 1 ? "> 40×" : `${lensModel.totalMagnification.toFixed(2)}×`}</dd>
        </div>
        <div>
          <dt>Image separation</dt>
          <dd>{lensModel.imageSeparation.toFixed(1)} canvas units</dd>
        </div>
      </dl>

      <p className="simulator-method-note">
        Toy model: an axisymmetric point-mass lens uses the scalar thin-lens equation to place and
        magnify two point-source images. Source size, arc shape, and display scale are illustrative.
        Real galaxies and clusters have extended, asymmetric mass distributions that can produce
        more complex images.
      </p>
    </section>
  );
}

const resonancePresets = {
  "2:1": {
    label: "2:1 chain",
    periods: [1, 2, 4, 8, 16],
    repeatAfter: ["one orbit", "2 inner orbits", "4 inner orbits", "8 inner orbits", "16 inner orbits"],
  },
  "3:2": {
    label: "3:2 chain",
    periods: [1, 1.5, 2.25, 3.375, 5.0625],
    repeatAfter: ["one orbit", "3 inner orbits", "9 inner orbits", "27 inner orbits", "81 inner orbits"],
  },
  "5:3": {
    label: "5:3 chain",
    periods: [1, 5 / 3, 25 / 9, 125 / 27, 625 / 81],
    repeatAfter: ["one orbit", "5 inner orbits", "25 inner orbits", "125 inner orbits", "625 inner orbits"],
  },
  free: {
    label: "Near resonance",
    periods: [1, 1.73, 2.91, 4.67, 7.56],
    repeatAfter: ["one orbit", "no short repeat", "no short repeat", "no short repeat", "no short repeat"],
  },
} as const;

type ResonancePreset = keyof typeof resonancePresets;
type ResonanceBodyCount = 1 | 2 | 3 | 4 | 5;

const ORBIT_RADII = [46, 76, 108, 140, 172] as const;

export function OrbitalResonanceToy() {
  const [bodyCount, setBodyCount] = useState<ResonanceBodyCount>(3);
  const [resonance, setResonance] = useState<ResonancePreset>("2:1");
  const [speed, setSpeed] = useState(1);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const resonanceFrame = useRef<number | null>(null);
  const previousTime = useRef<number | null>(null);
  const resonanceDrag = useRef<{
    pointerId: number;
    lastAngle: number;
    resumeAfterDrag: boolean;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const preset = resonancePresets[resonance];

  useEffect(() => {
    if (!playing) {
      previousTime.current = null;
      return;
    }

    const animate = (now: number) => {
      if (previousTime.current !== null) {
        const elapsedSeconds = Math.min(0.05, (now - previousTime.current) / 1_000);
        setPhase((current) => (current + elapsedSeconds * speed * 0.12) % 100);
      }
      previousTime.current = now;
      resonanceFrame.current = requestAnimationFrame(animate);
    };

    resonanceFrame.current = requestAnimationFrame(animate);
    return () => {
      if (resonanceFrame.current !== null) cancelAnimationFrame(resonanceFrame.current);
      previousTime.current = null;
    };
  }, [playing, speed]);

  const bodies = useMemo(() => {
    return preset.periods.slice(0, bodyCount).map((period, index) => {
      const angle = (phase / period) * Math.PI * 2 - Math.PI / 2;
      const radius = ORBIT_RADII[index];
      return {
        index,
        period,
        radius,
        x: 310 + radius * Math.cos(angle),
        y: 190 + radius * 0.58 * Math.sin(angle),
      };
    });
  }, [bodyCount, phase, preset.periods]);

  const setBodies = (count: ResonanceBodyCount) => {
    setBodyCount(count);
    setPhase(0);
  };

  const setResonancePreset = (nextPreset: ResonancePreset) => {
    setResonance(nextPreset);
    setPhase(0);
  };

  const resetOrbits = () => {
    setBodyCount(3);
    setResonance("2:1");
    setSpeed(1);
    setPhase(0);
    setPlaying(true);
  };

  const pointerAngle = (event: ReactPointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 620;
    const y = ((event.clientY - bounds.top) / bounds.height) * 380;
    return Math.atan2((y - 190) / 0.58, x - 310);
  };

  const beginOrbitDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    resonanceDrag.current = {
      pointerId: event.pointerId,
      lastAngle: pointerAngle(event),
      resumeAfterDrag: playing,
    };
    setPlaying(false);
    setDragging(true);
  };

  const rotateOrbits = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = resonanceDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const nextAngle = pointerAngle(event);
    let angleDelta = nextAngle - drag.lastAngle;
    if (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
    if (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
    drag.lastAngle = nextAngle;
    setPhase((current) => {
      const next = current + angleDelta / (Math.PI * 2);
      return ((next % 100) + 100) % 100;
    });
  };

  const endOrbitDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = resonanceDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    resonanceDrag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.resumeAfterDrag) setPlaying(true);
  };

  const ratioLabel = bodyCount === 1
    ? "single orbit"
    : preset.periods
        .slice(0, bodyCount)
        .map((period) => period.toFixed(2).replace(/\.00$/, ""))
        .join(" : ");

  return (
    <section id="orbital-resonance" className="orbital-resonance-toy" aria-labelledby="orbital-resonance-title">
      <header className="simulator-heading">
        <p className="simulator-kicker">Experiment 04</p>
        <h2 id="orbital-resonance-title">Orbital Resonance Toy</h2>
        <p>
          Choose one to five bodies and compare exact period-ratio chains with a near-resonant
          setup whose relative positions do not repeat on a short cycle.
        </p>
      </header>

      <div className="resonance-workspace">
        <div className="resonance-visual-panel">
          <div className="resonance-status" aria-live="polite">
            <span>{bodyCount} {bodyCount === 1 ? "body" : "bodies"} · drag to rotate</span>
            <strong>{bodyCount === 1 ? "No resonance yet" : preset.label}</strong>
          </div>
          <svg
            className={`resonance-canvas${dragging ? " is-dragging" : ""}`}
            viewBox="0 0 620 380"
            role="img"
            aria-label={`${bodyCount} orbiting bodies in a ${bodyCount === 1 ? "single" : preset.label} configuration. Drag to rotate the system.`}
            onPointerDown={beginOrbitDrag}
            onPointerMove={rotateOrbits}
            onPointerUp={endOrbitDrag}
            onPointerCancel={endOrbitDrag}
          >
            <defs>
              <radialGradient id="resonance-star-glow">
                <stop offset="0" stopColor="#ffe1a0" stopOpacity="0.88" />
                <stop offset="0.24" stopColor="#f3b65f" stopOpacity="0.38" />
                <stop offset="1" stopColor="#d77b32" stopOpacity="0" />
              </radialGradient>
              <filter id="resonance-body-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect className="resonance-field" width="620" height="380" rx="10" />
            {lensingFieldStars.slice(0, 26).map((star, index) => (
              <circle
                className="resonance-field-star"
                key={`resonance-${star.x}-${star.y}-${index}`}
                cx={star.x}
                cy={star.y}
                r={star.radius}
                opacity={star.opacity * 0.7}
              />
            ))}
            {ORBIT_RADII.slice(0, bodyCount).map((radius, index) => (
              <ellipse
                className="resonance-orbit"
                key={radius}
                cx="310"
                cy="190"
                rx={radius}
                ry={radius * 0.58}
                style={{ opacity: 0.48 - index * 0.07 }}
              />
            ))}
            {bodyCount > 1 && bodies.map((body) => (
              <line
                className="resonance-spoke"
                key={`spoke-${body.index}`}
                x1="310"
                y1="190"
                x2={body.x}
                y2={body.y}
              />
            ))}
            <circle className="resonance-star-glow" cx="310" cy="190" r="48" />
            <circle className="resonance-star" cx="310" cy="190" r="12" />
            {bodies.map((body) => (
              <g
                className={`resonance-body resonance-body--${body.index + 1}`}
                key={`body-${body.index}`}
                transform={`translate(${body.x} ${body.y})`}
              >
                <circle className="resonance-body-halo" r={11 - body.index} />
                <circle r={5.8 - body.index * 0.65} />
              </g>
            ))}
          </svg>
        </div>

        <div className="resonance-controls simulator-controls">
          <fieldset className="resonance-body-picker">
            <legend>Orbiting bodies</legend>
            <div>
              {([1, 2, 3, 4, 5] as const).map((count) => (
                <button
                  type="button"
                  key={count}
                  aria-pressed={bodyCount === count}
                  onClick={() => setBodies(count)}
                >
                  {count}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="resonance-select">
            <span>Period relationship</span>
            <select
              value={resonance}
              onChange={(event) => setResonancePreset(event.currentTarget.value as ResonancePreset)}
              disabled={bodyCount === 1}
            >
              {Object.entries(resonancePresets).map(([value, option]) => (
                <option value={value} key={value}>{option.label}</option>
              ))}
            </select>
          </label>

          <SimulatorSlider
            label="Animation speed"
            value={speed}
            min={1}
            max={10}
            step={0.25}
            displayValue={`${speed.toFixed(2).replace(/\.00$/, "")}×`}
            onChange={setSpeed}
          />

          <div className="simulator-actions resonance-actions">
            <button
              type="button"
              className="simulator-primary-action"
              onClick={() => setPlaying((current) => !current)}
            >
              {playing ? "Pause orbits" : "Play orbits"}
            </button>
            <button type="button" onClick={resetOrbits}>Reset</button>
          </div>
        </div>
      </div>

      <dl className="simulator-results resonance-results">
        <div>
          <dt>Relative periods</dt>
          <dd>{ratioLabel}</dd>
        </div>
        <div>
          <dt>Pattern repeats after</dt>
          <dd>{preset.repeatAfter[bodyCount - 1]}</dd>
        </div>
        <div>
          <dt>Inner-orbit phase</dt>
          <dd>{(phase % 1).toFixed(2)} turns</dd>
        </div>
      </dl>

      <p className="simulator-method-note">
        Toy model: non-interacting markers move at constant angular speed on prescribed circular,
        coplanar tracks. Period ratios are independent of the displayed radii, so the diagram does not
        enforce Kepler&apos;s third law or gravitational dynamics. Rational-ratio chains repeat; the
        near-resonance preset has no listed short repeat. It demonstrates repeating alignments, not
        resonance locking or librating resonant angles.
      </p>
    </section>
  );
}

type StellarPhase = {
  key: "main-sequence" | "red-giant" | "red-supergiant" | "planetary-nebula" | "supernova" | "white-dwarf" | "neutron-star" | "black-hole";
  label: string;
  start: number;
  end: number;
  timelinePosition: number;
  size: number;
  color: string;
};

const stellarPresets = [
  { name: "Sun-like", mass: 1 },
  { name: "Massive", mass: 12 },
  { name: "Very massive", mass: 30 },
] as const;

function stellarEvolutionTrack(mass: number): StellarPhase[] {
  const mainSequenceColor = mass < 0.8
    ? "#ffad72"
    : mass < 1.3
      ? "#ffd89a"
      : mass < 3
        ? "#fff2cf"
        : mass < 8
          ? "#d8e9ff"
          : "#9cc7ff";
  const mainSequenceSize = clamp(56 + Math.log2(mass + 1) * 10, 60, 112);

  if (mass < 8) {
    return [
      { key: "main-sequence", label: "Main sequence", start: 0, end: 0.72, timelinePosition: STELLAR_PHASE_POSITIONS[0], size: mainSequenceSize, color: mainSequenceColor },
      { key: "red-giant", label: "Red giant", start: 0.72, end: 0.82, timelinePosition: STELLAR_PHASE_POSITIONS[1], size: 158, color: "#ff8757" },
      { key: "planetary-nebula", label: "Planetary nebula", start: 0.82, end: 0.91, timelinePosition: STELLAR_PHASE_POSITIONS[2], size: 30, color: "#e9f4ff" },
      { key: "white-dwarf", label: "White dwarf", start: 0.91, end: 1, timelinePosition: STELLAR_PHASE_POSITIONS[3], size: 22, color: "#e7f2ff" },
    ];
  }

  if (mass < 25) {
    return [
      { key: "main-sequence", label: "Main sequence", start: 0, end: 0.76, timelinePosition: STELLAR_PHASE_POSITIONS[0], size: mainSequenceSize, color: mainSequenceColor },
      { key: "red-supergiant", label: "Red supergiant", start: 0.76, end: 0.83, timelinePosition: STELLAR_PHASE_POSITIONS[1], size: 178, color: "#ff704f" },
      { key: "supernova", label: "Core-collapse supernova", start: 0.83, end: 0.91, timelinePosition: STELLAR_PHASE_POSITIONS[2], size: 40, color: "#fff1be" },
      { key: "neutron-star", label: "Neutron star", start: 0.91, end: 1, timelinePosition: STELLAR_PHASE_POSITIONS[3], size: 15, color: "#b9e4ff" },
    ];
  }

  return [
    { key: "main-sequence", label: "Main sequence", start: 0, end: 0.76, timelinePosition: STELLAR_PHASE_POSITIONS[0], size: mainSequenceSize, color: mainSequenceColor },
    { key: "red-supergiant", label: "Supergiant", start: 0.76, end: 0.83, timelinePosition: STELLAR_PHASE_POSITIONS[1], size: 184, color: "#ff704f" },
    { key: "supernova", label: "Core-collapse supernova", start: 0.83, end: 0.91, timelinePosition: STELLAR_PHASE_POSITIONS[2], size: 42, color: "#fff1be" },
    { key: "black-hole", label: "Black hole", start: 0.91, end: 1, timelinePosition: STELLAR_PHASE_POSITIONS[3], size: 54, color: "#020202" },
  ];
}

function mainSequenceLuminosity(mass: number) {
  if (mass < 0.43) return 0.23 * mass ** 2.3;
  if (mass < 2) return mass ** 4;
  if (mass < 16) return 1.5 * mass ** 3.5;
  return 3_200 * mass;
}

function formatStellarLifetime(gyr: number) {
  if (gyr < 0.01) return `${(gyr * 1_000).toFixed(1)} Myr`;
  if (gyr < 1) return `${Math.round(gyr * 1_000)} Myr`;
  if (gyr > 100) return "> 100 Gyr";
  return `${gyr.toFixed(gyr < 10 ? 1 : 0)} Gyr`;
}

function formatSolarLuminosity(luminosity: number) {
  if (luminosity < 0.1) return `${luminosity.toFixed(2)} L☉`;
  if (luminosity < 100) return `${luminosity.toFixed(1)} L☉`;
  if (luminosity < 10_000) return `${Math.round(luminosity).toLocaleString()} L☉`;
  return `${luminosity.toExponential(1).replace("e+", " × 10^")} L☉`;
}

function mainSequenceTimelineStart(mass: number) {
  const mainSequence = stellarEvolutionTrack(mass)[0];
  return mainSequence.start +
    (mainSequence.end - mainSequence.start) * STELLAR_TIMELINE_START_FRACTION;
}

function stellarTimelineAnchors(stages: StellarPhase[]) {
  return stages.map((stage, index) => ({
    progress: index === 0
      ? stage.start + (stage.end - stage.start) * STELLAR_TIMELINE_START_FRACTION
      : stage.start,
    position: stage.timelinePosition,
  }));
}

function progressToStellarTimelinePosition(stages: StellarPhase[], progress: number) {
  const anchors = stellarTimelineAnchors(stages);
  if (progress <= anchors[0].progress) return 0;

  for (let index = 1; index < anchors.length; index += 1) {
    const previous = anchors[index - 1];
    const current = anchors[index];
    if (progress <= current.progress) {
      const fraction = (progress - previous.progress) / (current.progress - previous.progress);
      return previous.position + fraction * (current.position - previous.position);
    }
  }

  return 100;
}

function stellarTimelinePositionToProgress(stages: StellarPhase[], position: number) {
  const anchors = stellarTimelineAnchors(stages);
  if (position <= 0) return anchors[0].progress;

  for (let index = 1; index < anchors.length; index += 1) {
    const previous = anchors[index - 1];
    const current = anchors[index];
    if (position <= current.position) {
      const fraction = (position - previous.position) / (current.position - previous.position);
      return previous.progress + fraction * (current.progress - previous.progress);
    }
  }

  return anchors[anchors.length - 1].progress;
}

export function StellarEvolutionExplorer() {
  const [mass, setMass] = useState(1);
  const [progress, setProgress] = useState(() => mainSequenceTimelineStart(1));
  const [playing, setPlaying] = useState(false);
  const animationFrame = useRef<number | null>(null);
  const stages = useMemo(() => stellarEvolutionTrack(mass), [mass]);
  const currentStage = stages.find((stage, index) =>
    progress >= stage.start && (progress < stage.end || index === stages.length - 1),
  ) ?? stages[0];
  const mainSequenceLifetime = clamp(10 * mass ** -2.5, 0.003, 180);
  const luminosity = mainSequenceLuminosity(mass);
  const finalRemnant = mass < 8 ? "White dwarf" : mass < 25 ? "Neutron star" : "Black hole";
  const activePreset = stellarPresets.find((preset) => preset.mass === mass)?.name;
  const timelineSliderPosition = progressToStellarTimelinePosition(stages, progress);
  const stellarStyle = {
    "--stellar-size": `${currentStage.size}px`,
    "--stellar-glow-size": `${currentStage.size * 1.75}px`,
    "--stellar-color": currentStage.color,
    "--stellar-pulse-duration": `${clamp(4.8 - mass * 0.08, 1.8, 4.8).toFixed(2)}s`,
  } as CSSProperties;

  useEffect(() => {
    if (!playing) return;
    const initialProgress = progress >= 1 ? mainSequenceTimelineStart(mass) : progress;
    const startedAt = performance.now();
    const duration = Math.max(2_400, 18_000 * (1 - initialProgress));

    const animate = (now: number) => {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const nextProgress = initialProgress + elapsed * (1 - initialProgress);
      setProgress(nextProgress);
      if (nextProgress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        setPlaying(false);
      }
    };

    setProgress(initialProgress);
    animationFrame.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    };
  }, [playing]);

  const updateMass = (nextMass: number) => {
    setPlaying(false);
    setMass(nextMass);
    setProgress(mainSequenceTimelineStart(nextMass));
  };

  const selectStage = (stage: StellarPhase) => {
    setPlaying(false);
    setProgress(stage.key === "main-sequence" ? mainSequenceTimelineStart(mass) : stage.start);
  };

  const resetEvolution = () => {
    setPlaying(false);
    setMass(1);
    setProgress(mainSequenceTimelineStart(1));
  };

  return (
    <section id="stellar-evolution" className="stellar-evolution-explorer" aria-labelledby="stellar-evolution-title">
      <header className="simulator-heading">
        <p className="simulator-kicker">Experiment 02</p>
        <h2 id="stellar-evolution-title">Stellar Evolution Explorer</h2>
        <p>
          Change a star&apos;s initial mass and follow its simplified path from the main sequence to its final remnant.
        </p>
      </header>

      <ExperimentGuide>
        <p>
          Initial mass sets the approximate main-sequence lifetime, luminosity, evolutionary stages,
          and final remnant. Play the sequence, drag the timeline slider, or select a phase below the
          visual. The timeline begins 5/6ths through the main sequence. Phase markers are evenly
          spaced for readability, so slider position is not to scale by time. During playback, it moves more slowly
          through longer toy-model intervals.
          Playback remains intentionally slowed so each final phase is visible. Surface drift represents
          rotation and convection, while the stronger giant-phase breathing represents pulsation; their
          animation speeds are illustrative rather than real-time.
        </p>
        <p>
          Lower-mass stars become red giants, shed planetary nebulae, and leave white dwarfs. More
          massive stars undergo core-collapse supernovae and leave neutron stars or black holes.
          The <strong>Sun-like</strong> preset is 1 M☉ and ends as a white dwarf, <strong>Massive</strong> is
          12 M☉ and ends as a neutron star, and <strong>Very massive</strong> is 30 M☉ and ends as a black
          hole. Boundaries are approximate because composition, rotation, winds, and binary interaction also matter.
        </p>
      </ExperimentGuide>

      <div className="simulator-presets" aria-label="Stellar mass presets">
        <span className="simulator-presets-label">Mass presets:</span>
        {stellarPresets.map((preset) => (
          <button
            type="button"
            className={activePreset === preset.name ? "is-active" : undefined}
            aria-pressed={activePreset === preset.name}
            key={preset.name}
            onClick={() => updateMass(preset.mass)}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="stellar-workspace">
        <div className="stellar-visual-panel">
          <div className="stellar-status" aria-live="polite">
            <span>{mass.toFixed(1)} M☉ · {Math.round(progress * 100)}%</span>
            <strong>{currentStage.label}</strong>
          </div>
          <div
            className={`stellar-canvas stellar-canvas--${currentStage.key}`}
            style={stellarStyle}
            role="img"
            aria-label={`${mass.toFixed(1)} solar-mass star in the ${currentStage.label} phase`}
          >
            {lensingFieldStars.slice(0, 30).map((star, index) => (
              <span
                className="stellar-field-star"
                key={`stellar-${star.x}-${star.y}-${index}`}
                style={{
                  left: `${(star.x / 620) * 100}%`,
                  top: `${(star.y / 370) * 100}%`,
                  width: `${star.radius * 1.4}px`,
                  height: `${star.radius * 1.4}px`,
                  opacity: star.opacity * 0.7,
                }}
              />
            ))}
            <span className="stellar-nebula" aria-hidden="true" />
            <span className="stellar-supernova-shell" aria-hidden="true" />
            <span className="stellar-burst" aria-hidden="true" />
            <span className="stellar-glow" aria-hidden="true" />
            <span className="stellar-object" aria-hidden="true"><span /></span>
          </div>

        </div>

        <div className="stellar-controls simulator-controls">
          <SimulatorSlider
            label="Initial mass"
            value={mass}
            min={0.5}
            max={40}
            step={0.5}
            displayValue={`${mass.toFixed(1)} M☉`}
            onChange={updateMass}
          />
          <div className="simulator-actions stellar-actions">
            <button
              type="button"
              className="simulator-primary-action"
              onClick={() => setPlaying((current) => !current)}
            >
              {playing ? "Pause evolution" : "Play evolution"}
            </button>
            <button type="button" onClick={resetEvolution}>Reset</button>
          </div>
        </div>

        <div className="stellar-timeline-panel">
          <p id="stellar-timeline-hint" className="stellar-timeline-hint">
            Phases are evenly spaced, not to scale by time; playback slows through longer intervals. <strong>Drag to explore or select any phase.</strong>
          </p>
          <div className="stellar-timeline-control">
            <input
              className="stellar-timeline-scrubber"
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={timelineSliderPosition}
              aria-label="Evolution progress"
              aria-describedby="stellar-timeline-hint"
              onChange={(event) => {
                setPlaying(false);
                setProgress(stellarTimelinePositionToProgress(stages, Number(event.currentTarget.value)));
              }}
            />
            <ol className="stellar-timeline" aria-label="Evolutionary phases">
              {stages.map((stage, index) => (
                <li
                  key={stage.key}
                  style={{
                    "--stage-color": stage.color,
                    "--stage-position": `${stage.timelinePosition}%`,
                    "--stage-label-offset": "0rem",
                  } as CSSProperties}
                >
                  <button
                    type="button"
                    aria-pressed={currentStage.key === stage.key}
                    onClick={() => selectStage(stage)}
                  >
                    <span aria-hidden="true" />
                    <small>
                      {index === 0 ? (
                        "5/6ths through main sequence"
                      ) : (
                        stage.label
                      )}
                    </small>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <dl className="simulator-results stellar-results">
        <div>
          <dt>Main-sequence lifetime</dt>
          <dd>{formatStellarLifetime(mainSequenceLifetime)}</dd>
        </div>
        <div>
          <dt>Main-sequence luminosity</dt>
          <dd>{formatSolarLuminosity(luminosity)}</dd>
        </div>
        <div>
          <dt>Final remnant</dt>
          <dd>{finalRemnant}</dd>
        </div>
      </dl>

      <p className="simulator-method-note">
        Toy model: single-star evolution at solar-like composition uses piecewise luminosity scaling,
        an approximate mass-lifetime relation, simplified phase timing, and fixed remnant thresholds.
        Surface rotation is visual only. It omits detailed nuclear burning, metallicity dependence,
        winds and mass loss, binaries, and uncertain remnant formation.
      </p>
    </section>
  );
}

export function Playground() {
  return (
    <>
      <SiteHeader page="playground" />
      <NightSky />
      <main className="container layout playground-layout">
        <section className="playground-intro">
          <h1>Playground</h1>
          <p>
            Play with some interactive astronomy experiments and simulations! 
          </p>
        </section>
        <nav className="side-quest-index playground-index" aria-label="Playground experiments">
          <div className="side-quest-index-row playground-index-row">
            {playgroundNavigation.map((item, index) => (
              <span className="side-quest-index-item" key={item.href}>
                {index > 0 && <span className="side-quest-index-divider">|</span>}
                <a
                  className="text-link side-quest-index-link"
                  href={item.href}
                  onClick={(event) => navigateToPlaygroundExperiment(event, item.href)}
                >
                  {item.label}
                </a>
              </span>
            ))}
          </div>
        </nav>
        <BlackHoleGrowthSimulator />
        <StellarEvolutionExplorer />
        <GravitationalLensingSandbox />
        <OrbitalResonanceToy />
      </main>
      <SiteFooter />
    </>
  );
}
