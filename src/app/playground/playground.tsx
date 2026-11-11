"use client";

import { Activity, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, MouseEvent } from "react";
import { PageTitle } from "../page-title";
import BlackHoleGrowthSimulator from "./black-hole";
import StellarEvolutionExplorer from "./stellar";
import GravitationalLensingSandbox from "./lensing";
import OrbitalResonanceToy from "./resonance";

const experiments = [
  { id: "black-hole-growth", title: "Black-Hole Growth Simulator", label: "Black-Hole Growth", component: BlackHoleGrowthSimulator },
  { id: "stellar-evolution", title: "Stellar Evolution Explorer", label: "Stellar Evolution", component: StellarEvolutionExplorer },
  { id: "gravitational-lensing", title: "Gravitational Lensing Sandbox", label: "Gravitational Lensing", component: GravitationalLensingSandbox },
  { id: "orbital-resonance", title: "Orbital Resonance Toy", label: "Orbital Resonance", component: OrbitalResonanceToy },
] as const;
const mobileQuery = "(max-width: 700px) and (orientation: portrait), (max-height: 520px) and (orientation: landscape) and (pointer: coarse)";

type ExperimentProps = { touchDisclosureOptimizations?: boolean; coordinateTouchGuides?: boolean; touchLineScrubbing?: boolean; limitFrameRate?: boolean; numberFormat?: Intl.NumberFormat };

function ExperimentSlot({ experiment, mobile, touch, saveData, numberFormat, open, toggle }: {
  experiment: (typeof experiments)[number]; mobile: boolean | null; touch: boolean;
  saveData: boolean; numberFormat: Intl.NumberFormat; open: boolean; toggle: () => void;
}) {
  const Component: ComponentType<ExperimentProps> = experiment.component;
  // Navigation changes the slot, not the simulation's model or drawing.
  const content = useMemo(() => <Component touchDisclosureOptimizations={touch} coordinateTouchGuides={touch} touchLineScrubbing={touch} limitFrameRate={saveData} numberFormat={numberFormat} />,
    [Component, touch, saveData, numberFormat]);
  const visible = mobile !== true || open;
  return <section id={`${experiment.id}-slot`} className={`experiment-slot mobile-experiment-item${open ? " is-open" : ""}`}>
    <h2 className="mobile-experiment-heading">
      <button type="button" className="mobile-experiment-toggle" aria-expanded={open} aria-controls={`${experiment.id}-panel`} onClick={toggle}>
        <span>{experiment.title}</span><span className="mobile-experiment-caret" aria-hidden="true" />
      </button>
    </h2>
    <div id={`${experiment.id}-panel`} className="experiment-panel mobile-experiment-panel">
      <Activity mode={visible ? "visible" : "hidden"}>
        {content}
      </Activity>
    </div>
  </section>;
}

export function Playground() {
  // Render all experiments on the server. Activity pauses collapsed phone
  // panels after hydration, while desktop models use viewport visibility.
  const [mobile, setMobile] = useState<boolean | null>(null);
  const [touch, setTouch] = useState(false);
  const [saveData, setSaveData] = useState(false);
  // Share the server's formatter through hydration, then use the browser default.
  const [numberFormat, setNumberFormat] = useState(() => new Intl.NumberFormat("en-US"));
  const [open, setOpen] = useState<string | null>(null);
  const [scrollRequest, setScrollRequest] = useState<{ id: string; behavior: ScrollBehavior } | null>(null);
  const [current, setCurrent] = useState<string>(experiments[0].id);
  const experimentList = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    const update = () => setSaveData(connection?.saveData === true);
    update();
    connection?.addEventListener("change", update);
    return () => connection?.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const layout = matchMedia(mobileQuery);
    const input = matchMedia("(hover: none), (pointer: coarse)");
    setNumberFormat(new Intl.NumberFormat());
    const update = () => { setMobile(layout.matches); setTouch(input.matches); };
    const followHash = () => {
      const id = location.hash.slice(1);
      if (experiments.some((experiment) => experiment.id === id)) {
        setOpen(id);
        setScrollRequest({ id, behavior: "instant" });
      } else {
        setOpen(null);
        setScrollRequest(null);
      }
    };
    update(); followHash();
    layout.addEventListener("change", update); input.addEventListener("change", update);
    window.addEventListener("hashchange", followHash);
    return () => { layout.removeEventListener("change", update); input.removeEventListener("change", update); window.removeEventListener("hashchange", followHash); };
  }, []);
  useEffect(() => {
    if (mobile !== false || !experimentList.current) return;
    const slots = Array.from(experimentList.current.querySelectorAll<HTMLElement>(".experiment-slot"));
    const visible = new Set<Element>();
    const top = getComputedStyle(slots[0]).scrollMarginTop;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      const firstVisible = slots.find((slot) => visible.has(slot));
      if (firstVisible) setCurrent(firstVisible.id.replace(/-slot$/, ""));
    }, { rootMargin: `-${top} 0px 0px 0px` });
    slots.forEach((slot) => observer.observe(slot));
    return () => observer.disconnect();
  }, [mobile]);
  useEffect(() => {
    if (!scrollRequest || mobile === null) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(`${scrollRequest.id}-slot`)?.scrollIntoView({ block: "start", behavior: scrollRequest.behavior });
      setScrollRequest(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [mobile, scrollRequest]);
  const navigate = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setOpen(id);
    const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
    setScrollRequest({ id, behavior });
    history.replaceState(null, "", `#${id}`);
  };
  return <main className="container layout playground-layout">
    <section className="playground-intro">
      <PageTitle title="playground" />
      <p>Play with some interactive astronomy experiments and simulations! These are simplified,
        illustrative toy models, and some visual cues are exaggerated or added for clarity rather
        than being physically precise or necessary to the simulation.</p>
    </section>
    <div className="playground-workspace">
      <nav className="playground-index" aria-label="Playground experiments">
        <h2>Experiment index</h2>
        <ul>
          {experiments.map((experiment) => <li key={experiment.id}>
            <a href={`#${experiment.id}`} aria-current={current === experiment.id ? "true" : undefined}
              onClick={(event) => navigate(event, experiment.id)}>{experiment.label}</a>
          </li>)}
        </ul>
      </nav>
      <div className="playground-experiments mobile-playground-accordion" ref={experimentList}>
        {experiments.map((experiment) => <ExperimentSlot key={experiment.id} experiment={experiment} mobile={mobile} touch={touch} saveData={saveData} numberFormat={numberFormat}
          open={open === experiment.id}
          toggle={() => {
            const next = open === experiment.id ? null : experiment.id;
            setOpen(next);
            setScrollRequest(next ? { id: next, behavior: "instant" } : null);
            if (next) history.replaceState(null, "", `#${next}`);
          }} />)}
      </div>
    </div>
  </main>;
}
