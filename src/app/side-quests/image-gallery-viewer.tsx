"use client";
import type { Dispatch, SetStateAction, RefObject } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ResponsiveImage } from "../responsive-image";
import { imageAssets } from "./gallery-assets";
export default function Viewer({selectedPhoto, selectedIndex, photos, setSelectedIndex, closeButtonRef}: {selectedPhoto: { src: string; alt: string }; selectedIndex: number; photos: readonly { src: string; alt: string }[]; setSelectedIndex: Dispatch<SetStateAction<number | null>>; closeButtonRef: RefObject<HTMLButtonElement | null>}) {
  useEffect(() => { closeButtonRef.current?.focus(); }, [closeButtonRef]);
  return createPortal(<>

        <div className="photo-gallery-lightbox" onClick={() => setSelectedIndex(null)}>
          <div
            className="photo-gallery-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`Photo ${selectedIndex + 1} of ${photos.length}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="photo-gallery-close"
              type="button"
              aria-label="Close photo viewer"
              onClick={() => setSelectedIndex(null)}
              ref={closeButtonRef}
            >
              ×
            </button>
            <button
              className="photo-gallery-nav photo-gallery-nav--previous"
              type="button"
              aria-label="Previous photo"
              onClick={() =>
                setSelectedIndex(
                  (selectedIndex - 1 + photos.length) % photos.length,
                )
              }
            >
              ←
            </button>
            <button
              className="photo-gallery-expanded"
              type="button"
              aria-label="Close expanded photo"
              onClick={() => setSelectedIndex(null)}
            >
              <ResponsiveImage asset={imageAssets[selectedPhoto.src]} expanded sizes="(max-width: 700px) 75vw, 700px" alt={selectedPhoto.alt} />
            </button>
            <button
              className="photo-gallery-nav photo-gallery-nav--next"
              type="button"
              aria-label="Next photo"
              onClick={() => setSelectedIndex((selectedIndex + 1) % photos.length)}
            >
              →
            </button>
            <div className="photo-gallery-caption">
              <p>
                {selectedIndex + 1} / {photos.length}
              </p>
            </div>
          </div>
        </div>
  </>, document.body);
}
