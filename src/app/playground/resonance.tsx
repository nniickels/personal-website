"use client";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState, memo } from "react";
import { createFrameGate, useFrameValue, useExperimentVisibility, useMobileVisualRef, SimulatorSlider, ExperimentGuide, lensingFieldStars } from "./shared";
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

export default function OrbitalResonanceToy({
  limitFrameRate = false,
}: {
  limitFrameRate?: boolean;
} = {}) {
  const [sectionRef, isExperimentVisible] = useExperimentVisibility<HTMLElement>();
  const visualRef = useMobileVisualRef<SVGSVGElement>();
  const [bodyCount, setBodyCount] = useState<ResonanceBodyCount>(3);
  const [resonance, setResonance] = useState<ResonancePreset>("2:1");
  const [speed, setSpeed] = useState(1);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(() =>
    typeof window === "undefined" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const resonanceFrame = useRef<number | null>(null);
  const previousTime = useRef<number | null>(null);
  const resonanceDrag = useRef<{
    pointerId: number;
    lastAngle: number;
    phase: number;
    resumeAfterDrag: boolean;
  } | null>(null);
  const orbitFrame = useFrameValue(setPhase);
  const [dragging, setDragging] = useState(false);
  const preset = resonancePresets[resonance];

  useEffect(() => {
    if (!playing || !isExperimentVisible) {
      previousTime.current = null;
      return;
    }

    const frameGate = createFrameGate(limitFrameRate);

    const animate = (now: number) => {
      if (frameGate(now, previousTime.current)) {
        resonanceFrame.current = requestAnimationFrame(animate);
        return;
      }
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
  }, [playing, speed, isExperimentVisible, limitFrameRate]);

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
      phase,
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
    const next = drag.phase + angleDelta / (Math.PI * 2);
    drag.phase = ((next % 100) + 100) % 100;
    orbitFrame.push(drag.phase);
  };

  const endOrbitDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = resonanceDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    orbitFrame.flush();
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

  // Reuse unchanged JSX regions so input/playback updates skip their subtrees.
  const controls = useMemo(() => (<div className="resonance-controls simulator-controls">
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
        </div>), [bodyCount, resonance, speed, playing]);



  return (
    <section
      ref={sectionRef}
      id="orbital-resonance"
      className={`orbital-resonance-toy${isExperimentVisible ? "" : " experiment-is-paused"}`}
      aria-labelledby="orbital-resonance-title"
    >
      {heading}

      {explanation}

      <div className="resonance-workspace">
        <div className="resonance-visual-panel">
          <div className="resonance-status" aria-live="polite">
            <span>{bodyCount} {bodyCount === 1 ? "body" : "bodies"} · drag to rotate</span>
            <strong>{bodyCount === 1 ? "No resonance yet" : preset.label}</strong>
          </div>
          <svg
            ref={visualRef}
            className={`resonance-canvas${dragging ? " is-dragging" : ""}`}
            viewBox="0 0 620 380"
            role="img"
            aria-label={`${bodyCount} orbiting bodies in a ${bodyCount === 1 ? "single" : preset.label} configuration. Drag to rotate the system.`}
            onPointerDown={beginOrbitDrag}
            onPointerMove={rotateOrbits}
            onPointerUp={endOrbitDrag}
            onPointerCancel={endOrbitDrag}
            onLostPointerCapture={endOrbitDrag}
          >
            {drawingDefinitions0}
            <rect className="resonance-field" width="620" height="380" rx="10" />
            <FieldStars />
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

        {controls}
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

      {methodNote}
    </section>
  );
}

const FieldStars = memo(function FieldStars() {
  return <>
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
  </>;
});

const heading = (<header className="simulator-heading">
        <p className="simulator-kicker">Experiment 04</p>
        <h2 id="orbital-resonance-title">Orbital Resonance Toy</h2>
        <p>
          Choose one to five bodies and compare repeating period-ratio chains with a near-resonant
          pattern that keeps shifting over time.
        </p>
      </header>);

const explanation = (<ExperimentGuide>
        <p>
          An orbital period is the time a body takes to complete one orbit, and a period ratio
          compares that time with a neighbour&apos;s. In a 2:1 pair, the inner body completes two orbits
          while the outer body completes one; in a 3:2 pair, they complete three and two. Adding more
          bodies repeats the chosen ratio between neighbours, so a five-body 2:1 chain has relative
          periods of 1:2:4:8:16.
        </p>
        <p>
          Ratios made from small whole numbers return the entire chain to the same relative alignment
          after a predictable number of inner orbits, which appears in the repeat readout. The Near
          resonance preset uses slightly mismatched periods, so its geometry drifts without a short
          repeat. In a physical resonance, gravity also keeps a particular orbital-angle combination
          oscillating within a limited range, a behaviour called libration.
        </p>
      </ExperimentGuide>);

const methodNote = (<p className="simulator-method-note">
        Toy model: Non-interacting markers move at constant angular speeds along fixed, circular,
        coplanar tracks. The selected period ratios alone determine when their relative positions
        repeat, while the displayed orbit sizes are chosen for visual clarity. The calculation leaves
        out Kepler&apos;s third law, gravitational coupling, eccentricity, and the resonant-angle libration
        used to identify a true dynamical resonance.
      </p>);

const drawingDefinitions0 = (<defs>
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
            </defs>);
