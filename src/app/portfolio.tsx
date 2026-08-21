"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import { ThemeToggle } from "./theme-toggle";

type Mode = "serious" | "fun";
type IconName =
  | "email"
  | "github"
  | "instagram"
  | "linkedin"
  | "maps"
  | "pinterest"
  | "spotify";

type SocialLink = {
  name: string;
  href: string;
  icon: IconName;
};

const seriousLinks: readonly SocialLink[] = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/nicolejitong-jiang/",
    icon: "linkedin",
  },
  { name: "GitHub", href: "https://github.com/nniickels", icon: "github" },
  { name: "Email", href: "mailto:nicolejiang9474@gmail.com", icon: "email" },
] as const;

const funLinks: readonly SocialLink[] = [
  {
    name: "Google Maps",
    href: "https://www.google.com/maps/contrib/110017132181845047805/reviews/@24.3109578,143.3815865,3z/data=!3m1!4b1!4m3!8m2!3m1!1e1?authuser=1&entry=ttu&g_ep=EgoyMDI2MDgxMi4wIKXMDSoASAFQAw%3D%3D",
    icon: "maps",
  },
  { name: "Pinterest", href: "https://ca.pinterest.com/nnickelsj/", icon: "pinterest" },
  { name: "Spotify", href: "https://stats.fm/user/nnickels?range=lifetime", icon: "spotify" },
  { name: "Instagram", href: "https://www.instagram.com/nicolejiang_/", icon: "instagram" },
] as const;

const projects = [
  {
    title: "Mapping Black-Hole Growth Scenarios for Early Giants",
    dates: "Feb 2026 - Present",
    description:
      "Built a standardized, provenance-tracked catalogue of JWST-identified accreting black holes at high redshift to evaluate objects against different growth scenarios. Supervised by Prof. Pratika Dayal (CITA, DAA-Dunlap).",
  },
  {
    title: "Galaxy Star-Formation Main Sequence Analysis with Cosmological Simulations",
    dates: "May 2025",
    description:
      "Queried and processed galaxy records from EAGLE and IllustrisTNG to visualize SFR-M* trends across low redshifts.",
  },
  {
    title: "Predicting APA Site Choice from mRNA Sequences",
    dates: "Sep 2025",
    href: "https://devpost.com/software/predicting-apa-site-choice-from-mrna-sequences",
    description:
      "Built an APA site-prediction preprocessing pipeline for the DNABERT-2 genome transformer model as part of a five-member undergraduate team; placed 2nd at the Toronto Bioinformatics Hackathon.",
  },
  {
    title: "Saturn and Moons Observation with HDR Imaging",
    dates: "Oct 2024 - Dec 2024",
    description:
      "Captured and compiled images of Saturn and its moons to evaluate Titan's orbital period.",
  },
] as const;

const experience = [
  {
    organization: "Royal Astronomical Society of Canada (RASC)",
    role: "Journal Contributor / Observatory Maintenance",
    dates: "Sep 2025 - Present",
    description:
      "Curating planet ephemerides and observational astronomy events for the Journal centre-spread. Observatory maintenance at the E.C. Carr Astronomical Observatory.",
  },
  {
    organization: "Ontario Science Centre",
    role: "Student Host",
    dates: "Feb 2024 - Jun 2024",
  },
  {
    organization: "University of Toronto Aerospace Team (UTAT)",
    role: "Researcher",
    dates: "Oct 2025 - Apr 2026",
  },
] as const;

const listeningLists = ["Artists", "Tracks", "Albums"] as const;
const emptyRanking = Array.from({ length: 10 }, (_, index) => index + 1);

function SocialIcon({ name }: { name: IconName }) {
  if (name === "github") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          stroke="none"
          d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.41-1.26.74-1.55-2.57-.29-5.27-1.28-5.27-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.16 1.18a10.98 10.98 0 0 1 5.76 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.23 2.76.12 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.71 5.38-5.29 5.67.42.36.79 1.06.79 2.15v3.26c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z"
        />
      </svg>
    );
  }

  if (name === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="6.7" cy="7" r="1.3" fill="currentColor" stroke="none" />
        <path
          d="M5.5 10.2h2.4v7.3H5.5zM10.5 10.2h2.3v1c.7-.9 1.6-1.3 2.8-1.3 2.1 0 3.4 1.3 3.4 4v3.6h-2.4v-3.3c0-1.4-.5-2.1-1.7-2.1-1.3 0-2 1-2 2.5v2.9h-2.4v-7.3Z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    );
  }

  if (name === "email") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3.5" y="5.5" width="17" height="13" rx="1.8" />
        <path d="m4.5 7 7.5 6 7.5-6" />
      </svg>
    );
  }

  if (name === "maps") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.1" />
      </svg>
    );
  }

  if (name === "pinterest") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          stroke="none"
          d="M12 2.5a9.5 9.5 0 0 0-3.46 18.35c-.08-1.56-.02-3.43.39-5.18l1.22-5.17s-.31-.62-.31-1.54c0-1.44.84-2.52 1.88-2.52.89 0 1.32.67 1.32 1.47 0 .9-.57 2.23-.86 3.47-.24 1.04.52 1.89 1.55 1.89 1.86 0 3.29-1.96 3.29-4.8 0-2.51-1.8-4.26-4.38-4.26-2.98 0-4.73 2.24-4.73 4.55 0 .9.35 1.87.78 2.39.09.1.1.18.07.3l-.29 1.18c-.05.19-.15.23-.35.14-1.31-.61-2.13-2.52-2.13-4.06 0-3.31 2.4-6.34 6.93-6.34 3.64 0 6.47 2.59 6.47 6.05 0 3.62-2.28 6.53-5.44 6.53-1.06 0-2.06-.55-2.4-1.2l-.65 2.49c-.24.91-.88 2.05-1.31 2.75.99.31 2.03.48 3.11.48A9.5 9.5 0 0 0 12 2.5Z"
        />
      </svg>
    );
  }

  if (name === "spotify") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9" />
        <path d="M7.7 9.1c3.2-1 7.2-.7 9.8.8M8.4 12.3c2.7-.8 5.9-.5 8.2.7M9 15.2c2.2-.6 4.6-.3 6.5.7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      className="link-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m9.5 14.5 5-5" />
      <path d="M7.2 16.8 5.7 18.3a3.2 3.2 0 0 1-4.5-4.5l3.6-3.6a3.2 3.2 0 0 1 4.5 0" />
      <path d="m16.8 7.2 1.5-1.5a3.2 3.2 0 0 1 4.5 4.5l-3.6 3.6a3.2 3.2 0 0 1-4.5 0" />
    </svg>
  );
}

