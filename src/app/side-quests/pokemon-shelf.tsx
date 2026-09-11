"use client";

import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { ResponsiveImage } from "../responsive-image";

import { pokemonCards } from "./data";
import imageAssets from "../../generated/media/pokemon-cards.json";
const Viewer = lazy(() => import("./pokemon-shelf-viewer"));

export default function PokemonCardWheel() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const wheelItemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const selectedCard = selectedIndex === null ? null : pokemonCards[selectedIndex];

  useEffect(() => {
    if (selectedIndex === null) return;

    const wheel = wheelRef.current;
    const item = wheelItemRefs.current[selectedIndex];
    if (!wheel || !item) return;

    const wheelRect = wheel.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const nextLeft =
      wheel.scrollLeft + itemRect.left - wheelRect.left - (wheel.clientWidth - itemRect.width) / 2;

    wheel.scrollTo({
      left: Math.max(0, nextLeft),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [selectedIndex]);

  useEffect(() => {
    if (selectedIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedIndex(null);
      } else if (event.key === "ArrowLeft") {
        setSelectedIndex((current) =>
          current === null ? null : (current - 1 + pokemonCards.length) % pokemonCards.length,
        );
      } else if (event.key === "ArrowRight") {
        setSelectedIndex((current) =>
          current === null ? null : (current + 1) % pokemonCards.length,
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex]);

  return (
    <>
      <div
        className="pokemon-card-wheel"
        role="list"
        aria-label="Pokémon card collection"
        ref={wheelRef}
      >
        {pokemonCards.map((card, index) => (
          <div
            className="pokemon-card-wheel-item"
            role="listitem"
            key={card.href}
            ref={(element) => {
              wheelItemRefs.current[index] = element;
            }}
          >
            <button
              className="pokemon-card-thumbnail"
              type="button"
              aria-haspopup="dialog"
              aria-label={`Enlarge ${card.name}`}
              onClick={() => setSelectedIndex(index)}
            >
              <ResponsiveImage asset={imageAssets[card.image]} sizes="(max-width: 520px) 78px, 104px" alt={card.name} loading="lazy" draggable="false" />
            </button>
          </div>
        ))}
      </div>

      {selectedCard && selectedIndex !== null && (
        <Suspense fallback={<p className="viewer-loading" role="status">Loading viewer…</p>}>
          <Viewer selectedCard={selectedCard} selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex} closeButtonRef={closeButtonRef} />
        </Suspense>
      )}
    </>
  );
}
