"use client";
import type { Dispatch, SetStateAction, RefObject } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ResponsiveImage } from "../responsive-image";
import { pokemonCards } from "./data";
import imageAssets from "../../generated/media/pokemon-cards.json";
export default function Viewer({selectedCard, selectedIndex, setSelectedIndex, closeButtonRef}: {selectedCard: (typeof pokemonCards)[number]; selectedIndex: number; setSelectedIndex: Dispatch<SetStateAction<number | null>>; closeButtonRef: RefObject<HTMLButtonElement | null>}) {
  useEffect(() => { closeButtonRef.current?.focus(); }, [closeButtonRef]);
  return createPortal(<>

        <div className="pokemon-card-lightbox" onClick={() => setSelectedIndex(null)}>
          <div
            className="pokemon-card-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pokemon-card-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="pokemon-card-close"
              type="button"
              aria-label="Close card viewer"
              onClick={() => setSelectedIndex(null)}
              ref={closeButtonRef}
            >
              ×
            </button>
            <button
              className="pokemon-card-nav pokemon-card-nav--previous"
              type="button"
              aria-label="Previous card"
              onClick={() =>
                setSelectedIndex(
                  (selectedIndex - 1 + pokemonCards.length) % pokemonCards.length,
                )
              }
            >
              ←
            </button>
            <a
              className="pokemon-card-expanded-link"
              href={selectedCard.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${selectedCard.name} on TCG Collector`}
            >
              <ResponsiveImage asset={imageAssets[selectedCard.image]} expanded sizes="(max-width: 700px) 70vw, 480px" alt={selectedCard.name} draggable="false" />
            </a>
            <button
              className="pokemon-card-nav pokemon-card-nav--next"
              type="button"
              aria-label="Next card"
              onClick={() => setSelectedIndex((selectedIndex + 1) % pokemonCards.length)}
            >
              →
            </button>
            <div className="pokemon-card-caption">
              <h3 id="pokemon-card-dialog-title">{selectedCard.name}</h3>
              <p>
                {selectedIndex + 1} / {pokemonCards.length} · click the card to open TCG Collector
              </p>
            </div>
          </div>
        </div>
  </>, document.body);
}