function SocialLinks({ links }: { links: readonly SocialLink[] }) {
  return (
    <nav className="social-links" aria-label="External profiles">
      {links.map((link) => (
        <a
          className="social-link"
          href={link.href}
          key={link.name}
          target={link.icon === "email" ? undefined : "_blank"}
          rel={link.icon === "email" ? undefined : "noreferrer"}
          aria-label={link.name}
          title={link.name}
        >
          <SocialIcon name={link.icon} />
        </a>
      ))}
    </nav>
  );
}

function SeriousContent() {
  return (
    <div className="mode-content" aria-label="Serious mode content">
      <section className="section" id="education">
        <h2>Education</h2>
        <div className="education-entries">
          <article className="education-entry subsection-item">
            <img
              className="education-logo education-logo--uoft"
              src="/university-of-toronto.png"
              alt="University of Toronto crest"
              width="46"
              height="46"
            />
            <div className="resume-item">
              <div className="entry-head">
                <h3>University of Toronto</h3>
                <p className="entry-dates">Sep 2024 - Apr 2029</p>
              </div>
              <p>HBSc, Astronomy &amp; Physics Specialist · Statistics Minor · Philosophy Minor</p>
            </div>
          </article>
          <article className="education-entry subsection-item">
            <img
              className="education-logo education-logo--osc"
              src="/ontario-science-centre.png"
              alt="Ontario Science Centre logo"
              width="50"
              height="46"
            />
            <div className="resume-item">
              <div className="entry-head">
                <h3>Ontario Science Centre Science School</h3>
                <p className="entry-dates">Feb 2024 - June 2024</p>
              </div>
            </div>
          </article>
        </div>
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
                      <LinkIcon />
                    </a>
                  ) : project.title}
                </h3>
                <p className="entry-dates">{project.dates}</p>
              </div>
              <p className="project-description">{project.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="experience">
        <h2>Service &amp; Leadership</h2>
        <div className="entries">
          {experience.map((item) => (
            <article className="resume-item subsection-item" key={`${item.organization}-${item.role}`}>
              <div className="entry-head">
                <h3>{item.organization}</h3>
                <p className="entry-dates">{item.dates}</p>
              </div>
              <p>{item.role}</p>
              {"description" in item && (
                <p className="service-description">{item.description}</p>
              )}
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

  function switchMode() {
    const nextMode: Mode = mode === "serious" ? "fun" : "serious";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const applyMode = () => {
      setMode(nextMode);
    };

    if (reducedMotion || typeof document.startViewTransition !== "function") {
      applyMode();
      return;
    }

    document.startViewTransition(() => {
      flushSync(applyMode);
    });
  }

  const socialLinks = mode === "serious" ? seriousLinks : funLinks;

  return (
    <>
      <header className="bar topbar">
        <div className="container topbar-content">
          <a
            className="text-btn home-link"
            href="/"
            aria-label="Nicole Jiang home"
            onClick={() => setMode("serious")}
          >
            同同
          </a>
          <div className="topbar-actions">
            <button
              type="button"
              className="text-btn mode-switch"
              onClick={switchMode}
              aria-label={`Switch to ${mode === "serious" ? "fun" : "serious"} mode`}
            >
              {mode === "serious" ? "Serious Mode" : "Fun Mode!"}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container layout">
        <section className="hero">
          <div className="hero-heading">
            <h1>Nicole Jiang</h1>
            <SocialLinks links={socialLinks} />
          </div>
          <p className="subtitle">
            {mode === "serious" ? (
              <>
                astrophysics undergrad @ uoft
                <span className="subtitle-separator" aria-hidden="true">
                  |
                </span>
                <a className="text-link" href="/resume.pdf" target="_blank" rel="noreferrer">
                  resume
                </a>
              </>
            ) : "nickel / nickels / nnickels / nnickelsj"}
          </p>
          <p className="hero-description">
            {mode === "serious"
              ? "Hello! I'm Nicole, an Astronomy and Physics Specialist student at the University of Toronto. My research interests include galaxy formation and evolution, observational cosmology, early universe physics, and stellar remnants. Below is a quick overview of my academic profile. Feel free to reach out via email or connect with me on LinkedIn :)) P.S. I also have a fun mode for my more casual side and personal interests!"
              : "Hi!! It's Nicole again. Outside of astrophysics and career-goal-adjacent stuff, I'm very interested in philosopy (namely metaphysics and epistemolgy, though intersecitonal questions are my favourite). I enjoy listening to music, cooking, gardening, house-plant-keeping, exploring the outdoors, fossil-hunting, rock-collecting, dried-flower-keeping, flower-pressing, scrapbooking, reading, and gaming. I'd like to share my many collections and hobbies with you in this mode, so please enjoy! :))"}
          </p>
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
