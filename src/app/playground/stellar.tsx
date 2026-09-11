"use client";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState, memo } from "react";
import { createFrameGate, useExperimentVisibility, SimulatorSlider, ExperimentGuide, clamp, lensingFieldStars } from "./shared";
const STELLAR_TIMELINE_START_FRACTION = 5 / 6;
const STELLAR_PHASE_POSITIONS = [0, 100 / 3, 200 / 3, 100] as const;
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
      { key: "red-giant", label: "Red giant", start: 0.72, end: 0.82, timelinePosition: STELLAR_PHASE_POSITIONS[1], size: 148, color: "#ff9a5c" },
      { key: "planetary-nebula", label: "Planetary nebula", start: 0.82, end: 0.91, timelinePosition: STELLAR_PHASE_POSITIONS[2], size: 30, color: "#e9f4ff" },
      { key: "white-dwarf", label: "White dwarf", start: 0.91, end: 1, timelinePosition: STELLAR_PHASE_POSITIONS[3], size: 22, color: "#e7f2ff" },
    ];
  }

  if (mass < 25) {
    return [
      { key: "main-sequence", label: "Main sequence", start: 0, end: 0.76, timelinePosition: STELLAR_PHASE_POSITIONS[0], size: mainSequenceSize, color: mainSequenceColor },
      { key: "red-supergiant", label: "Red supergiant", start: 0.76, end: 0.83, timelinePosition: STELLAR_PHASE_POSITIONS[1], size: 204, color: "#ef553f" },
      { key: "supernova", label: "Core-collapse supernova", start: 0.83, end: 0.91, timelinePosition: STELLAR_PHASE_POSITIONS[2], size: 40, color: "#fff1be" },
      { key: "neutron-star", label: "Neutron star", start: 0.91, end: 1, timelinePosition: STELLAR_PHASE_POSITIONS[3], size: 15, color: "#b9e4ff" },
    ];
  }

  return [
    { key: "main-sequence", label: "Main sequence", start: 0, end: 0.76, timelinePosition: STELLAR_PHASE_POSITIONS[0], size: mainSequenceSize, color: mainSequenceColor },
    { key: "red-supergiant", label: "Red supergiant", start: 0.76, end: 0.83, timelinePosition: STELLAR_PHASE_POSITIONS[1], size: 220, color: "#ef553f" },
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

export default function StellarEvolutionExplorer({
  touchLineScrubbing = false,
  limitFrameRate = false,
}: {
  touchLineScrubbing?: boolean;
  limitFrameRate?: boolean;
} = {}) {
  const [sectionRef, isExperimentVisible] = useExperimentVisibility<HTMLElement>();
  const [mass, setMass] = useState(1);
  const [progress, setProgress] = useState(() => mainSequenceTimelineStart(1));
  const [playing, setPlaying] = useState(false);
  const animationFrame = useRef<number | null>(null);
  const timelineDragPointer = useRef<number | null>(null);
  const stages = useMemo(() => stellarEvolutionTrack(mass), [mass]);
  const currentStage = stages.find((stage, index) =>
    progress >= stage.start && (progress < stage.end || index === stages.length - 1),
  ) ?? stages[0];
  const mainSequenceLifetime = clamp(10 * mass ** -2.5, 0.003, 180);
  const luminosity = mainSequenceLuminosity(mass);
  const finalRemnant = mass < 8 ? "White dwarf" : mass < 25 ? "Neutron star" : "Black hole";
  const activePreset = stellarPresets.find((preset) => preset.mass === mass)?.name;
  const timelineSliderPosition = progressToStellarTimelinePosition(stages, progress);
  const stellarPulseDuration = clamp(4.8 - mass * 0.08, 1.8, 4.8);
  const stellarStyle = {
    "--stellar-size": `${currentStage.size}px`,
    "--stellar-glow-size": `${currentStage.size * 1.75}px`,
    "--stellar-color": currentStage.color,
    "--stellar-pulse-duration": `${stellarPulseDuration.toFixed(2)}s`,
  } as CSSProperties;

  useEffect(() => {
    if (!playing || !isExperimentVisible) return;
    const initialProgress = progress >= 1 ? mainSequenceTimelineStart(mass) : progress;
    const startedAt = performance.now();
    const duration = Math.max(2_400, 18_000 * (1 - initialProgress));
    const frameGate = createFrameGate(limitFrameRate);
    let lastRenderedAt: number | null = null;

    const animate = (now: number) => {
      if (frameGate(now, lastRenderedAt)) {
        animationFrame.current = requestAnimationFrame(animate);
        return;
      }
      lastRenderedAt = now;
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
  }, [playing, isExperimentVisible, limitFrameRate]);

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

  const updateTimelineFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const timelinePosition = clamp(
      ((event.clientX - bounds.left) / bounds.width) * 100,
      0,
      100,
    );
    setPlaying(false);
    setProgress(stellarTimelinePositionToProgress(stages, timelinePosition));
  };

  const beginTimelineDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!touchLineScrubbing) return;
    if (event.target instanceof Element && event.target.closest(".stellar-timeline button")) return;
    event.preventDefault();
    timelineDragPointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateTimelineFromPointer(event);
  };

  const scrubTimeline = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (timelineDragPointer.current !== event.pointerId) return;
    event.preventDefault();
    updateTimelineFromPointer(event);
  };

  const endTimelineDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (timelineDragPointer.current !== event.pointerId) return;
    timelineDragPointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="stellar-evolution"
      className={`stellar-evolution-explorer${isExperimentVisible ? "" : " experiment-is-paused"}`}
      aria-labelledby="stellar-evolution-title"
    >
      <header className="simulator-heading">
        <p className="simulator-kicker">Experiment 02</p>
        <h2 id="stellar-evolution-title">Stellar Evolution Explorer</h2>
        <p>
          Change a star&apos;s initial mass and follow its simplified path from the main sequence to its final remnant.
        </p>
      </header>

      <ExperimentGuide>
        <p>
          A star&apos;s initial mass largely determines how brightly it shines, how quickly it uses its
          nuclear fuel, and which remnant it leaves behind. Press play, drag the timeline, or select
          a phase to follow that path. Because the main sequence occupies most of a star&apos;s life, the
          display begins five-sixths of the way through it; later phase markers are spaced evenly so
          brief events remain easy to inspect.
        </p>
        <p>
          Sun-like stars swell into red giants, shed their outer layers as planetary nebulae, and
          leave white dwarfs. High-mass stars expand into red supergiants: they are substantially
          more massive, larger, and more luminous than ordinary red giants, despite having similarly
          cool, reddish surfaces. They then undergo core-collapse supernovae and leave neutron stars
          or black holes. Whether the remnant is a neutron star or black hole depends more directly
          on the mass of the collapsed core that remains after the supernova; the initial-mass
          thresholds used here are only a simplified proxy. The 1 M☉, 12 M☉, and 30 M☉ presets
          illustrate these three outcomes. Displayed sizes are not to scale; the stronger size,
          colour, and glow differences identify the two giant phases. Surface motion and pulsation
          are visual cues, and the neutron-star stage is shown as a pulsar whose sweeping beams
          happen to cross our line of sight.
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
            <FieldStars />
            <span className="stellar-nebula" aria-hidden="true" />
            <span className="stellar-supernova-shell" aria-hidden="true" />
            <span className="stellar-burst" aria-hidden="true" />
            <span className="stellar-pulsar-beams" aria-hidden="true">
              <span className="stellar-radio-wave stellar-radio-wave--forward" />
              <span className="stellar-radio-wave stellar-radio-wave--backward" />
            </span>
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
            Phases are evenly spaced for easy selection; playback slows through longer intervals. <strong>Drag to explore or select any phase.</strong>
          </p>
          <div
            className="stellar-timeline-control"
            onPointerDown={beginTimelineDrag}
            onPointerMove={scrubTimeline}
            onPointerUp={endTimelineDrag}
            onPointerCancel={endTimelineDrag}
          >
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
        Toy model: For a single star with Sun-like composition, a few mass ranges set approximate
        luminosity, main-sequence lifetime, phase duration, and remnant type. Fixed thresholds send
        lower-mass stars to white dwarfs and higher-mass stars to neutron stars or black holes. Detailed
        nuclear burning, composition changes, winds, mass loss, rotation, and binary interactions can
        shift those boundaries in real stars.
      </p>
    </section>
  );
}

const FieldStars = memo(function FieldStars() {
  return <>
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
  </>;
});
