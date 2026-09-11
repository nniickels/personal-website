"use client";
import { ThemeToggle } from "./theme-toggle";
import { useCalligraphyEasterEgg } from "./sky-easter-eggs";
import { ResponsiveImage } from "./responsive-image";
import icons from "../generated/media/icons.json";
export type SitePage = "serious" | "fun" | "playground";
export function SiteHeader({ page }: { page: SitePage }) {
  const handleCalligraphyClick = useCalligraphyEasterEgg();
  return (
    <header className="bar topbar">
      <div className="container topbar-content">
        <a className="text-btn home-link" href="/" aria-label="Nicole Jiang home" onClick={handleCalligraphyClick}>
          <ResponsiveImage asset={icons["/tong-calligraphy.png"]} sizes="22px" alt="" aria-hidden="true" />
          <ResponsiveImage asset={icons["/tong-calligraphy.png"]} sizes="22px" alt="" aria-hidden="true" />
        </a>
        <div className="topbar-actions">
          <nav className="page-links" aria-label="Primary navigation">
            {page !== "playground" && (
              <a className="text-btn mode-switch" href="/playground">
                Playground
              </a>
            )}
            {page === "playground" ? (
              <>
                <a className="text-btn mode-switch" href="/">
                  Main Quest
                </a>
                <a className="text-btn mode-switch" href="/side-quests">
                  Side Quests
                </a>
              </>
            ) : (
              <a
                className="text-btn mode-switch"
                href={page === "serious" ? "/side-quests" : "/"}
                aria-label={`Switch to ${page === "serious" ? "Side Quests" : "Main Quest"}`}
              >
                {page === "serious" ? "Side Quests" : "Main Quest"}
              </a>
            )}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
