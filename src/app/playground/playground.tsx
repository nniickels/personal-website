"use client";

import type { CSSProperties, ChangeEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NightSky, SiteFooter, SiteHeader } from "../portfolio";

const HUBBLE_CONSTANT = 67.4;
const OMEGA_MATTER = 0.315;
const OMEGA_LAMBDA = 0.685;
const EDDINGTON_TIME_GYR = 0.45;
const SOLAR_MASS = "M☉";

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

    const initialProgress = progress >= 1 ? 0 : progress;
    const startedAt = performance.now();
    const duration = Math.max(500, 2_600 * (1 - initialProgress));

    const animate = (now: number) => {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const easedElapsed = 0.5 - Math.cos(Math.PI * elapsed) / 2;
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
    if (progress >= 1) setProgress(0);
    setPlaying(true);
  };

  const chart = useMemo(() => {
    const width = 620;
    const height = 250;
    const left = 58;
    const right = 598;
    const top = 20;
    const bottom = 205;
    const yMin = Math.min(2, Math.floor(seedLogMass));
    const yMax = Math.max(9.25, Math.min(12, Math.ceil(model.finalLogMass + 0.25)));
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

  const growthScale = Math.min(
    1,
    Math.max(0, (model.currentLogMass - seedLogMass) / Math.max(1, 9 - seedLogMass)),
  );
  const visualStyle = {
    "--growth-scale": growthScale,
    "--spin-duration": `${(6.2 - Math.abs(spin) * 4.8).toFixed(2)}s`,
    "--spin-direction": spin < 0 ? "reverse" : "normal",
    "--spin-opacity": Math.abs(spin) < 0.03 ? 0.2 : 0.9,
    "--view-yaw": `${viewYaw.toFixed(1)}deg`,
    "--view-pitch": `${viewPitch.toFixed(1)}deg`,
  } as CSSProperties;
  const exceedsChart = model.finalLogMass > chart.yMax;

  return (
    <section className="black-hole-simulator" aria-labelledby="black-hole-simulator-title">
      <header className="simulator-heading">
        <p className="simulator-kicker">Experiment 01</p>
        <h2 id="black-hole-simulator-title">Black-Hole Growth Simulator</h2>
        <p>
          Test whether a black-hole seed can grow into an early-universe giant under a simple
          Eddington-limited accretion model.
        </p>
      </header>

      <div className="simulator-presets" aria-label="Growth scenarios">
        {presets.map((preset) => (
          <button type="button" key={preset.name} onClick={() => applyPreset(preset)}>
            {preset.name}
          </button>
        ))}
      </div>

      <div className="simulator-workspace">
        <div className="simulator-visual-panel">
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
            <span className="rotation-hint">Drag to rotate in 3D</span>
            <div className="black-hole-orbit-plane">
              <div className="accretion-disk">
                <span className="accretion-flow" />
              </div>
            </div>
            <div className="black-hole-core" />
            <div className="black-hole-glow" />
          </div>

          <div className="simulator-now" aria-live="polite">
            <span>z = {model.currentRedshift.toFixed(1)}</span>
            <strong>{formatMass(model.currentLogMass)}</strong>
          </div>

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
            <circle className="growth-chart-marker" cx={chart.currentX} cy={chart.currentY} r="5" />
            <text className="growth-chart-label" x={chart.left} y={chart.height - 12}>seed</text>
            <text className="growth-chart-label" x={chart.right} y={chart.height - 12} textAnchor="end">observed</text>
            <text className="growth-chart-label" x={chart.left - 10} y={chart.top + 4} textAnchor="end">
              10^{chart.yMax.toFixed(0)}
            </text>
            <text className="growth-chart-label" x={chart.left - 10} y={chart.bottom + 4} textAnchor="end">
              10^{chart.yMin.toFixed(0)}
            </text>
          </svg>
          {exceedsChart && <p className="chart-overflow-note">The curve continues above the displayed 10¹² M☉ scale.</p>}
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
            label="Accretion rate"
            value={eddingtonRatio}
            min={0.1}
            max={2}
            step={0.05}
            displayValue={`${effectiveAccretionRate.toFixed(2)} × reference`}
            onChange={updateControl(setEddingtonRatio)}
          />
          <SimulatorSlider
            label="Spin"
            value={spin}
            min={-0.998}
            max={0.998}
            step={0.01}
            displayValue={`a* = ${spin.toFixed(2)}`}
            onChange={updateControl(setSpin)}
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
                  label="Seed redshift"
                  value={seedRedshift}
                  min={8}
                  max={30}
                  step={1}
                  displayValue={`z = ${seedRedshift.toFixed(0)}`}
                  onChange={updateSeedRedshift}
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
        Toy model: flat ΛCDM with H₀ = 67.4 km s⁻¹ Mpc⁻¹, Ωₘ = 0.315, exponential
        accretion, and a thin-disk spin–efficiency relation. Spin changes the effective mass
        accretion rate at a fixed Eddington ratio. The model omits finite fuel supplies, mergers, feedback,
        and changing accretion states, so extreme outputs are mathematical
        projections—not physical predictions.
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
    <section className="gravitational-lensing-sandbox" aria-labelledby="lensing-sandbox-title">
      <header className="simulator-heading">
        <p className="simulator-kicker">Experiment 02</p>
        <h2 id="lensing-sandbox-title">Gravitational Lensing Sandbox</h2>
        <p>
          Drag the background galaxy around a foreground lens and watch gravity split, stretch,
          and magnify its apparent image.
        </p>
      </header>

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
                <stop offset="0" stopColor="currentColor" stopOpacity="0.95" />
                <stop offset="0.32" stopColor="currentColor" stopOpacity="0.55" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="lensing-lens-gradient">
                <stop offset="0" stopColor="currentColor" stopOpacity="0.5" />
                <stop offset="0.45" stopColor="currentColor" stopOpacity="0.18" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
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
        Toy model: a circular point-mass lens using the thin-lens equation. The displayed scale is
        illustrative; real lensing depends on angular-diameter distances and extended mass profiles,
        and galaxy lenses often produce more complicated arcs and multiple images.
      </p>
    </section>
  );
}

const resonancePresets = {
  "2:1": {
    label: "2:1 chain",
    periods: [1, 2, 4],
    repeatAfter: "4 inner orbits",
  },
  "3:2": {
    label: "3:2 chain",
    periods: [1, 1.5, 2.25],
    repeatAfter: "9 inner orbits",
  },
  "5:3": {
    label: "5:3 chain",
    periods: [1, 5 / 3, 25 / 9],
    repeatAfter: "25 inner orbits",
  },
  free: {
    label: "Near resonance",
    periods: [1, 1.73, 2.91],
    repeatAfter: "no short repeat",
  },
} as const;

type ResonancePreset = keyof typeof resonancePresets;

export function OrbitalResonanceToy() {
  const [bodyCount, setBodyCount] = useState<1 | 2 | 3>(3);
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
    const radii = [68, 116, 164];
    return preset.periods.slice(0, bodyCount).map((period, index) => {
      const angle = (phase / period) * Math.PI * 2 - Math.PI / 2;
      return {
        index,
        period,
        radius: radii[index],
        x: 310 + radii[index] * Math.cos(angle),
        y: 190 + radii[index] * 0.58 * Math.sin(angle),
      };
    });
  }, [bodyCount, phase, preset.periods]);

  const setBodies = (count: 1 | 2 | 3) => {
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
    <section className="orbital-resonance-toy" aria-labelledby="orbital-resonance-title">
      <header className="simulator-heading">
        <p className="simulator-kicker">Experiment 03</p>
        <h2 id="orbital-resonance-title">Orbital Resonance Toy</h2>
        <p>
          Place one to three bodies in linked orbits and watch resonant period ratios make their
          relative positions repeat.
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
                <stop offset="0" stopColor="currentColor" stopOpacity="0.82" />
                <stop offset="0.24" stopColor="currentColor" stopOpacity="0.34" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
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
            {[68, 116, 164].slice(0, bodyCount).map((radius, index) => (
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
              {([1, 2, 3] as const).map((count) => (
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
            min={0.25}
            max={2.5}
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
          <dt>Orbital periods</dt>
          <dd>{ratioLabel}</dd>
        </div>
        <div>
          <dt>Pattern repeats after</dt>
          <dd>{bodyCount === 1 ? "one orbit" : preset.repeatAfter}</dd>
        </div>
        <div>
          <dt>Inner-orbit phase</dt>
          <dd>{(phase % 1).toFixed(2)} turns</dd>
        </div>
      </dl>

      <p className="simulator-method-note">
        Toy model: circular, coplanar Keplerian orbits around a much more massive central star.
        The bodies do not perturb one another, so this demonstrates repeating geometry rather
        than the gravitational locking that creates and maintains real resonances.
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
        <p className="playground-status" role="status">
          This page is a work in progress.
        </p>
        <section className="playground-intro">
          <h1>Playground</h1>
          <p>
            Interactive astronomy experiments, simulations, and small cosmic curiosities will live
            here. This description is a placeholder for now.
          </p>
        </section>
        <BlackHoleGrowthSimulator />
        <GravitationalLensingSandbox />
        <OrbitalResonanceToy />
      </main>
      <SiteFooter />
    </>
  );
}
