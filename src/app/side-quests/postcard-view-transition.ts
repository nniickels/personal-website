import { postcards } from "./place-postcards-data";

// Capture before React swaps views; animate matching postcards in viewport space.
// Only the temporary flight layer contains all cards at full size. The resting
// stack keeps its bounded set of images and the library keeps small thumbnails.
export type PostcardViewSnapshot = {
  stack?: DOMRect;
  front?: HTMLElement;
  frontImageSource?: string;
  previews: Map<number, { bounds: DOMRect; image: HTMLImageElement | null }>;
};

export function capturePostcardView(section: HTMLElement): PostcardViewSnapshot {
  const previews: PostcardViewSnapshot["previews"] = new Map();
  section.querySelectorAll<HTMLElement>("[data-postcard-preview]").forEach(preview => {
    previews.set(Number(preview.dataset.postcardPreview), {
      bounds: preview.getBoundingClientRect(),
      image: preview.querySelector("img"),
    });
  });
  return {
    stack: section.querySelector(".postcard-stack")?.getBoundingClientRect(),
    frontImageSource: section.querySelector<HTMLImageElement>(".postcard-slot--0 .postcard-front img")?.currentSrc,
    front: section.querySelector<HTMLElement>(".postcard-slot--0 .postcard-front")?.cloneNode(true) as HTMLElement | undefined,
    previews,
  };
}

export function animatePostcardView(section: HTMLElement, before: PostcardViewSnapshot, unstacking: boolean,
  selectedIndex: number, onFinish: () => void) {
  const after = capturePostcardView(section);
  const stack = before.stack ?? after.stack;
  const template = before.front ?? after.front;
  const previews = unstacking ? after.previews : before.previews;
  if (!stack || !template || !previews.size) { onFinish(); return () => {}; }

  const layer = document.createElement("div");
  layer.className = "postcard-flight-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.inert = true;
  document.body.append(layer);
  section.setAttribute("data-postcard-transition", unstacking ? "unstacking" : "stacking");
  const animations: Animation[] = [];
  const topImage = !unstacking ? section.querySelector<HTMLImageElement>(".postcard-slot--0 .postcard-front img") : null;
  let topFlightImage: HTMLImageElement | null = null;
  const count = previews.size;
  const ordered = [...previews].sort(([a], [b]) =>
    (a - selectedIndex + count) % count - (b - selectedIndex + count) % count);
  for (const [cardIndex, preview] of ordered) {
    const rank = (cardIndex - selectedIndex + count) % count;
    const card = template.cloneNode(true) as HTMLElement;
    card.classList.add("postcard-flight");
    card.dataset.postcardIndex = String(cardIndex);
    Object.assign(card.style, { width: `${stack.width}px`, height: `${stack.height}px`, zIndex: String(count - rank) });
    const image = card.querySelector("img");
    if (rank === 0) topFlightImage = image;
    if (image && preview.image) {
      image.removeAttribute("srcset");
      image.removeAttribute("sizes");
      // A newly mounted lazy thumbnail may not have currentSrc yet. Reuse
      // its smallest candidate rather than downloading the 320px fallback too.
      const thumbnail = preview.image.currentSrc || preview.image.srcset.split(",")[0]?.trim().split(/\s+/)[0] || preview.image.src;
      image.src = unstacking && rank === 0 && before.frontImageSource ? before.frontImageSource : thumbnail;
      image.style.objectPosition = preview.image.style.objectPosition;
      image.loading = "eager";
      // Do not copy the top image’s high priority onto every flight clone.
      image.fetchPriority = "low";
    }
    const heading = card.querySelector("h3");
    const caption = card.querySelector(".postcard-caption p");
    const number = card.querySelector(".postcard-number");
    if (heading) heading.textContent = postcards[cardIndex].title;
    if (caption) caption.textContent = postcards[cardIndex].caption;
    if (number) number.textContent = `POSTCARD No. ${String(cardIndex + 1).padStart(2, "0")}`;
    layer.append(card);
    const tilt = rank === 0 ? 0 : rank % 2 ? 2.5 : -4;
    const pile = `translate(${stack.x + Math.min(rank, 2) * 2}px, ${stack.y + Math.min(rank, 2) * 3}px) rotate(${tilt}deg) scale(1, 1)`;
    const small = `translate(${preview.bounds.x}px, ${preview.bounds.y}px) rotate(0deg) scale(${preview.bounds.width / stack.width}, ${preview.bounds.height / stack.height})`;
    // Reverse both the path and departure order when gathering the library.
    const delay = (unstacking ? rank : count - rank - 1) * 12;
    animations.push(card.animate([
      { transform: unstacking ? pile : small },
      { transform: unstacking ? small : pile },
    ], { duration: 650, delay, easing: "cubic-bezier(.22,.68,.2,1)", fill: "both" }));
  }
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  let finished = false;
  const cleanup = () => {
    if (finished) return false;
    finished = true;
    window.removeEventListener("scroll", onScroll);
    animations.forEach(animation => animation.cancel());
    animations.length = 0;
    layer.replaceChildren();
    layer.remove();
    section.removeAttribute("data-postcard-transition");
    return true;
  };
  const finish = () => { if (cleanup()) onFinish(); };
  const onScroll = () => {
    // Flights use viewport coordinates. Settle the destination as soon as the
    // page moves; ignore queued scroll events whose position hasn't changed.
    if (window.scrollX !== scrollX || window.scrollY !== scrollY) finish();
  };
  // The top card's eager, high-priority responsive image starts loading as
  // soon as the stack mounts. Reuse its decoded pixels in the growing flight
  // card, rather than enlarging the tiny thumbnail until the animation ends.
  if (topImage && topFlightImage) {
    const flightImage = topFlightImage;
    void topImage.decode().then(() => {
      if (!finished && topImage.currentSrc) flightImage.src = topImage.currentSrc;
    }).catch(() => { /* Keep the thumbnail if the full image is unavailable. */ });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  Promise.allSettled(animations.map(animation => animation.finished)).then(finish);
  // Unmounting removes the same resources without updating React state.
  return () => { cleanup(); };
}
