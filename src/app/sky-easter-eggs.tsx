"use client";

import type { CSSProperties, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";

const CONSTELLATION_EVENT = "nicole:constellation";
const IDLE_DELAY = 10_000;
const MOBILE_QUERY = "(max-width: 700px), (hover: none), (pointer: coarse)";

type Star = {
  top: string;
  left: string;
  duration: string;
  delay: string;
  colour: string;
  angle?: number;
  travel?: number;
  trail?: number;
  size?: number;
};

const meteors: readonly Star[] = Array.from({ length: 12 }, (_, index) => ({
  top: `${-4 + (index * 13) % 39}%`,
  left: `${55 + (index * 17) % 48}%`,
  duration: `${5.3 + (index * 0.73) % 3}s`,
  delay: `${index * 0.43}s`,
  colour: index % 3 ? "#ddecff" : "#ffdfb5",
  angle: 132 + (index * 5) % 7,
  travel: 43 + (index * 7) % 25,
  trail: 260 + (index * 31) % 170,
  size: 4 + (index % 3),
}));

const distantMeteors: readonly Star[] = Array.from({ length: 18 }, (_, index) => ({
  top: `${-8 + (index * 19) % 66}%`,
  left: `${28 + (index * 23) % 70}%`,
  duration: `${5.8 + (index * 0.57) % 4}s`,
  delay: `${0.15 + index * 0.31}s`,
  colour: "#dceaff",
  angle: 132 + (index * 3) % 7,
  travel: 22 + (index * 3) % 19,
  trail: 120 + (index * 13) % 110,
  size: 2 + (index % 3) * 0.5,
}));

function meteorStyle(star: Star): CSSProperties {
  return {
    top: star.top,
    left: star.left,
    "--shoot-color": star.colour,
    "--shoot-duration": star.duration,
    "--shoot-delay": star.delay,
    "--meteor-angle": `${star.angle ?? 135}deg`,
    "--meteor-travel": `${star.travel ?? 50}vmax`,
    "--meteor-trail": `${star.trail ?? 220}px`,
    "--meteor-size": `${star.size ?? 3}px`,
  } as CSSProperties;
}

// Delay normal navigation briefly to recognize repeated clicks on every route.
// Mobile and modified clicks retain native navigation behavior.
export function useCalligraphyEasterEgg() {
  const clicks = useRef(0);
  const lastClick = useRef(0);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(navigationTimer.current), []);

  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia(MOBILE_QUERY).matches) {
      clearTimeout(navigationTimer.current);
      clicks.current = 0;
      return;
    }
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    clearTimeout(navigationTimer.current);
    const now = Date.now();
    clicks.current = now - lastClick.current < 1_500 ? clicks.current + 1 : 1;
    lastClick.current = now;

    if (clicks.current >= 5) {
      clicks.current = 0;
      window.dispatchEvent(new Event(CONSTELLATION_EVENT));
      return;
    }

    navigationTimer.current = setTimeout(() => {
      if (window.location.pathname === "/") window.scrollTo({ top: 0 });
      else window.location.assign("/");
    }, 300);
  };
}

function WishStar({ star, meteor = false }: { star: Star; meteor?: boolean }) {
  const [paused, setPaused] = useState(false);
  const [wish, setWish] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => {
    clearTimeout(pauseTimer.current);
    clearTimeout(messageTimer.current);
  }, []);

  return (
    <>
      <button
        type="button"
        className={`shooting-star-target${meteor ? " shooting-star-target--meteor" : ""}`}
        aria-label="Catch a shooting star and make a wish"
        onClick={() => {
          clearTimeout(pauseTimer.current);
          clearTimeout(messageTimer.current);
          setPaused(true);
          setWish(true);
          pauseTimer.current = setTimeout(() => setPaused(false), 1_600);
          messageTimer.current = setTimeout(() => setWish(false), 3_200);
        }}
        style={{
          ...meteorStyle(star),
          top: star.top,
          left: star.left,
          "--shoot-color": star.colour,
          "--shoot-duration": star.duration,
          "--shoot-delay": star.delay,
          animationPlayState: paused ? "paused" : undefined,
          "--meteor-play-state": paused ? "paused" : "running",
        } as CSSProperties}
      >
        <span className="shooting-star" aria-hidden="true" />
      </button>
      {wish && <p className="sky-wish" role="status">Make a wish ✧</p>}
    </>
  );
}

