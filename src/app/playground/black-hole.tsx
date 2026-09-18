"use client";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFrameGate, useFrameValue, useExperimentVisibility, useMobileVisualRef, SimulatorSlider, ExperimentGuide, clamp } from "./shared";
const HUBBLE_CONSTANT = 67.4;
const OMEGA_MATTER = 0.315;
const OMEGA_LAMBDA = 0.685;
const EDDINGTON_TIME_GYR = 0.45;
const SOLAR_MASS = "M☉";
const VISUAL_LOG_MASS_MIN = 1;
const VISUAL_LOG_MASS_REFERENCE_MAX = 15;
const GROWTH_CHART_LOG_MASS_MIN = 1;
const GROWTH_CHART_DEFAULT_LOG_MASS_MAX = 20;
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

function formatPowerOfTen(exponent: number) {
  const superscriptCharacters: Record<string, string> = {
    "-": "⁻",
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
  };

  const superscriptExponent = Math.round(exponent)
    .toString()
    .split("")
    .map((character) => superscriptCharacters[character] ?? character)
    .join("");
  return `10${superscriptExponent}`;
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

function VariablesGuide({
  open,
  onToggle,
  deferContent = false,
}: {
  open: boolean;
  onToggle: () => void;
  deferContent?: boolean;
}) {
  return (
    <div className={`simulator-advanced variable-guide${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="simulator-advanced-toggle"
        aria-expanded={open}
        aria-controls="black-hole-variables-guide"
        onClick={onToggle}
      >
        <span className="simulator-advanced-caret" aria-hidden="true" />
        Variables guide
      </button>
      <div className="simulator-advanced-reveal">
        {(!deferContent || open) && (
          <div
            id="black-hole-variables-guide"
            className="simulator-advanced-content variable-guide-content"
          >
          <dl>
            <div>
              <dt>Seed mass</dt>
              <dd>
                The black hole&apos;s starting mass. Stellar remnants are often 10–100 M☉, while
                proposed direct-collapse seeds can reach 10⁴–10⁶ M☉.
              </dd>
            </div>
            <div>
              <dt>Accretion rate</dt>
              <dd>
                How quickly the black hole feeds. An Eddington ratio near 0.1 means slow feeding,
                1 means rapid quasar-like feeding, and values above 1 explore extreme growth.
              </dd>
            </div>
            <div>
              <dt>Spin, a*</dt>
              <dd>
                How fast and in which direction the black hole rotates. Positive values turn with
                the disk, while negative values turn against it.
              </dd>
            </div>
            <div>
              <dt>Seed redshift</dt>
              <dd>
                When growth begins. A higher redshift means an earlier time in the universe.
              </dd>
            </div>
            <div>
              <dt>Observation redshift</dt>
              <dd>
                When growth ends in the simulation. A lower value gives the black hole more time to grow.
              </dd>
            </div>
            <div>
              <dt>Duty cycle</dt>
              <dd>
                The share of time spent feeding. A 50% duty cycle means the black hole feeds for
                half of the available time.
              </dd>
            </div>
            <div>
              <dt>Radiative efficiency</dt>
              <dd>
                The share of incoming matter released as light. Higher efficiency leaves less
                matter available to add to the black hole&apos;s mass.
              </dd>
            </div>
            <div>
              <dt>Variable presets</dt>
              <dd>
                <strong>Stellar seed</strong> begins small and early. <strong>Direct collapse</strong>
                begins with a much larger seed. <strong>Rapid growth</strong> combines a large seed,
                fast feeding, and a high duty cycle.
              </dd>
            </div>
          </dl>
          <p>
            These settings are simple examples. Real black holes can move between different growth patterns.
          </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlackHoleGrowthSimulator({
  touchDisclosureOptimizations = false,
  coordinateTouchGuides = false,
  limitFrameRate = false,
}: {
  touchDisclosureOptimizations?: boolean;
  coordinateTouchGuides?: boolean;
  limitFrameRate?: boolean;
} = {}) {
  const [sectionRef, isExperimentVisible] = useExperimentVisibility<HTMLElement>();
  const visualRef = useMobileVisualRef<HTMLDivElement>();
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
  const [variablesGuideOpen, setVariablesGuideOpen] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [viewYaw, setViewYaw] = useState(-9);
  const [viewPitch, setViewPitch] = useState(84);
  const [rotatingView, setRotatingView] = useState(false);
  const animationFrame = useRef<number | null>(null);
  const blackHoleDrag = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    yaw: number;
    pitch: number;
  } | null>(null);

  const rotationFrame = useFrameValue((view: { yaw: number; pitch: number }) => {
    setViewYaw(view.yaw);
    setViewPitch(view.pitch);
  });
  const chartFrame = useFrameValue(setProgress);

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

    return {
      seedAge,
      observedAge,
      growthTime,
      effectiveEfoldingTime,
      finalLogMass,
      growthDex,
    };
  }, [dutyCycle, eddingtonRatio, efficiency, observedRedshift, seedLogMass, seedRedshift]);
  const currentAge = model.seedAge + model.growthTime * progress;
  const currentLogMass = seedLogMass + model.growthDex * progress;
  const currentRedshift = redshiftAtCosmicAge(currentAge);

  useEffect(() => {
    if (!playing || !isExperimentVisible) return;

    const initialProgress = progress >= 1 ? 0.02 : progress;
    const startedAt = performance.now();
    const duration = Math.max(1_500, 8_500 * (1 - initialProgress));
    const frameGate = createFrameGate(limitFrameRate);
    let lastRenderedAt: number | null = null;

    const animate = (now: number) => {
      if (frameGate(now, lastRenderedAt)) {
        animationFrame.current = requestAnimationFrame(animate);
        return;
      }
      lastRenderedAt = now;
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
  }, [playing, isExperimentVisible, limitFrameRate]);

  const updateControl = (setter: (value: number) => void) => (value: number) => {
    setPlaying(false);
    setProgress(1);
    setter(value);
  };

  const controlChanges = useMemo(() => ({
    SeedLogMass: updateControl(setSeedLogMass),
    EddingtonRatio: updateControl(setEddingtonRatio),
    Spin: updateControl(setSpin),
    ObservedRedshift: updateControl(setObservedRedshift),
    DutyCycle: updateControl(setDutyCycle),
  }), []);

  const updateSeedRedshift = useCallback((value: number) => {
    setPlaying(false);
    setProgress(1);
    setSeedRedshift(value);
    setObservedRedshift((current) => Math.min(current, value - 1));
  }, []);

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
    setViewPitch(84);
  };

  const beginBlackHoleRotation = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    blackHoleDrag.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      yaw: viewYaw,
      pitch: viewPitch,
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
    const nextYaw = drag.yaw + deltaX * 0.55;
    drag.yaw = ((nextYaw + 180) % 360 + 360) % 360 - 180;
    drag.pitch = clamp(drag.pitch - deltaY * 0.42, 18, 84);
    rotationFrame.push({ yaw: drag.yaw, pitch: drag.pitch });
  };

  const endBlackHoleRotation = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = blackHoleDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    rotationFrame.flush();
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
    setProgress((current) => current >= 1 ? 0.02 : current);
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
      xAt,
      yAt,
    };
  }, [model.finalLogMass, seedLogMass]);
  const markerX = chart.xAt(progress);
  const markerY = chart.yAt(currentLogMass);

  const updateProgressFromChartPointer = (event: ReactPointerEvent<SVGCircleElement>) => {
    if (!chart) return;
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const bounds = svg.getBoundingClientRect();
    const pointerX = ((event.clientX - bounds.left) / bounds.width) * chart.width;
    chartFrame.push(clamp((pointerX - chart.left) / (chart.right - chart.left), 0, 1));
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
    chartFrame.flush();
    chartMarkerPointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const scrubChartWithKeyboard = (event: ReactKeyboardEvent<SVGCircleElement>) => {
    chartFrame.flush();
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
    (currentLogMass - VISUAL_LOG_MASS_MIN) /
      (VISUAL_LOG_MASS_REFERENCE_MAX - VISUAL_LOG_MASS_MIN),
  );
  const spinDuration = 6.2 - Math.abs(spin) * 4.8;
  const visualStyle = {
    "--mass-scale": visualMassScale,
    "--spin-duration": `${spinDuration.toFixed(2)}s`,
    "--spin-direction": spin < 0 ? "reverse" : "normal",
    "--spin-opacity": Math.abs(spin) < 0.005 ? 0.34 : 0.9,
    "--spin-play-state": Math.abs(spin) < 0.005 ? "paused" : "running",
    "--disk-luminosity": (0.32 + Math.min(1, eddingtonRatio / 1.5) * 0.68).toFixed(2),
    "--disk-inner-edge": `${clamp(22 - spin * 4.5, 17.5, 26.5).toFixed(1)}%`,
    "--view-yaw": `${viewYaw.toFixed(1)}deg`,
    "--view-pitch": `${viewPitch.toFixed(1)}deg`,
  } as CSSProperties;
  const playbackLabel = playing ? "Pause growth" : progress > 0 && progress < 1 ? "Continue growth" : "Play growth";
  const activePresetName = presets.find((preset) =>
    Math.abs(seedLogMass - preset.seedLogMass) < 0.001 &&
    Math.abs(seedRedshift - preset.seedRedshift) < 0.001 &&
    Math.abs(observedRedshift - preset.observedRedshift) < 0.001 &&
    Math.abs(eddingtonRatio - preset.eddingtonRatio) < 0.001 &&
    Math.abs(dutyCycle - preset.dutyCycle) < 0.001 &&
    Math.abs(spin - preset.spin) < 0.001
  )?.name;

  // Reuse unchanged JSX regions so input/playback updates skip their subtrees.
  const guidance = useMemo(() => (<div className="black-hole-guidance">
        <ExperimentGuide
          {...(coordinateTouchGuides
            ? {
                open: explanationOpen,
                onOpenChange: (open: boolean) => {
                  setExplanationOpen(open);
                  if (open) setVariablesGuideOpen(false);
                },
              }
            : {})}
        >
          <>
            <p>
              The dark sphere marks the region around the event horizon, and the tilted ring represents
              a hot accretion disk feeding the black hole. The drawing is stylized, with bright arcs
              added to make depth easy to read as you rotate it. Seed mass sets the starting point;
              the two redshifts set the available cosmic time; and accretion rate, duty cycle, and spin
              determine how quickly incoming matter adds to the black hole.
            </p>
            <p>
              The graph follows cosmic time from left to right and uses a logarithmic mass scale, so
              each vertical step represents a tenfold increase. The moving dot shows the current mass,
              while the dashed 10⁹ M☉ line provides a useful early-quasar benchmark. Larger seeds,
              faster or more sustained feeding, and longer time intervals raise the final mass; rapid
              prograde spin can slow growth because more of the incoming matter&apos;s energy escapes as light.
            </p>
          </>
        </ExperimentGuide>

        <VariablesGuide
          open={variablesGuideOpen}
          onToggle={() => {
            setVariablesGuideOpen((current) => {
              const nextOpen = !current;
              if (nextOpen && coordinateTouchGuides) setExplanationOpen(false);
              return nextOpen;
            });
          }}
          deferContent={touchDisclosureOptimizations}
        />

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
      </div>), [explanationOpen, variablesGuideOpen, coordinateTouchGuides, touchDisclosureOptimizations, activePresetName]);

  const scene = useMemo(() => (<div
            ref={visualRef}
            className={`black-hole-stage${rotatingView ? " is-dragging" : ""}`}
            style={visualStyle}
            role="img"
            aria-label="Growing black hole with a draggable three-dimensional accretion disk"
            onPointerDown={beginBlackHoleRotation}
            onPointerMove={rotateBlackHole}
            onPointerUp={endBlackHoleRotation}
            onPointerCancel={endBlackHoleRotation}
            onLostPointerCapture={endBlackHoleRotation}
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
            <div className="black-hole-photon-ring" aria-hidden="true" />
            <div className="black-hole-orbit-plane black-hole-orbit-plane--foreground" aria-hidden="true">
              <div className="accretion-disk accretion-disk--foreground">
                <span className="accretion-texture" />
                <span className="accretion-flow accretion-flow--outer" />
                <span className="accretion-flow accretion-flow--middle" />
                <span className="accretion-flow accretion-flow--inner" />
              </div>
            </div>
            <div className="black-hole-glow" />
          </div>), [visualMassScale, spin, eddingtonRatio, viewYaw, viewPitch, rotatingView]);

  const controls = useMemo(() => (<div className="simulator-controls">
          <SimulatorSlider
            label="Seed mass"
            value={seedLogMass}
            min={1}
            max={6}
            step={0.1}
            displayValue={formatMass(seedLogMass)}
            onChange={controlChanges.SeedLogMass}
          />
          <SimulatorSlider
            label="Accretion rate"
            value={eddingtonRatio}
            min={0.1}
            max={2}
            step={0.05}
            displayValue={`${effectiveAccretionRate.toFixed(2)} × reference`}
            onChange={controlChanges.EddingtonRatio}
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
              {(!touchDisclosureOptimizations || advancedOpen) && (
                <div id="black-hole-advanced-settings" className="simulator-advanced-content">
                <SimulatorSlider
                  label="Spin"
                  value={spin}
                  min={-0.998}
                  max={0.998}
                  step={0.01}
                  displayValue={`a* = ${spin.toFixed(2)}`}
                  onChange={controlChanges.Spin}
                />
                <SimulatorSlider
                  label="Observation redshift"
                  value={observedRedshift}
                  min={4}
                  max={Math.min(15, seedRedshift - 1)}
                  step={0.5}
                  displayValue={`z = ${observedRedshift.toFixed(1)}`}
                  onChange={controlChanges.ObservedRedshift}
                />
                <SimulatorSlider
                  label="Duty cycle"
                  value={dutyCycle}
                  min={0.1}
                  max={1}
                  step={0.05}
                  displayValue={`${Math.round(dutyCycle * 100)}%`}
                  onChange={controlChanges.DutyCycle}
                />
                <div className="simulator-derived-setting">
                  <span>Radiative efficiency</span>
                  <output>{(efficiency * 100).toFixed(1)}% — derived from spin</output>
                </div>
                </div>
              )}
            </div>
          </div>

          <div className="simulator-actions">
            <button type="button" className="simulator-primary-action" onClick={togglePlayback}>
              {playbackLabel}
            </button>
            <button type="button" onClick={resetSimulation}>Reset</button>
          </div>
        </div>), [seedLogMass, eddingtonRatio, seedRedshift, spin, observedRedshift, dutyCycle, advancedOpen, touchDisclosureOptimizations, playing, playbackLabel]);

  const results = useMemo(() => (<dl className="simulator-results">
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
      </dl>), [model]);

    const chartCurve = useMemo(() => (<><line className="growth-chart-axis" x1={chart.left} y1={chart.bottom} x2={chart.right} y2={chart.bottom} />
            <line className="growth-chart-axis" x1={chart.left} y1={chart.top} x2={chart.left} y2={chart.bottom} />
            <line className="growth-chart-target" x1={chart.left} y1={chart.targetY} x2={chart.right} y2={chart.targetY} />
            <text className="growth-chart-label" x={chart.right - 4} y={chart.targetY - 7} textAnchor="end">
              10⁹ M☉ benchmark
            </text>
            <polyline className="growth-chart-line" points={chart.points} />
            </>), [chart]);

  const chartLabels = useMemo(() => (<><text className="growth-chart-label" x={chart.left} y={chart.bottom + 17}>seed</text>
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
              {formatPowerOfTen(chart.yMax)}
            </text>
            <text className="growth-chart-label" x={chart.left - 10} y={chart.bottom + 4} textAnchor="end">
              {formatPowerOfTen(chart.yMin)}
            </text>
          </>), [chart]);

  return (
    <section
      ref={sectionRef}
      id="black-hole-growth"
      className={`black-hole-simulator${isExperimentVisible ? "" : " experiment-is-paused"}`}
      aria-labelledby="black-hole-simulator-title"
    >
      {heading}

      {guidance}

      <div className="simulator-workspace">
        <div className="simulator-visual-panel">
          <p className="rotation-hint">Drag to rotate in 3D</p>
          {scene}

          <div className="simulator-now" aria-live="polite">
            <span>z = {currentRedshift.toFixed(1)}</span>
            <strong>{formatMass(currentLogMass)}</strong>
          </div>
        </div>

        {controls}

        <figure className="growth-chart-figure">
          <p className="growth-chart-hint">Drag the plot dot to inspect mass growth</p>
          <svg
            className="growth-chart"
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            role="img"
            aria-label="Logarithmic black-hole mass growth over cosmic time"
          >
            {chartCurve}
            <line className="growth-chart-progress" x1={markerX} y1={chart.top} x2={markerX} y2={chart.bottom} />
            <circle
              className="growth-chart-marker-hit"
              cx={markerX}
              cy={markerY}
              r="15"
              role="slider"
              tabIndex={0}
              aria-label="Inspect growth time"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              aria-valuetext={`z = ${currentRedshift.toFixed(1)}, ${formatMass(currentLogMass)}`}
              onPointerDown={beginChartScrub}
              onPointerMove={scrubChart}
              onPointerUp={endChartScrub}
              onPointerCancel={endChartScrub}
              onLostPointerCapture={endChartScrub}
              onKeyDown={scrubChartWithKeyboard}
            />
            <circle className="growth-chart-marker" cx={markerX} cy={markerY} r="5" />
            {chartLabels}
          </svg>
          {chartCaption}
        </figure>
      </div>

      {results}

      {methodNote}
    </section>
  );
}

const heading = (<header className="simulator-heading">
        <p className="simulator-kicker">Experiment 01</p>
        <h2 id="black-hole-simulator-title">Black-Hole Growth Simulator</h2>
        <p>
          Test whether a black-hole seed can grow into an early-universe giant under a simple
          constant-Eddington-ratio accretion model.
        </p>
      </header>);

const chartCaption = (<figcaption className="growth-chart-caption">
            <strong>Projected mass growth</strong>
            <span>
              Time runs from the seed epoch to observation from left to right; mass increases
              logarithmically upward. The solid curve is the model, the dot and vertical line
              mark playback. Drag the dot to inspect any time in the simulation. The dashed line is
              the 10⁹ M☉ comparison benchmark. The vertical
              scale normally extends to 10²⁰ M☉ and expands automatically when a selected setup
              projects a larger result, preventing the curve from clipping.
            </span>
          </figcaption>);

const methodNote = (<p className="simulator-method-note">
        Toy model: A flat ΛCDM expansion history converts the seed and observation redshifts into an
        elapsed growth time. The mass then grows exponentially with fixed accretion rate, duty cycle,
        spin, and spin-based radiative efficiency. Fuel shortages, feedback, mergers, and changing
        accretion states fall outside the calculation, so the result is best read as a controlled
        growth scenario for comparing assumptions.
      </p>);
