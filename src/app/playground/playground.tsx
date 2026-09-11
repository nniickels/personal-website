"use client";

import { Activity, lazy, Suspense, useEffect, useRef, useState } from "react";
import type { ComponentType, MouseEvent } from "react";

const experiments = [
  { id: "black-hole-growth", title: "Black-Hole Growth Simulator", label: "Black-Hole Growth", component: lazy(() => import("./black-hole")) },
  { id: "stellar-evolution", title: "Stellar Evolution Explorer", label: "Stellar Evolution", component: lazy(() => import("./stellar")) },
  { id: "gravitational-lensing", title: "Gravitational Lensing Sandbox", label: "Gravitational Lensing", component: lazy(() => import("./lensing")) },
  { id: "orbital-resonance", title: "Orbital Resonance Toy", label: "Orbital Resonance", component: lazy(() => import("./resonance")) },
] as const;
const mobileQuery = "(max-width: 700px) and (orientation: portrait), (max-height: 520px) and (orientation: landscape) and (pointer: coarse)";

type ExperimentProps = { touchDisclosureOptimizations?: boolean; coordinateTouchGuides?: boolean; touchLineScrubbing?: boolean; limitFrameRate?: boolean };

function ExperimentSlot({ experiment, mobile, touch, open, toggle, forceLoad }: {
  experiment: (typeof experiments)[number]; mobile: boolean | null; touch: boolean;
  open: boolean; toggle: () => void; forceLoad: boolean;
}) {
  const host = useRef<HTMLElement>(null);
  const [activated, setActivated] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const visible = mobile === false || (mobile === true && open);
  useEffect(() => {
    if (mobile === null) return;
    if (mobile) { if (open) setActivated(true); return; }
    const element = host.current;
    if (!element || activated) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setActivated(true); observer.disconnect(); }
    }, { rootMargin: "240px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [mobile, open, activated]);
  useEffect(() => { if (forceLoad && mobile !== null) setActivated(true); }, [forceLoad, mobile]);
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    const update = () => setSaveData(connection?.saveData === true);
    update();
    connection?.addEventListener("change", update);
    return () => connection?.removeEventListener("change", update);
  }, []);
  const Component: ComponentType<ExperimentProps> = experiment.component;
  return <section ref={host} id={`${experiment.id}-slot`} className={`experiment-slot mobile-experiment-item${open ? " is-open" : ""}`}>
    <h2 className="mobile-experiment-heading">
      <button type="button" className="mobile-experiment-toggle" aria-expanded={open} aria-controls={`${experiment.id}-panel`} onClick={toggle}>
        <span>{experiment.title}</span><span className="mobile-experiment-caret" aria-hidden="true" />
      </button>
    </h2>
    <div id={`${experiment.id}-panel`} className="experiment-panel mobile-experiment-panel">
      {activated ? <Activity mode={visible ? "visible" : "hidden"}>
        <Suspense fallback={<div className="experiment-placeholder" role="status">Loading {experiment.title}…</div>}>
          <Component touchDisclosureOptimizations={touch} coordinateTouchGuides={touch} touchLineScrubbing={touch} limitFrameRate={saveData} />
        </Suspense>
      </Activity> : <div className="experiment-placeholder" aria-hidden="true"><h2>{experiment.title}</h2></div>}
    </div>
  </section>;
}

export function Playground() {
  // A neutral shell is identical on server and first client render. No desktop
  // experiment is initialized only to be discarded on a phone after hydration.
  const [mobile, setMobile] = useState<boolean | null>(null);
  const [touch, setTouch] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [navigationRun, setNavigationRun] = useState(0);
  const scrollBehavior = useRef<ScrollBehavior>("instant");
  useEffect(() => {
    const layout = matchMedia(mobileQuery);
    const input = matchMedia("(hover: none), (pointer: coarse)");
    const update = () => { setMobile(layout.matches); setTouch(input.matches); };
    const followHash = () => {
      const id = location.hash.slice(1);
      if (experiments.some((experiment) => experiment.id === id)) {
        scrollBehavior.current = "instant";
        setOpen(id); setDestination(id); setNavigationRun((run) => run + 1);
      }
    };
    update(); followHash();
    layout.addEventListener("change", update); input.addEventListener("change", update);
    window.addEventListener("hashchange", followHash);
    return () => { layout.removeEventListener("change", update); input.removeEventListener("change", update); window.removeEventListener("hashchange", followHash); };
  }, []);
  useEffect(() => {
    if (!destination || mobile === null) return;
    const frame = requestAnimationFrame(() => document.getElementById(`${destination}-slot`)?.scrollIntoView({ block: "start", behavior: scrollBehavior.current }));
    return () => cancelAnimationFrame(frame);
  }, [destination, mobile, navigationRun]);
  const navigate = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    scrollBehavior.current = matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
    setOpen(id); setDestination(id); setNavigationRun((run) => run + 1);
    history.replaceState(null, "", `#${id}`);
  };
  return <main className="container layout playground-layout">
    <section className="playground-intro">
      <h1>Playground</h1>
      <p>Play with some interactive astronomy experiments and simulations! These are simplified,
        illustrative toy models, and some visual cues are exaggerated or added for clarity rather
        than being physically precise or necessary to the simulation.</p>
    </section>
    <nav className="side-quest-index playground-index" aria-label="Playground experiments">
      <div className="side-quest-index-row playground-index-row">
        {experiments.map((experiment, index) => <span className="side-quest-index-item" key={experiment.id}>
          {index > 0 && <span className="side-quest-index-divider">|</span>}
          <a className="text-link side-quest-index-link" href={`#${experiment.id}`} onClick={(event) => navigate(event, experiment.id)}>{experiment.label}</a>
        </span>)}
      </div>
    </nav>
    <div className="playground-experiments mobile-playground-accordion">
      {experiments.map((experiment) => <ExperimentSlot key={experiment.id} experiment={experiment} mobile={mobile} touch={touch}
        open={open === experiment.id} forceLoad={destination === experiment.id}
        toggle={() => {
          const next = open === experiment.id ? null : experiment.id;
          setOpen(next);
          if (next) {
            scrollBehavior.current = "instant";
            setDestination(next); setNavigationRun((run) => run + 1);
            history.replaceState(null, "", `#${next}`);
          }
        }} />)}
    </div>
  </main>;
}