export function SkyEasterEggs({ stars, playground = false }: {
  stars: readonly Star[];
  playground?: boolean;
}) {
  const [idle, setIdle] = useState(false);
  const [constellation, setConstellation] = useState(false);
  const [constellationRun, setConstellationRun] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idleStarted = false;
    let lastActivity = Date.now();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia(MOBILE_QUERY);
    const root = document.documentElement;
    const allowed = () => !document.hidden && !motion.matches && !mobile.matches
      && root.dataset.theme !== "light";

    const checkIdle = () => {
      timer = undefined;
      if (!allowed()) return;
      const remaining = IDLE_DELAY - (Date.now() - lastActivity);
      if (remaining > 0) timer = setTimeout(checkIdle, remaining);
      else {
        idleStarted = true;
        setIdle(true);
      }
    };

    const activity = (event?: Event) => {
      // Keep a caught meteor mounted through pointerdown, click, and its wish.
      if (event?.target instanceof Element
        && event.target.closest(".shooting-star-target")) return;
      lastActivity = Date.now();
      if (idleStarted) {
        idleStarted = false;
        setIdle(false);
      }
      if (timer === undefined && allowed()) timer = setTimeout(checkIdle, IDLE_DELAY);
    };
    const reset = () => {
      clearTimeout(timer);
      timer = undefined;
      idleStarted = false;
      setIdle(false);
      activity();
    };
    const events = ["pointermove", "pointerdown", "keydown", "scroll", "wheel", "touchmove"];
    events.forEach(name => window.addEventListener(name, activity, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", reset);
    motion.addEventListener("change", reset);
    mobile.addEventListener("change", reset);
    const observer = new MutationObserver(reset);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme", "class"] });
    activity();
    return () => {
      clearTimeout(timer);
      events.forEach(name => window.removeEventListener(name, activity, true));
      document.removeEventListener("visibilitychange", reset);
      motion.removeEventListener("change", reset);
      mobile.removeEventListener("change", reset);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const mobile = window.matchMedia(MOBILE_QUERY);
    const dismissOnMobile = () => {
      if (!mobile.matches) return;
      clearTimeout(timer);
      setConstellation(false);
    };
    const reveal = () => {
      if (mobile.matches) return;
      clearTimeout(timer);
      setConstellationRun(run => run + 1);
      setConstellation(true);
      timer = setTimeout(() => setConstellation(false), 4_000);
    };
    window.addEventListener(CONSTELLATION_EVENT, reveal);
    mobile.addEventListener("change", dismissOnMobile);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(CONSTELLATION_EVENT, reveal);
      mobile.removeEventListener("change", dismissOnMobile);
    };
  }, []);

  return (
    <>
    {idle && (
      <div className="sky-distant-meteors" aria-hidden="true">
        {distantMeteors.map((star, index) => (
          <span className="shooting-star-target shooting-star-target--meteor shooting-star-target--distant" style={meteorStyle(star)} key={index}>
            <span className="shooting-star" />
          </span>
        ))}
      </div>
    )}
    <div className={`sky-shower-dimmer${idle ? " is-active" : ""}`} aria-hidden="true" />
    <div className={`sky-easter-eggs${playground ? " sky-easter-eggs--playground" : ""}${idle ? " sky-easter-eggs--shower" : ""}`}>
      <div className="sky-meteors">
        {stars.map((star, index) => <WishStar key={index} star={star} />)}
        {idle && meteors.map((star, index) => <WishStar key={`meteor-${index}`} star={star} meteor />)}
        {idle && <p className="sky-wish sky-shower-message" role="status">Meteor shower!</p>}
      </div>
      {constellation && (
        <figure key={constellationRun} className="sky-constellation" role="status">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <path d="M20 82V18L80 82V18" />
            {[[20, 82], [20, 50], [20, 18], [40, 39], [60, 61], [80, 82], [80, 50], [80, 18]].map(([x, y]) => (
              <polygon
                key={`${x}-${y}`}
                transform={`translate(${x} ${y})`}
                points="0,-3 0.55,-0.55 3,0 0.55,0.55 0,3 -0.55,0.55 -3,0 -0.55,-0.55"
              />
            ))}
          </svg>
          <figcaption>A little constellation for Nicole.</figcaption>
        </figure>
      )}
    </div>
    </>
  );
}
