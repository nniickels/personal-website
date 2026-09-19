"use client";

import type { CSSProperties } from "react";
import { SkyEasterEggs } from "./sky-easter-eggs";
function createNightStars(count: number, bottomLeftCount = 0) {
  let seed = 9474;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const starColour = () => {
    const colourRoll = random();

    if (colourRoll < 0.34) return "#f8f9ff";
    if (colourRoll < 0.7) return "#dceaff";
    if (colourRoll < 0.84) return "#fff0cf";
    return "#ffd2ad";
  };

  const starSize = () => {
    const sizeRoll = random();

    if (sizeRoll < 0.82) return `${(3.4 + random() * 3.4).toFixed(2)}px`;
    if (sizeRoll < 0.96) return `${(7.5 + random() * 4.5).toFixed(2)}px`;
    return `${(12.5 + random() * 5.5).toFixed(2)}px`;
  };

  return Array.from({ length: count }, (_, index) => {
    const isBottomLeftStar = index >= count - bottomLeftCount;
    const cornerIndex = index - (count - bottomLeftCount);
    const isLeftEdgeStar = isBottomLeftStar && cornerIndex % 2 === 0;

    return {
      top: `${(
        isLeftEdgeStar
          ? 36 + random() * 52
          : isBottomLeftStar
            ? 68 + random() * 24
            : random() * 100
      ).toFixed(3)}%`,
      left: `${(
        isLeftEdgeStar
          ? 1 + random() * 18
          : isBottomLeftStar
            ? 15 + random() * 35
            : random() * 100
      ).toFixed(3)}%`,
      size: starSize(),
      peak: (0.38 + random() * 0.5).toFixed(2),
      duration: `${(2.8 + random() * 3.2).toFixed(2)}s`,
      delay: `${(-random() * 6).toFixed(2)}s`,
      colour: starColour(),
    };
  });
}

const nightStars = createNightStars(96, 9);

const shootingStars = [
  { top: "7%", left: "92%", duration: "11s", delay: "2s", colour: "#edf4ff" },
  { top: "24%", left: "104%", duration: "16s", delay: "8s", colour: "#ffe5bb" },
  { top: "3%", left: "68%", duration: "21s", delay: "14s", colour: "#d6ffe1" },
] as const;

export function NightSky({ className = "" }: { className?: string } = {}) {
  return (
    <>
    <div className={`night-sky${className ? ` ${className}` : ""}`} aria-hidden="true">
      <div className="night-sky__stars">
        {nightStars.map((star, index) => (
          <span
            className="night-star"
            key={index}
            style={
              {
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                "--star-color": star.colour,
                "--star-peak": star.peak,
                "--twinkle-duration": star.duration,
                "--touch-twinkle-duration": `${(Number.parseFloat(star.duration) * 1.8).toFixed(2)}s`,
                "--twinkle-delay": star.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
    <SkyEasterEggs stars={shootingStars} playground={className.includes("night-sky--playground")} />
    </>
  );
}
