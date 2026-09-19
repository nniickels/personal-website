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
                <span className="desktop-only">Playground</span>
                <span className="mobile-only">Play</span>
              </a>
            )}
            {page === "playground" ? (
              <>
                <a className="text-btn mode-switch" href="/">
                  <span className="desktop-only">Main Quest</span>
                  <span className="mobile-only">Main</span>
                </a>
                <a className="text-btn mode-switch" href="/side-quests">
                  <span className="desktop-only">Side Quests</span>
                  <span className="mobile-only">Side</span>
                </a>
              </>
            ) : (
              <a
                className="text-btn mode-switch"
                href={page === "serious" ? "/side-quests" : "/"}
                aria-label={`Switch to ${page === "serious" ? "Side Quests" : "Main Quest"}`}
              >
                <span className="desktop-only">{page === "serious" ? "Side Quests" : "Main Quest"}</span>
                <span className="mobile-only">{page === "serious" ? "Side" : "Main"}</span>
              </a>
            )}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
