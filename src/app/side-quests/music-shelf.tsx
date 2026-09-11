"use client";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { ResponsiveImage } from "../responsive-image";

import { listeningTracks } from "./data";
import musicAssets from "../../generated/media/music-covers.json";
import type { ImageAsset } from "../responsive-image";
const imageAssets: Record<string, ImageAsset> = musicAssets;
const MAX_ANIMATION_FRAME_INTERVAL_MS = 1_000 / 60;

function animationFrameIsTooSoon(now: number, lastRenderedAt: number | null) {
  return (
    lastRenderedAt !== null &&
    now - lastRenderedAt < MAX_ANIMATION_FRAME_INTERVAL_MS - 0.5
  );
}

const Viewer = lazy(() => import("./music-shelf-viewer"));

export default function ListeningCoverWheel() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [volume, setVolume] = useState(0);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewError, setPreviewError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const wheelItemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const keepPlayingRef = useRef(false);
  const longPressTimerRef = useRef<number | null>(null);
  const touchPreviewFrameRef = useRef<number | null>(null);
  const touchPressRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    startWheelScrollLeft: number;
    startPageScrollY: number;
    gesture: "pending" | "horizontal" | "vertical";
    cancelled: boolean;
    previewing: boolean;
    activeIndex: number;
    hasDragged: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const lastTouchAtRef = useRef(0);
  const activeTrack = activeIndex === null ? null : listeningTracks[activeIndex];
  const selectedTrack = selectedIndex === null ? null : listeningTracks[selectedIndex];

  const scrollWheelToIndex = (
    index: number,
    behavior: ScrollBehavior = "smooth",
  ) => {
    const wheel = wheelRef.current;
    const item = wheelItemRefs.current[index];
    if (!wheel || !item) return;

    const wheelRect = wheel.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const nextLeft =
      wheel.scrollLeft + itemRect.left - wheelRect.left - (wheel.clientWidth - itemRect.width) / 2;

    wheel.scrollTo({
      left: Math.max(0, nextLeft),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : behavior,
    });
  };

  useEffect(() => {
    if (selectedIndex === null) return;
    scrollWheelToIndex(selectedIndex);
  }, [selectedIndex]);

  const resetPreview = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setActiveIndex(null);
    setPreviewProgress(0);
    setPreviewError(false);
  };

  const stopPreview = () => {
    if (keepPlayingRef.current) return;
    resetPreview();
  };

  const playPreview = async (index: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const track = listeningTracks[index];
    setActiveIndex(index);
    setPreviewError(false);

    if (audio.src !== track.preview) {
      audio.src = track.preview;
      audio.currentTime = 0;
      setPreviewProgress(0);
    }

    audio.volume = volume;
    audio.muted = volume === 0;

    try {
      await audio.play();
    } catch (error) {
      if (
        !(
          error instanceof DOMException &&
          (error.name === "AbortError" || error.name === "NotAllowedError")
        )
      ) {
        setPreviewError(true);
      }
    }
  };

  const stopTouchPreviewLoop = () => {
    if (touchPreviewFrameRef.current !== null) {
      window.cancelAnimationFrame(touchPreviewFrameRef.current);
      touchPreviewFrameRef.current = null;
    }
    wheelRef.current?.classList.remove("is-touch-dragging");
  };

  const startTouchPreviewLoop = () => {
    stopTouchPreviewLoop();
    wheelRef.current?.classList.add("is-touch-dragging");
    let lastRenderedAt: number | null = null;

    const updatePreviewUnderFinger = (now: number) => {
      const press = touchPressRef.current;
      const wheel = wheelRef.current;
      if (!press?.previewing || !wheel) {
        touchPreviewFrameRef.current = null;
        return;
      }
      if (animationFrameIsTooSoon(now, lastRenderedAt)) {
        touchPreviewFrameRef.current = window.requestAnimationFrame(updatePreviewUnderFinger);
        return;
      }
      lastRenderedAt = now;

      const wheelRect = wheel.getBoundingClientRect();
      const edgeZone = Math.min(96, Math.max(56, wheelRect.width * 0.22));
      const leftStrength = Math.max(
        0,
        Math.min(1, (wheelRect.left + edgeZone - press.currentX) / edgeZone),
      );
      const rightStrength = Math.max(
        0,
        Math.min(1, (press.currentX - (wheelRect.right - edgeZone)) / edgeZone),
      );

      if (
        press.hasDragged &&
        press.currentY >= wheelRect.top - 24 &&
        press.currentY <= wheelRect.bottom + 24
      ) {
        const elementUnderFinger = document.elementFromPoint(press.currentX, press.currentY);
        const cover = elementUnderFinger?.closest<HTMLButtonElement>("[data-listening-index]");
        const nextIndex = Number(cover?.dataset.listeningIndex);

        const edgeScrollStrength = rightStrength - leftStrength;
        const maxScrollLeft = Math.max(0, wheel.scrollWidth - wheel.clientWidth);
        const canScrollTowardEdge =
          (edgeScrollStrength < 0 && wheel.scrollLeft > 0) ||
          (edgeScrollStrength > 0 && wheel.scrollLeft < maxScrollLeft);

        if (Math.abs(edgeScrollStrength) > 0.02 && canScrollTowardEdge) {
          const direction = Math.sign(edgeScrollStrength);
          const easedStrength = Math.pow(Math.abs(edgeScrollStrength), 1.6);
          wheel.scrollLeft = Math.max(
            0,
            Math.min(maxScrollLeft, wheel.scrollLeft + direction * (1 + easedStrength * 15)),
          );
        }

        if (
          Number.isInteger(nextIndex) &&
          nextIndex >= 0 &&
          nextIndex < listeningTracks.length &&
          nextIndex !== press.activeIndex
        ) {
          press.activeIndex = nextIndex;
          void playPreview(nextIndex);
        }
      }

      touchPreviewFrameRef.current = window.requestAnimationFrame(updatePreviewUnderFinger);
    };

    touchPreviewFrameRef.current = window.requestAnimationFrame(updatePreviewUnderFinger);
  };

  const openTrack = (index: number) => {
    keepPlayingRef.current = true;
    setSelectedIndex(index);
    void playPreview(index);
  };

  const openTouchTrack = (index: number) => {
    keepPlayingRef.current = false;
    resetPreview();
    setSelectedIndex(index);
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const releaseTouchClickSuppression = () => {
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const handleCoverPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.pointerType === "mouse") return;

    clearLongPressTimer();
    lastTouchAtRef.current = Date.now();
    suppressClickRef.current = true;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    touchPressRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      startWheelScrollLeft: wheelRef.current?.scrollLeft ?? 0,
      startPageScrollY: window.scrollY,
      gesture: "pending",
      cancelled: false,
      previewing: false,
      activeIndex: index,
      hasDragged: false,
    };
    longPressTimerRef.current = window.setTimeout(() => {
      const press = touchPressRef.current;
      if (!press || press.cancelled || press.pointerId !== event.pointerId) return;
      press.previewing = true;
      press.activeIndex = index;
      void playPreview(index);
      startTouchPreviewLoop();
    }, 300);
  };

  const handleCoverPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const press = touchPressRef.current;
    if (!press || press.pointerId !== event.pointerId) return;

    event.preventDefault();
    press.currentX = event.clientX;
    press.currentY = event.clientY;
    if (Math.hypot(event.clientX - press.startX, event.clientY - press.startY) > 6) {
      press.hasDragged = true;
    }
    if (press.previewing) return;

    const deltaX = event.clientX - press.startX;
    const deltaY = event.clientY - press.startY;

    if (press.gesture === "pending" && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 8) {
      press.gesture = Math.abs(deltaX) >= Math.abs(deltaY) ? "horizontal" : "vertical";
      press.cancelled = true;
      clearLongPressTimer();
    }

    if (press.gesture === "horizontal" && wheelRef.current) {
      wheelRef.current.scrollLeft = press.startWheelScrollLeft - deltaX;
    } else if (press.gesture === "vertical") {
      window.scrollTo({ top: press.startPageScrollY - deltaY });
    }
  };

  const handleCoverPointerUp = (
    event: ReactPointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.pointerType === "mouse") return;

    const press = touchPressRef.current;
    clearLongPressTimer();
    stopTouchPreviewLoop();
    if (press && press.pointerId === event.pointerId) {
      if (press.previewing) {
        resetPreview();
      } else if (!press.cancelled) {
        openTouchTrack(index);
      }
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    touchPressRef.current = null;
    releaseTouchClickSuppression();
  };

  const cancelCoverPress = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse") {
      stopPreview();
      return;
    }

    const press = touchPressRef.current;
    if (press && press.pointerId === event.pointerId) {
      if (press.previewing) resetPreview();
      press.cancelled = true;
      clearLongPressTimer();
      stopTouchPreviewLoop();
      touchPressRef.current = null;
      releaseTouchClickSuppression();
    }
  };

  const closeTrack = () => {
    keepPlayingRef.current = false;
    setSelectedIndex(null);
    resetPreview();
  };

  const updateVolume = (nextVolume: number) => {
    setVolume(nextVolume);
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = nextVolume;
    audio.muted = nextVolume === 0;
    if (activeIndex !== null) void audio.play();
  };

  useEffect(() => {
    if (selectedIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeTrack();
      } else if (event.key === "ArrowLeft") {
        const previousIndex = (selectedIndex - 1 + listeningTracks.length) % listeningTracks.length;
        openTrack(previousIndex);
      } else if (event.key === "ArrowRight") {
        openTrack((selectedIndex + 1) % listeningTracks.length);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex]);

  useEffect(
    () => () => {
      clearLongPressTimer();
      stopTouchPreviewLoop();
      audioRef.current?.pause();
    },
    [],
  );

  return (
    <>
      <div className="listening-preview">
        <div className="listening-preview-heading" aria-live="polite">
          <span>Now playing preview of...</span>
          <span className="listening-preview-status">
            <strong className={activeTrack ? "listening-preview-track" : "listening-preview-prompt"}>
              {activeTrack ? (
                `${activeTrack.name} — ${activeTrack.artist}`
              ) : (
                <>
                  <span className="cover-instruction-hover">Hover a cover</span>
                  <span className="cover-instruction-tap">Hold and drag to preview, tap to expand</span>
                </>
              )}
            </strong>
            {activeTrack && (
              <span
                className="listening-preview-progress"
                role="progressbar"
                aria-label="Track preview progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(previewProgress * 100)}
                style={{
                  "--preview-progress": `${previewProgress * 360}deg`,
                } as CSSProperties}
              />
            )}
          </span>
        </div>

        <div
          className="listening-cover-wheel"
          role="list"
          aria-label="Track preview covers"
          ref={wheelRef}
        >
          {listeningTracks.map((track, index) => (
            <div
              className="listening-cover-wheel-item"
              role="listitem"
              key={track.id}
              ref={(element) => {
                wheelItemRefs.current[index] = element;
              }}
            >
              <button
                className={`listening-cover-thumbnail${activeIndex === index ? " is-previewing" : ""}`}
                type="button"
                data-listening-index={index}
                aria-haspopup="dialog"
                aria-label={`Preview and enlarge ${track.name} by ${track.artist}`}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") void playPreview(index);
                }}
                onPointerDown={(event) => handleCoverPointerDown(event, index)}
                onPointerMove={handleCoverPointerMove}
                onPointerUp={(event) => handleCoverPointerUp(event, index)}
                onPointerLeave={(event) => {
                  if (event.pointerType === "mouse") stopPreview();
                }}
                onPointerCancel={cancelCoverPress}
                onFocus={() => {
                  if (Date.now() - lastTouchAtRef.current >= 1_000) void playPreview(index);
                }}
                onBlur={stopPreview}
                onContextMenu={(event) => {
                  if (Date.now() - lastTouchAtRef.current < 1_000) event.preventDefault();
                }}
                onClick={(event) => {
                  if (suppressClickRef.current) {
                    event.preventDefault();
                    return;
                  }
                  openTrack(index);
                }}
              >
                <ResponsiveImage asset={imageAssets[track.image]} sizes="(max-width: 520px) 88px, 112px" alt={`${track.name} by ${track.artist} cover`} loading="lazy" draggable="false" />
              </button>
            </div>
          ))}
        </div>

        <label className="listening-volume">
          <span>Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => updateVolume(Number(event.currentTarget.value))}
            aria-label="Track preview volume"
          />
          <output>{Math.round(volume * 100)}%</output>
        </label>
        {previewError && <p className="data-note">Preview unavailable in this browser.</p>}
        <audio
          ref={audioRef}
          preload="none"
          muted={volume === 0}
          loop
          onError={() => setPreviewError(true)}
          onTimeUpdate={(event) => {
            const audio = event.currentTarget;
            setPreviewProgress(
              Number.isFinite(audio.duration) && audio.duration > 0
                ? Math.min(audio.currentTime / audio.duration, 1)
                : 0,
            );
          }}
        />
      </div>

      {selectedTrack && selectedIndex !== null && (
        <Suspense fallback={<p className="viewer-loading" role="status">Loading viewer…</p>}>
          <Viewer selectedTrack={selectedTrack} selectedIndex={selectedIndex} openTrack={openTrack} closeTrack={closeTrack} closeButtonRef={closeButtonRef} />
        </Suspense>
      )}
    </>
  );
}
