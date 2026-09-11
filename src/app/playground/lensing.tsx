"use client";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState, memo } from "react";
import { formatMass, createFrameGate, useExperimentVisibility, SimulatorSlider, ExperimentGuide, clamp, lensingFieldStars, LENS_CENTER } from "./shared";
export default function GravitationalLensingSandbox({
  limitFrameRate = false,
}: {
  limitFrameRate?: boolean;
} = {}) {
  const [sectionRef, isExperimentVisible] = useExperimentVisibility<HTMLElement>();
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
  const pendingPointer = useRef<{ x: number; y: number; rotation: number } | null>(null);
  const pointerFrame = useRef<number | null>(null);
  const rotationRef = useRef(-22);
  useEffect(() => () => {
    if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = null;
    pendingPointer.current = null;
  }, []);

  useEffect(() => {
    if (!isExperimentVisible) return;

    const from = displaySourceRef.current;
    const startedAt = performance.now();
    if (activePointer.current !== null) return;
    const duration = 260;
    const frameGate = createFrameGate(false);
    let lastRenderedAt: number | null = null;

    const animate = (now: number) => {
      if (frameGate(now, lastRenderedAt)) {
        lensAnimationFrame.current = requestAnimationFrame(animate);
        return;
      }
      lastRenderedAt = now;
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
  }, [sourcePosition, isExperimentVisible, limitFrameRate]);

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

  const commitPointer = () => {
    pointerFrame.current = null;
    const next = pendingPointer.current;
    if (!next) return;
    pendingPointer.current = null;
    const position = { x: next.x, y: next.y };
    displaySourceRef.current = position;
    setDisplaySourcePosition(position);
    setSourceRotation(next.rotation);
  };
  const moveSource = (event: ReactPointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    pendingPointer.current = {
      x: clamp(((event.clientX - bounds.left) / bounds.width) * 620, 24, 596),
      y: clamp(((event.clientY - bounds.top) / bounds.height) * 370, 24, 346),
      rotation: rotationRef.current,
    };
    if (pointerFrame.current === null) pointerFrame.current = requestAnimationFrame(commitPointer);
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (lensAnimationFrame.current !== null) cancelAnimationFrame(lensAnimationFrame.current);
    activePointer.current = event.pointerId;
    previousPointerX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveSource(event);
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (activePointer.current !== event.pointerId) return;
    if (previousPointerX.current !== null) {
      const deltaX = event.clientX - previousPointerX.current;
      rotationRef.current += deltaX * 0.7;
    }
    previousPointerX.current = event.clientX;
    moveSource(event);
  };

  const handlePointerEnd = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (activePointer.current !== event.pointerId) return;
    if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
    commitPointer();
    setSourcePosition(displaySourceRef.current);
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
    rotationRef.current = -22;
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
        <ellipse className="lensing-image-highlight" rx={tangentialRadius * 0.82} ry={radialRadius * 0.74} />
      </g>
    );
  };

  const depthLensX = 286;
  const depthSourceX = 430 + distanceRatio * 150;
  const depthSourceY = 46 + clamp(
    (displaySourcePosition.y - LENS_CENTER.y) * 0.12,
    -20,
    20,
  );

  return (
    <section
      ref={sectionRef}
      id="gravitational-lensing"
      className={`gravitational-lensing-sandbox${isExperimentVisible ? "" : " experiment-is-paused"}`}
      aria-labelledby="lensing-sandbox-title"
    >
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
          Gravity from a foreground galaxy or cluster bends light from a more distant source galaxy.
          This sandbox gathers the foreground mass into the central marker, then shows the source&apos;s
          true position and the two places where its light appears to an observer. The dashed circle
          is the Einstein radius, the natural angular scale set by the lens mass and the distances
          between observer, lens, and source. Display units are arbitrary distances within this
          diagram, useful for comparing how the results change. The side view shows the line-of-sight
          order; its distances and light paths are schematic and unscaled.
        </p>
        <p>
          Dragging the source toward the centre moves both images toward the Einstein radius, where
          they brighten and stretch into arcs; perfect alignment joins them into an Einstein ring.
          Increasing lens mass or the distance factor enlarges this bending scale, while source size
          changes the width of the drawn arcs. The point-source equation predicts unlimited
          magnification at exact alignment, so the display caps the readout at “&gt; 40×.”
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
                <stop offset="0" stopColor="#fff4dc" stopOpacity="0.98" />
                <stop offset="0.18" stopColor="#d8c7ff" stopOpacity="0.88" />
                <stop offset="0.52" stopColor="#9675dc" stopOpacity="0.48" />
                <stop offset="1" stopColor="#513d91" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="lensing-lens-gradient">
                <stop offset="0" stopColor="#fff4cd" stopOpacity="0.94" />
                <stop offset="0.2" stopColor="#efc77f" stopOpacity="0.76" />
                <stop offset="0.58" stopColor="#c68245" stopOpacity="0.3" />
                <stop offset="1" stopColor="#7a4328" stopOpacity="0" />
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
            <g className="lensing-angular-grid" aria-hidden="true">
              <line className="lensing-grid-axis" x1="0" y1={LENS_CENTER.y} x2="620" y2={LENS_CENTER.y} />
              <line className="lensing-grid-axis" x1={LENS_CENTER.x} y1="0" x2={LENS_CENTER.x} y2="370" />
              <line className="lensing-grid-spoke" x1="0" y1="0" x2="620" y2="370" />
              <line className="lensing-grid-spoke" x1="0" y1="370" x2="620" y2="0" />
              <circle className="lensing-grid-ring" cx={LENS_CENTER.x} cy={LENS_CENTER.y} r="55" />
              <circle className="lensing-grid-ring" cx={LENS_CENTER.x} cy={LENS_CENTER.y} r="110" />
              <circle className="lensing-grid-ring" cx={LENS_CENTER.x} cy={LENS_CENTER.y} r="165" />
              <text className="lensing-grid-label" x="24" y="28">angular position on sky</text>
            </g>
            <FieldStars />

            <g
              className="lensing-source"
              transform={`translate(${displaySourcePosition.x} ${displaySourcePosition.y}) rotate(${sourceRotation})`}
            >
              <circle className="lensing-source-handle" r={Math.max(18, sourceSize * 1.9)} />
              <ellipse className="lensing-source-disk" rx={sourceSize * 1.7} ry={sourceSize * 0.8} />
              <ellipse className="lensing-source-core" rx={sourceSize * 0.55} ry={sourceSize * 0.34} />
              <g className="lensing-source-arms" transform={`scale(${sourceSize / 10})`}>
                <path d="M -2 0 C 3 -5 12 -4 14 1 C 16 6 8 9 1 8" />
                <path d="M 2 0 C -3 5 -12 4 -14 -1 C -16 -6 -8 -9 -1 -8" />
              </g>
              <text y={Math.max(29, sourceSize * 2.5)} textAnchor="middle">background source</text>
            </g>

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
              <ellipse className="lensing-lens-halo" rx="48" ry="34" transform="rotate(-18)" />
              <ellipse className="lensing-lens-disk" rx="33" ry="15" transform="rotate(-18)" />
              <ellipse className="lensing-lens-isophote" rx="22" ry="9" transform="rotate(-18)" />
              <ellipse className="lensing-lens-core" rx="10" ry="4.8" transform="rotate(-18)" />
              <circle className="lensing-lens-mass-centre" r="2.2" />
              <text y="57" textAnchor="middle">foreground lens</text>
            </g>
          </svg>

          <svg
            className="lensing-depth-diagram"
            viewBox="0 0 620 92"
            role="img"
            aria-label="Schematic unscaled side view showing the observer, foreground lens, and background source with two bent light paths"
          >
            <defs>
              <linearGradient id="lensing-depth-field" x1="0" x2="1">
                <stop offset="0" stopColor="#151515" />
                <stop offset="0.55" stopColor="#171614" />
                <stop offset="1" stopColor="#17141d" />
              </linearGradient>
              <marker
                id="lensing-light-arrow"
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 8 4 L 0 8 z" />
              </marker>
            </defs>
            <rect className="lensing-depth-field" width="620" height="92" rx="10" />
            <line className="lensing-depth-axis" x1="58" y1="46" x2={depthSourceX} y2="46" />
            <line className="lensing-depth-plane lensing-depth-plane--lens" x1={depthLensX} y1="10" x2={depthLensX} y2="80" />
            <line className="lensing-depth-plane lensing-depth-plane--source" x1={depthSourceX} y1="10" x2={depthSourceX} y2="80" />
            <path
              className="lensing-light-path"
              d={`M ${depthSourceX} ${depthSourceY} Q ${(depthSourceX + depthLensX) / 2} 23 ${depthLensX} 34 Q 170 43 62 46`}
            />
            <path
              className="lensing-light-path"
              d={`M ${depthSourceX} ${depthSourceY} Q ${(depthSourceX + depthLensX) / 2} 69 ${depthLensX} 58 Q 170 49 62 46`}
            />
            <g className="lensing-depth-observer" transform="translate(54 46)">
              <path d="M -14 0 Q 0 -11 14 0 Q 0 11 -14 0 Z" />
              <circle r="3.2" />
              <text x="0" y="30" textAnchor="middle">observer</text>
            </g>
            <g className="lensing-depth-lens" transform={`translate(${depthLensX} 46)`}>
              <ellipse className="lensing-depth-lens-halo" rx="18" ry="12" transform="rotate(-18)" />
              <ellipse className="lensing-depth-lens-disk" rx="12" ry="5.5" transform="rotate(-18)" />
              <ellipse className="lensing-depth-lens-core" rx="4.8" ry="2.5" transform="rotate(-18)" />
              <text x="0" y="34" textAnchor="middle">foreground lens</text>
            </g>
            <g className="lensing-depth-source" transform={`translate(${depthSourceX} ${depthSourceY})`}>
              <g transform={`rotate(${sourceRotation})`}>
                <ellipse rx="18" ry="7" />
                <path d="M -2 0 C 3 -5 12 -4 14 1 C 16 6 8 9 1 8" />
                <path d="M 2 0 C -3 5 -12 4 -14 -1 C -16 -6 -8 -9 -1 -8" />
                <circle r="2.8" />
              </g>
              <text x="0" y={depthSourceY > 52 ? -24 : 30} textAnchor="middle">background source</text>
            </g>
            <text className="lensing-depth-caption" x="155" y="16" textAnchor="middle">schematic light paths</text>
            <text className="lensing-depth-caption" x="485" y="16" textAnchor="middle">distances unscaled</text>
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
          <dd>{lensModel.einsteinRadius.toFixed(1)} display units</dd>
        </div>
        <div>
          <dt>Total magnification</dt>
          <dd>{lensModel.beta < 1 ? "> 40×" : `${lensModel.totalMagnification.toFixed(2)}×`}</dd>
        </div>
        <div>
          <dt>Image separation</dt>
          <dd>{lensModel.imageSeparation.toFixed(1)} display units</dd>
        </div>
      </dl>

      <p className="simulator-method-note">
        Toy model: An axisymmetric point-mass lens uses the scalar thin-lens equation to calculate
        the positions and magnifications of two point-source images. The source size and arc shapes
        are visual aids layered onto those solutions. Extended galaxies and clusters distribute mass
        unevenly, producing shear, multiple arcs, and other structures that require a full lens model.
      </p>
    </section>
  );
}

const FieldStars = memo(function FieldStars() {
  return <>
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
  </>;
});
