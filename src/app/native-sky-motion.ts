const skyAnimations = new Set([
  "night-star-twinkle", "wish-star-flight", "idle-meteor-flight", "meteor-burn", "meteor-train",
]);
const nativeAttribute = "data-native-sky-motion";

type SkyMotion = {
  element: HTMLElement;
  pseudo: string | null;
  animation: Animation;
  visibility?: { start: number; end: number; original: string };
  timer?: ReturnType<typeof setTimeout>;
};

// Keep CSS as the source of artwork, keyframes, timing and responsive behavior.
// Native effects avoid React's CSS iteration events; visibility needs only its
// flight boundaries, otherwise it pulls every twinkle onto the main thread.
export function animateSky(root: HTMLElement) {
  if (typeof Animation === "undefined" || typeof CSSAnimation === "undefined"
    || typeof KeyframeEffect === "undefined" || !("pseudoElement" in KeyframeEffect.prototype)) {
    return () => {};
  }

  const motions = new Map<HTMLElement, Map<string, SkyMotion>>();
  const pauseStyles = new WeakMap<HTMLElement, string>();
  let disposed = false;
  let refreshQueued = false;
  let refreshScope: "all" | "theme" | "resize" | "children" = "all";

  const updateVisibility = (motion: SkyMotion) => {
    clearTimeout(motion.timer);
    const visibility = motion.visibility;
    if (!visibility || !motion.element.isConnected) return;
    const { duration, delay = 0 } = motion.animation.effect!.getTiming();
    const length = Number(duration);
    const elapsed = Number(motion.animation.currentTime ?? 0) - delay;
    const phase = ((elapsed % length) + length) % length;
    const start = visibility.start * length;
    const end = visibility.end * length;
    const visible = elapsed >= 0 && phase > start && phase < end;
    const value = visible ? "visible" : "hidden";
    if (motion.element.style.visibility !== value) motion.element.style.visibility = value;
    if (document.hidden || motion.animation.playState === "paused") return;
    const wait = elapsed < 0 ? -elapsed
      : phase <= start ? start - phase
      : phase < end ? end - phase : length - phase;
    // The document clock can still equal the boundary when a timer fires.
    motion.timer = setTimeout(() => updateVisibility(motion), Math.max(1, wait));
  };

  const cancel = (motion: SkyMotion) => {
    clearTimeout(motion.timer);
    motion.animation.cancel();
    if (motion.visibility) motion.element.style.visibility = motion.visibility.original;
  };

  const setPaused = (animation: Animation, paused: boolean) => {
    if (paused === (animation.playState === "paused")) return;
    const time = animation.currentTime;
    if (paused) {
      animation.pause();
      // WebKit can settle pending pause/play against an old compositor clock.
      // Hold the current phase explicitly, then anchor resume to this timeline.
      if (time !== null) animation.currentTime = time;
    } else {
      animation.play();
      const now = document.timeline.currentTime;
      if (time !== null && now !== null) animation.startTime = Number(now) - Number(time);
    }
  };

  const syncPauses = () => {
    if (disposed) return;
    // Read the CSS states together before changing any native effects.
    const states = [...motions.values()].flatMap((group) => [...group.values()].map((motion) => ({
      motion,
      paused: getComputedStyle(motion.element, motion.pseudo).animationPlayState === "paused",
    })));
    for (const { motion, paused } of states) {
      setPaused(motion.animation, paused);
      updateVisibility(motion);
    }
  };

  const refresh = () => {
    refreshQueued = false;
    if (disposed) return;
    const retained = new Set<SkyMotion>();
    // Twinkles use no viewport units. Media-query changes still recapture them;
    // phone theme changes also alter their scale and displayed subset.
    const themePausesOnly = refreshScope === "theme" && !media[0].matches;
    const retainStars = refreshScope === "resize" || themePausesOnly;
    for (const [element, group] of motions) {
      if (refreshScope !== "children" && !(retainStars && element.matches(".night-star"))) element.removeAttribute(nativeAttribute);
      else if (root.contains(element)) group.forEach((motion) => retained.add(motion));
    }
    refreshScope = "children";
    const sources = root.getAnimations({ subtree: true })
      .filter((animation): animation is CSSAnimation =>
        animation instanceof CSSAnimation && skyAnimations.has(animation.animationName))
      .map((animation) => {
        const effect = animation.effect as KeyframeEffect;
        const timing = effect.getTiming();
        const starPeak = animation.animationName === "night-star-twinkle"
          ? getComputedStyle(effect.target!).getPropertyValue("--star-peak").trim() : null;
        return {
          name: animation.animationName,
          element: effect.target as HTMLElement,
          pseudo: effect.pseudoElement,
          frames: effect.getKeyframes().map((frame) => {
            const motionFrame: Keyframe = { ...frame };
            // WebKit reports the underlying opacity for the CSS variable.
            // ponytail: twinkle has one interior brightness peak; revisit if more are added.
            if (starPeak && frame.computedOffset > 0 && frame.computedOffset < 1) {
              motionFrame.opacity = starPeak;
            }
            delete motionFrame.visibility;
            delete motionFrame.computedOffset;
            return motionFrame;
          }),
          timing: {
            ...timing,
            duration: typeof timing.duration === "object"
              ? timing.duration.to("ms").value : timing.duration,
          },
          startTime: animation.startTime,
          currentTime: animation.currentTime,
          paused: animation.playState === "paused",
        };
      });
    if (themePausesOnly) syncPauses();
    // WebKit can discover newly mounted distant pseudo-elements only on a
    // later style update. Suppress only the effects we actually captured.
    for (const source of sources) {
      const tokens = source.element.getAttribute(nativeAttribute);
      source.element.setAttribute(nativeAttribute,
        [tokens, source.pseudo ?? "element"].filter(Boolean).join(" "));
    }
    for (const source of sources) {
      let group = motions.get(source.element);
      if (!group) motions.set(source.element, group = new Map());
      const key = `${source.name}:${source.pseudo ?? ""}`;
      let motion = group.get(key);
      if (motion) {
        const effect = motion.animation.effect as KeyframeEffect;
        effect.setKeyframes(source.frames);
        effect.updateTiming(source.timing);
      } else {
        const effect = new KeyframeEffect(source.element, source.frames, {
          ...source.timing, pseudoElement: source.pseudo,
        });
        const animation = new Animation(effect, document.timeline);
        animation.id = source.name;
        animation.play();
        if (source.startTime !== null) animation.startTime = source.startTime;
        else if (source.currentTime !== null) animation.currentTime = source.currentTime;
        motion = { element: source.element, pseudo: source.pseudo, animation };
        if (source.name === "wish-star-flight" || source.name === "idle-meteor-flight") {
          // ponytail: these windows mirror the CSS flight keyframes; update
          // them together if the authored visibility windows change.
          motion.visibility = {
            start: source.name === "wish-star-flight" ? 0.78 : 0,
            end: source.name === "wish-star-flight" ? 1 : 0.22,
            original: source.element.style.visibility,
          };
        }
        group.set(key, motion);
      }
      setPaused(motion.animation, source.paused);
      retained.add(motion);
      updateVisibility(motion);
    }
    for (const [element, group] of motions) {
      for (const [key, motion] of group) if (!retained.has(motion)) {
        cancel(motion);
        group.delete(key);
      }
      if (!group.size) {
        element.removeAttribute(nativeAttribute);
        motions.delete(element);
      }
    }
  };

  const queueChildrenRefresh = () => {
    if (!refreshQueued && !disposed) {
      refreshQueued = true;
      queueMicrotask(refresh);
    }
  };
  const queueRefresh = () => {
    refreshScope = "all";
    queueChildrenRefresh();
  };
  const resize = () => {
    if (refreshScope === "children") refreshScope = "resize";
    queueChildrenRefresh();
  };
  const pauseSignature = (element: HTMLElement) =>
    `${element.style.animationPlayState}:${element.style.getPropertyValue("--meteor-play-state")}`;
  const observer = new MutationObserver((changes) => {
    // A shower or wish changes children, not the existing stars' artwork/timing.
    if (changes.some((change) => change.type === "childList")) queueChildrenRefresh();
    let pauseChanged = false;
    for (const change of changes) {
      const element = change.target;
      if (change.type !== "attributes" || !(element instanceof HTMLElement)
        || !element.matches(".shooting-star-target")) continue;
      const signature = pauseSignature(element);
      if (pauseStyles.get(element) !== signature) {
        pauseStyles.set(element, signature);
        pauseChanged = true;
      }
    }
    if (pauseChanged) syncPauses();
  });
  const themeObserver = new MutationObserver(() => {
    if (refreshScope !== "all") refreshScope = "theme";
    queueChildrenRefresh();
  });
  const media = ["(max-width: 520px)", "(hover: none)", "(pointer: coarse)", "(prefers-reduced-motion: reduce)"]
    .map((query) => matchMedia(query));
  const focusChanged = () => queueMicrotask(syncPauses);
  const focusEvents = ["focusin", "focusout", "keydown", "pointerdown"];

  refresh();
  root.querySelectorAll<HTMLElement>(".shooting-star-target")
    .forEach((element) => pauseStyles.set(element, pauseSignature(element)));
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  media.forEach((query) => query.addEventListener("change", queueRefresh));
  focusEvents.forEach((event) => root.addEventListener(event, focusChanged));
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", syncPauses);

  return () => {
    disposed = true;
    observer.disconnect();
    themeObserver.disconnect();
    media.forEach((query) => query.removeEventListener("change", queueRefresh));
    focusEvents.forEach((event) => root.removeEventListener(event, focusChanged));
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", syncPauses);
    for (const [element, group] of motions) {
      for (const motion of group.values()) cancel(motion);
      element.removeAttribute(nativeAttribute);
    }
  };
}
