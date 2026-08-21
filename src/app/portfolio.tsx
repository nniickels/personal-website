"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
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

const projects = [
  {
    title: "Mapping Black-Hole Growth Scenarios for Early Giants",
    dates: "Feb 2026 - Present",
    details: [
      "Built a standardized, provenance-tracked catalogue of JWST-identified accreting black holes at high redshift to evaluates objects against different growth scenarios (seed mass, formation redshift, Eddington ratio, Kerr spin, radiative efficiency, and merger contribution combinations). Supervised by Prof. Pratika Dayal (CITA, DAA-Dunlap).",
    ],
  },
  {
    title: "Galaxy Star-Formation Main Sequence Analysis with Cosmological Simulations",
    dates: "May 2025",
    details: [
      "Queried and processed galaxy records from EAGLE and IllustrisTNG to visualize SFR-M* trends across low redshifts.",
    ],
  },
  {
    title: "Predicting APA Site Choice from mRNA Sequences",
    dates: "Sep 2025",
    href: "https://devpost.com/software/predicting-apa-site-choice-from-mrna-sequences",
    details: [
      "APA site prediction pre-processing pipeline for the DNABERT-2 genome transformer model. Part of a five-member undergraduate team; 2nd place at the Toronto Bioinformatics Hackathon.",
    ],
  },
  {
    title: "Saturn and Moons Observation with HDR Imaging",
    dates: "Oct 2024 - Dec 2024",
    details: [
      "Captured and compiled images of Saturn and its moons to evaluate Titan's orbital period.",
    ],
    
  },
] as const;


const experience = [
  {
    organization: "Royal Astronomical Society of Canada (RASC)",
    role: "Journal Contributor / Observatory Maintenance",
    dates: "Sep 2025 - Present",
    details: ["Curating planet ephemerides and observational astronomy events for the Journal centre-spread. Observatory maintenance at the E.C. Carr Astronomical Observatory."
     
    ],
  },


  {
    organization: "Ontario Science Centre",
    role: "Student Host",
    dates: "Feb 2024 - Jun 2024",
    details: [
      
    ],
  },

   {
    organization: "University of Toronto Aerospace Team (UTAT)",
    role: "Researcher",
    dates: "Oct 2025 - Apr 2026",
    details: [
    ],
  },

] as const;

const listeningLists = ["Artists", "Tracks", "Albums"] as const;
const emptyRanking = Array.from({ length: 10 }, (_, index) => index + 1);

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function SeriousContent() {
  return (
    <div className="mode-content" aria-label="Serious mode content">
      <section className="section" id="education">
        <h2>Education</h2>
        <article className="resume-item subsection-item">
          <div className="entry-head">
            <h3>University of Toronto</h3>
            <p className="entry-dates">2024 - 2029</p>
          </div>
          <p>HBSc, Astronomy &amp; Physics Specialist · Statistics Minor · Philosophy Minor</p>
        </article>
      </section>


      <section className="section" id="projects">
        <h2>Research &amp; Technical Projects</h2>
        <div className="entries">
          {projects.map((project) => (
            <article className="resume-item subsection-item" key={project.title}>
              <div className="entry-head">
                <h3>
                  {"href" in project ? (
                    <a className="text-link" href={project.href} target="_blank" rel="noreferrer">
                      {project.title}
                    </a>
                  ) : project.title}
                </h3>
                <p className="entry-dates">{project.dates}</p>
              </div>
              <BulletList items={project.details} />
            </article>
          ))}
        </div>
      </section>

        <section className="section" id="experience">
        <h2>Service & Leadership</h2>
        <div className="entries">
          {experience.map((item) => (
            <article className="resume-item subsection-item" key={`${item.organization}-${item.role}`}>
              <div className="entry-head">
                <h3>{item.organization}</h3>
                <p className="entry-dates">{item.dates}</p>
              </div>
              <p>{item.role}</p>
              <BulletList items={item.details} />
            </article>
          ))}
        </div>
      </section>

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

  function switchMode() {
    const nextMode: Mode = mode === "serious" ? "fun" : "serious";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const applyMode = () => {
      setMode(nextMode);
      localStorage.setItem("portfolio-mode", nextMode);
    };

    if (reducedMotion || typeof document.startViewTransition !== "function") {
      applyMode();
      return;
    }

    document.startViewTransition(() => {
      flushSync(applyMode);
    });
  }

  const profiles = mode === "serious" ? [linkedin] : funProfiles;

  return (
    <>
      <header className="bar topbar">
        <div className="container topbar-content">
          <a className="text-btn home-link" href="/" aria-label="Nicole Jiang home">nj</a>
          <div className="topbar-actions">
            <button
              type="button"
              className="text-btn mode-switch"
              onClick={switchMode}
              aria-label={`Switch to ${mode === "serious" ? "fun" : "serious"} mode`}
            >
              {mode === "serious" ? "Fun Mode!" : "Serious Mode"}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container layout">
        <section className="hero">
          <h1>Nicole Jiang</h1>
          <p className="subtitle">
            {mode === "serious" ? "astronomy and physics undergrad @ uoft" : "hello gello"}
          </p>
          <nav className="profile-links" aria-label="External profiles">
            {profiles.map((profile, index) => (
              <span key={profile.name}>
                {index > 0 && <span className="separator" aria-hidden="true">|</span>}
                <a className="text-link" href={profile.href} target="_blank" rel="noreferrer">
                  {profile.name}
                </a>
              </span>
            ))}
          </nav>
        </section>
        {mode === "serious" ? <SeriousContent /> : <FunContent />}
      </main>

      <footer className="bar bottombar">
        <div className="container footer-content">
          <p>© {new Date().getFullYear()} Nicole Jiang</p>
        </div>
      </footer>
    </>
  );
}
