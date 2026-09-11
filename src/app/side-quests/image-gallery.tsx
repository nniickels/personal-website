"use client";

import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { ResponsiveImage } from "../responsive-image";

import { imageAssets } from "./gallery-assets";
const Viewer = lazy(() => import("./image-gallery-viewer"));

export default function ImageGallery({
  photos,
  ariaLabel,
  desktopColumns = 5,
}: {
  photos: readonly { src: string; alt: string }[];
  ariaLabel: string;
  desktopColumns?: number;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [columnCount, setColumnCount] = useState(desktopColumns);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selectedPhoto = selectedIndex === null ? null : photos[selectedIndex];

  useEffect(() => {
    const mobileColumns = window.matchMedia("(max-width: 520px)");
    const updateColumnCount = () => setColumnCount(mobileColumns.matches ? 3 : desktopColumns);

    updateColumnCount();
    mobileColumns.addEventListener("change", updateColumnCount);
    return () => mobileColumns.removeEventListener("change", updateColumnCount);
  }, [desktopColumns]);

  useEffect(() => {
    if (selectedIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedIndex(null);
      } else if (event.key === "ArrowLeft") {
        setSelectedIndex((current) =>
          current === null ? null : (current - 1 + photos.length) % photos.length,
        );
      } else if (event.key === "ArrowRight") {
        setSelectedIndex((current) =>
          current === null ? null : (current + 1) % photos.length,
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [photos.length, selectedIndex]);

  const photoColumns = Array.from(
    { length: columnCount },
    () => [] as Array<{ photo: (typeof photos)[number]; index: number }>,
  );

  photos.forEach((photo, index) => {
    photoColumns[index % columnCount].push({ photo, index });
  });

  return (
    <>
      <div
        className={`photo-gallery-grid photo-gallery-grid--${columnCount}`}
        role="list"
        aria-label={ariaLabel}
      >
        {photoColumns.map((column, columnIndex) => (
          <div className="photo-gallery-column" role="presentation" key={columnIndex}>
            {column.map(({ photo, index }) => (
              <button
                className="photo-gallery-thumbnail"
                type="button"
                role="listitem"
                aria-haspopup="dialog"
                aria-label={`Enlarge photo ${index + 1}`}
                onClick={() => setSelectedIndex(index)}
                key={photo.src}
              >
                <ResponsiveImage asset={imageAssets[photo.src]} sizes={`(max-width: 520px) calc((100vw - 3.25rem) / 3), (max-width: 792px) calc((100vw - 6rem) / ${desktopColumns}), ${Math.ceil(660 / desktopColumns)}px`} alt={photo.alt} loading="lazy" />
              </button>
            ))}
          </div>
        ))}
      </div>

      {selectedPhoto && selectedIndex !== null && (
        <Suspense fallback={<p className="viewer-loading" role="status">Loading viewer…</p>}>
          <Viewer selectedPhoto={selectedPhoto} selectedIndex={selectedIndex} photos={photos} setSelectedIndex={setSelectedIndex} closeButtonRef={closeButtonRef} />
        </Suspense>
      )}
    </>
  );
}
