"use client";
import type { RefObject } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ResponsiveImage } from "../responsive-image";
import { listeningTracks } from "./data";
import musicAssets from "../../generated/media/music-covers.json";
import type { ImageAsset } from "../responsive-image";
const imageAssets: Record<string, ImageAsset> = musicAssets;
export default function Viewer({selectedTrack, selectedIndex, openTrack, closeTrack, closeButtonRef}: {selectedTrack: (typeof listeningTracks)[number]; selectedIndex: number; openTrack: (index: number) => void; closeTrack: () => void; closeButtonRef: RefObject<HTMLButtonElement | null>}) {
  useEffect(() => { closeButtonRef.current?.focus(); }, [closeButtonRef]);
  return createPortal(<>

        <div className="listening-cover-lightbox" onClick={closeTrack}>
          <div
            className="listening-cover-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="listening-cover-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="listening-cover-close"
              type="button"
              aria-label="Close track cover viewer"
              onClick={closeTrack}
              ref={closeButtonRef}
            >
              ×
            </button>
            <button
              className="listening-cover-nav listening-cover-nav--previous"
              type="button"
              aria-label="Previous track"
              onClick={() =>
                openTrack((selectedIndex - 1 + listeningTracks.length) % listeningTracks.length)
              }
            >
              ←
            </button>
            <a
              className="listening-cover-expanded-link"
              href={selectedTrack.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${selectedTrack.name} by ${selectedTrack.artist} on Spotify`}
            >
              <ResponsiveImage
                asset={imageAssets[selectedTrack.image]} expanded sizes="(max-width: 700px) 70vw, 450px"
                alt={`${selectedTrack.name} by ${selectedTrack.artist} cover`}
                draggable="false"
              />
            </a>
            <button
              className="listening-cover-nav listening-cover-nav--next"
              type="button"
              aria-label="Next track"
              onClick={() => openTrack((selectedIndex + 1) % listeningTracks.length)}
            >
              →
            </button>
            <div className="listening-cover-caption">
              <h3 id="listening-cover-dialog-title">{selectedTrack.name}</h3>
              <p>
                {selectedTrack.artist} · {selectedIndex + 1} / {listeningTracks.length} · click the
                cover to open Spotify
              </p>
            </div>
          </div>
        </div>
  </>, document.body);
}
