"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

type Mode = "serious" | "fun";

const linkedin = {
  name: "LinkedIn",
  href: "https://www.linkedin.com/in/nicolejitong-jiang/",
};

const funProfiles = [
  {
    name: "Google Maps",
    href: "https://www.google.com/maps/contrib/110017132181845047805/reviews/@24.3109578,143.3815865,3z/data=!3m1!4b1!4m3!8m2!3m1!1e1?authuser=1&entry=ttu&g_ep=EgoyMDI2MDgxMi4wIKXMDSoASAFQAw%3D%3D",
  },
  { name: "Pinterest", href: "https://ca.pinterest.com/nnickelsj/" },
  { name: "Spotify", href: "https://stats.fm/user/nnickels?range=lifetime" },
] as const;

const seriousSections = [
  {
    title: "Experience",
    heading: "Professional experience",
    note: "Roles, organizations and dates will appear here.",
  },
  {
    title: "Education",
    heading: "Education details",
    note: "Degrees, programs and institutions will appear here.",
  },
  {
    title: "Projects",
    heading: "Selected projects",
    note: "Project summaries, links and tools will appear here.",
  },
  {
    title: "Skills",
    heading: "Skills & interests",
    note: "Technical skills, languages and interests will appear here.",
  },
] as const;

const listeningLists = ["Artists", "Tracks", "Albums"] as const;
const emptyRanking = Array.from({ length: 10 }, (_, index) => index + 1);

function SeriousContent() {
  return (
    <div className="mode-content" aria-label="Serious mode content">
      {seriousSections.map((section) => (
        <section className="section" key={section.title}>
          <h2>{section.title}</h2>
          <article className="entry placeholder-entry">
            <h3>{section.heading}</h3>
            <p>{section.note}</p>
          </article>
        </section>
      ))}
    </div>
  );
}

function FunContent() {
  return (
    <div className="mode-content fun-content" aria-label="Fun mode content">
      <section className="section">
        <h2>Pinterest</h2>
        <article className="metric-entry">
          <div>
            <p className="metric-label">Monthly viewers</p>
            <strong className="metric-value">—</strong>
          </div>
          <p className="data-note">Pinterest analytics connection required.</p>
        </article>
      </section>

      <section className="section">
        <h2>Lifetime listening</h2>
        <p className="data-note">Listening data connection required.</p>
        <div className="listening-grid">
          {listeningLists.map((list) => (
            <article className="ranking-card" key={list}>
              <h3>Top 10 {list}</h3>
              <ol>
                {emptyRanking.map((rank) => (
                  <li key={rank}>
                    <span>{String(rank).padStart(2, "0")}</span>
                    <span>—</span>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function Portfolio() {
  const [mode, setMode] = useState<Mode>("serious");

  useEffect(() => {
    setMode(localStorage.getItem("portfolio-mode") === "fun" ? "fun" : "serious");
  }, []);

  function chooseMode(nextMode: Mode) {
    setMode(nextMode);
    localStorage.setItem("portfolio-mode", nextMode);
  }

  const profiles = mode === "serious" ? [linkedin] : funProfiles;

  return (
    <>
      <header className="bar topbar">
        <div className="container bar-content topbar-content">
          <a className="home-link" href="/" aria-label="Nicole Jiang home">nj</a>
          <div className="mode-toggle" role="group" aria-label="Portfolio mode">
            <button
              type="button"
              className={mode === "serious" ? "is-active" : undefined}
              aria-pressed={mode === "serious"}
              onClick={() => chooseMode("serious")}
            >
              Serious Mode
            </button>
            <span aria-hidden="true">|</span>
            <button
              type="button"
              className={mode === "fun" ? "is-active" : undefined}
              aria-pressed={mode === "fun"}
              onClick={() => chooseMode("fun")}
            >
              Fun Mode!
            </button>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container layout">
        <section className="hero">
          <h1>Nicole Jiang</h1>
          <p className="subtitle">
            {mode === "serious" ? "Experience, projects & selected work" : "Pins, places & playlists"}
          </p>
          <nav className="profile-links" aria-label="External profiles">
            {profiles.map((profile, index) => (
              <span key={profile.name}>
                {index > 0 && <span className="separator" aria-hidden="true">|</span>}
                <a href={profile.href} target="_blank" rel="noreferrer">
                  {profile.name}
                </a>
              </span>
            ))}
          </nav>
        </section>
        {mode === "serious" ? <SeriousContent /> : <FunContent />}
      </main>

      <footer className="bar bottombar">
        <div className="container bar-content footer-content">
          <p>© {new Date().getFullYear()} Nicole Jiang</p>
        </div>
      </footer>
    </>
  );
}
