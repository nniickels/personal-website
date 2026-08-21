"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { PublicStatsResponse } from "../api-stats";
import { ThemeToggle } from "./theme-toggle";

type Mode = "serious" | "fun";
const storedModeKey = "portfolio-mode";
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
      "Queried and processed galaxy records from EAGLE and IllustrisTNG to visualize SFR-M* trends at low redshifts.",
  },
  {
    title: "Predicting APA Site Choice from mRNA Sequences",
    dates: "Sep 2025",
    href: "https://devpost.com/software/predicting-apa-site-choice-from-mrna-sequences",
    description:
      "Built an APA site-prediction preprocessing pipeline for the DNABERT-2 genome transformer model as part of a five-member undergraduate team; placed 2nd at the Toronto Bioinformatics Hackathon.",
  },
  {
    title: "Observation of Saturn and Its Moons with HDR Imaging",
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
      "Curating planet ephemerides and observational astronomy events for the Journal centre spread. Observatory maintenance at the E.C. Carr Astronomical Observatory.",
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

const listeningRankings = [
  { title: "Top 5 Genres", count: 5 },
  { title: "Top 10 Artists", count: 10 },
  { title: "Top 10 Tracks", count: 10 },
] as const;

const pokemonCards = [
  {
    name: "Mega Absol ex (Mega Brave 089/063)",
    image: "/pokemon-cards/mega-absol-ex-089.webp",
    href: "https://www.tcgcollector.com/cards/50621/mega-absol-ex-mega-brave-089-063",
  },
  {
    name: "Mega Absol ex (Mega Brave 079/063)",
    image: "/pokemon-cards/mega-absol-ex-079.webp",
    href: "https://www.tcgcollector.com/cards/50611/mega-absol-ex-mega-brave-079-063",
  },
  {
    name: "M Absol-EX (XY Promos No. 343)",
    image: "/pokemon-cards/m-absol-ex-343.webp",
    href: "https://www.tcgcollector.com/cards/59315/m-absol-ex-xy-promos-no-343",
  },
  {
    name: "Scizor (Ruler of the Black Flame 116/108)",
    image: "/pokemon-cards/scizor-116.webp",
    href: "https://www.tcgcollector.com/cards/42038/scizor-ruler-of-the-black-flame-116-108",
  },
  {
    name: "M Scizor-EX (Rage of the Broken Heavens 087/080)",
    image: "/pokemon-cards/m-scizor-ex-087.jpg",
    href: "https://www.tcgcollector.com/cards/23245/m-scizor-ex-rage-of-the-broken-heavens-087-080",
  },
  {
    name: "M Scizor-EX (Rage of the Broken Heavens 058/080)",
    image: "/pokemon-cards/m-scizor-ex-058.jpg",
    href: "https://www.tcgcollector.com/cards/23216/m-scizor-ex-rage-of-the-broken-heavens-058-080",
  },
  {
    name: "Team Rocket's Houndoom (The Glory of Team Rocket 100/098)",
    image: "/pokemon-cards/team-rockets-houndoom-100.webp",
    href: "https://www.tcgcollector.com/cards/48210/team-rockets-houndoom-the-glory-of-team-rocket-100-098",
  },
  {
    name: "Garchomp & Giratina-GX (Tag Team Collection 128/205)",
    image: "/pokemon-cards/garchomp-giratina-gx-128.webp",
    href: "https://www.tcgcollector.com/cards/79012/garchomp-and-giratina-gx-tag-team-collection-set-a-128-205",
  },
  {
    name: "Darkrai VSTAR (VSTAR Universe 228/172)",
    image: "/pokemon-cards/darkrai-vstar-228.jpg",
    href: "https://www.tcgcollector.com/cards/39798/darkrai-vstar-vstar-universe-228-172",
  },
  {
    name: "N's Reshiram (Battle Partners 109/100)",
    image: "/pokemon-cards/ns-reshiram-109.webp",
    href: "https://www.tcgcollector.com/cards/47345/ns-reshiram-battle-partners-109-100",
  },
  {
    name: "Lilligant (Black Bolt 092/086)",
    image: "/pokemon-cards/lilligant-092.webp",
    href: "https://www.tcgcollector.com/cards/49478/lilligant-black-bolt-092-086",
  },
  {
    name: "Lapras (VSTAR Universe 177/172)",
    image: "/pokemon-cards/lapras-177.jpg",
    href: "https://www.tcgcollector.com/cards/39747/lapras-vstar-universe-177-172",
  },
  {
    name: "Caterpie (Pokémon Card 151 172/165)",
    image: "/pokemon-cards/caterpie-172.webp",
    href: "https://www.tcgcollector.com/cards/41665/caterpie-pokemon-card-151-172-165",
  },
  {
    name: "Psyduck (Pokémon Card 151 175/165)",
    image: "/pokemon-cards/psyduck-175.webp",
    href: "https://www.tcgcollector.com/cards/41668/psyduck-pokemon-card-151-175-165",
  },
  {
    name: "Corviknight V (VMAX Climax 248/184)",
    image: "/pokemon-cards/corviknight-v-248.jpg",
    href: "https://www.tcgcollector.com/cards/36804/corviknight-v-vmax-climax-248-184",
  },
] as const;

function createNightStars(count: number) {
  let seed = 9474;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  return Array.from({ length: count }, () => ({
    top: `${(random() * 100).toFixed(3)}%`,
    left: `${(random() * 100).toFixed(3)}%`,
    size: `${(1.1 + random() * 1.5).toFixed(2)}px`,
    peak: (0.38 + random() * 0.5).toFixed(2),
    duration: `${(2.8 + random() * 3.2).toFixed(2)}s`,
    delay: `${(-random() * 6).toFixed(2)}s`,
  }));
}

const nightStars = createNightStars(72);

const shootingStars = [
  { top: "7%", left: "92%", duration: "11s", delay: "2s" },
  { top: "24%", left: "104%", duration: "16s", delay: "8s" },
  { top: "3%", left: "68%", duration: "21s", delay: "14s" },
] as const;

function NightSky() {
  return (
    <div className="night-sky" aria-hidden="true">
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
                "--star-peak": star.peak,
                "--twinkle-duration": star.duration,
                "--twinkle-delay": star.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="night-sky__shooting-stars">
        {shootingStars.map((star, index) => (
          <span
            className="shooting-star"
            key={index}
            style={
              {
                top: star.top,
                left: star.left,
                "--shoot-duration": star.duration,
                "--shoot-delay": star.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

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

function ExternalLinkIcon() {
  return (
    <svg
      className="external-link-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
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
    <div className="mode-content serious-content" aria-label="Main Quest content">
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
                <p className="entry-dates">Feb 2024 - Jun 2024</p>
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
                      <ExternalLinkIcon />
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

function PokemonCardWheel() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selectedCard = selectedIndex === null ? null : pokemonCards[selectedIndex];

  useEffect(() => {
    if (selectedIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedIndex(null);
      } else if (event.key === "ArrowLeft") {
        setSelectedIndex((current) =>
          current === null ? null : (current - 1 + pokemonCards.length) % pokemonCards.length,
        );
      } else if (event.key === "ArrowRight") {
        setSelectedIndex((current) =>
          current === null ? null : (current + 1) % pokemonCards.length,
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex]);

  return (
    <>
      <div className="pokemon-card-wheel" role="list" aria-label="Pokémon card collection">
        {pokemonCards.map((card, index) => (
          <div className="pokemon-card-wheel-item" role="listitem" key={card.href}>
            <button
              className="pokemon-card-thumbnail"
              type="button"
              aria-haspopup="dialog"
              aria-label={`Enlarge ${card.name}`}
              onClick={() => setSelectedIndex(index)}
            >
              <img src={card.image} alt={card.name} loading="lazy" draggable="false" />
            </button>
          </div>
        ))}
      </div>

      {selectedCard && selectedIndex !== null && (
        <div className="pokemon-card-lightbox" onClick={() => setSelectedIndex(null)}>
          <div
            className="pokemon-card-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pokemon-card-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="pokemon-card-close"
              type="button"
              aria-label="Close card viewer"
              onClick={() => setSelectedIndex(null)}
              ref={closeButtonRef}
            >
              ×
            </button>
            <button
              className="pokemon-card-nav pokemon-card-nav--previous"
              type="button"
              aria-label="Previous card"
              onClick={() =>
                setSelectedIndex(
                  (selectedIndex - 1 + pokemonCards.length) % pokemonCards.length,
                )
              }
            >
              ←
            </button>
            <a
              className="pokemon-card-expanded-link"
              href={selectedCard.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${selectedCard.name} on TCG Collector`}
            >
              <img src={selectedCard.image} alt={selectedCard.name} draggable="false" />
            </a>
            <button
              className="pokemon-card-nav pokemon-card-nav--next"
              type="button"
              aria-label="Next card"
              onClick={() => setSelectedIndex((selectedIndex + 1) % pokemonCards.length)}
            >
              →
            </button>
            <div className="pokemon-card-caption">
              <h3 id="pokemon-card-dialog-title">{selectedCard.name}</h3>
              <p>
                {selectedIndex + 1} / {pokemonCards.length} · click the card to open TCG Collector
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FunContent() {
  const [stats, setStats] = useState<PublicStatsResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStats() {
      try {
        const response = await fetch("/api/stats", { signal: controller.signal });
        if (!response.ok) throw new Error(`Stats endpoint returned ${response.status}`);
        setStats((await response.json()) as PublicStatsResponse);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Unable to load portfolio stats.");
      }
    }

    void loadStats();
    return () => controller.abort();
  }, []);

  const pinterest = stats?.pinterest;
  const spotify = stats?.spotify;
  const clashRoyale = stats?.clashRoyale;
  const steam = stats?.steam;

  const rankingData = spotify?.status === "ok"
    ? [
        {
          title: "Top 5 Genres",
          count: 5,
          items: spotify.data.genres.map((name) => ({ name, href: null })),
        },
        { title: "Top 10 Artists", count: 10, items: spotify.data.artists },
        {
          title: "Top 10 Tracks",
          count: 10,
          items: spotify.data.tracks.map((track) => ({
            name: `${track.name} — ${track.artists.join(", ")}`,
            href: track.href,
          })),
        },
      ]
    : listeningRankings.map(({ title, count }) => ({ title, count, items: [] }));

  return (
    <div className="mode-content fun-content" aria-label="Side Quests content">
      <section className="section" id="photo-gallery">
        <details className="dropdown-entry photo-gallery-dropdown">
          <summary>
            <h2>Photo Gallery</h2>
          </summary>
          <div className="dropdown-content">
            <p className="placeholder-copy">
              I like taking photos! 
            </p>
            <div className="api-placeholder" aria-label="Pinterest monthly viewers">
              <span>Pinterest monthly viewers</span>
              <strong>
                {pinterest?.status === "ok" ? pinterest.data.monthlyViews.toLocaleString() : "—"}
              </strong>
              <small>
                {pinterest?.status === "ok"
                  ? "Live from Pinterest."
                  : pinterest?.message ?? "Loading live data…"}
              </small>
            </div>
            <div className="media-placeholder media-placeholder--gallery">
              Photo gallery placeholder
            </div>
          </div>
        </details>
      </section>

      <section className="section" id="listening">
        <h2>Listening</h2>
        <p className="data-note">
          {spotify?.status === "ok"
            ? "Spotify long-term listening data (approximately one year)."
            : spotify?.message ?? "Loading live data…"}
        </p>
        <div className="listening-rankings">
          {rankingData.map(({ title, count, items }) => (
            <article className="ranking-card" key={title}>
              <h3>{title}</h3>
              <ol>
                {Array.from({ length: count }, (_, index) => index).map((index) => (
                  <li key={index}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {items[index]?.href ? (
                      <a
                        className="text-link"
                        href={items[index].href ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {items[index].name}
                      </a>
                    ) : (
                      <span>{items[index]?.name ?? "—"}</span>
                    )}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="reading">
        <h2>Reading</h2>
        <p className="placeholder-copy">
          My current favourite book is{" "}
          <strong><cite>The Book of Laughter and Forgetting</cite></strong> by Milan Kundera (Michael Henry Heim translation). 
          I like his essayistic prose, and enjoy reading other books within the realm of literary fiction, philosophical fiction, 
          and surrealism. As for papers, I recently read Derek Parfit's 1971 paper on personal identity and took a liking to his theory. 
          More casually, I like to read comics and manga also. Some favourites include the{" "}
          <strong><cite>House of Slaughter Vol.2</cite></strong>, and the <strong><cite>Heaven's Design Team</cite></strong> series.  
        </p>
        </section>

      <section className="section" id="watching">
        <h2>Watching</h2>
        <p className="placeholder-copy">
          My favourite YouTube channels are{" "}
          <strong>
            <cite>
              <a className="text-link" href="https://www.youtube.com/@JacobGeller" target="_blank" rel="noreferrer">
                Jacob Geller
              </a>
            </cite>
          </strong>{" "}
          and{" "}
          <strong>
            <cite>
              <a className="text-link" href="https://www.youtube.com/@DarylTalksGames" target="_blank" rel="noreferrer">
                Daryl Talks Games
              </a>
            </cite>
          </strong>.{" "}
          If you like video essays about video-games and/or philosophy and psychology, I highly reccomend! I also really like the 2007 anime  
          <strong><cite> Mononoke</cite></strong>, and am currently watching <strong><cite>Steins;Gate</cite></strong>. Regarding Western media, I like <strong><cite>Superbad</cite></strong>, <strong><cite>BoJack Horseman </cite></strong> 
          and <strong><cite> Dead Poets Society</cite></strong>. 
        </p>
      </section>

      <section className="section" id="gaming">
        <h2>Gaming</h2>
        <p className="placeholder-copy">
          My favourite games include{" "}
          <a
            className="text-link"
            href="https://store.steampowered.com/app/208650/Batman_Arkham_Knight/"
            target="_blank"
            rel="noreferrer"
          >
            <strong><cite>Batman: Arkham Knight</cite></strong>
          </a>{" "}
          and{" "}
          <a
            className="text-link"
            href="https://store.steampowered.com/app/2240620/UNBEATABLE/"
            target="_blank"
            rel="noreferrer"
          >
            <strong><cite>UNBEATABLE</cite></strong>
          </a>. I also enjoy the occasional two-week{" "}
          <strong><cite>Minecraft</cite></strong> phase, and unfortunately have been finding myself
          going back to <strong><cite>League of Legends</cite></strong> more often than I would like
          to admit (though mostly Aram)...
        </p>
        <div className="gaming-widgets">
          <article className="gaming-widget">
            <h3>Clash Royale</h3>
            <p className="gaming-widget-label">Trophies</p>
            <p className="gaming-widget-value" aria-label="Clash Royale trophies">
              {clashRoyale?.status === "ok" ? clashRoyale.data.trophies.toLocaleString() : "—"}
            </p>
            <p className="data-note">
              {clashRoyale?.status === "ok"
                ? "Live player trophies."
                : clashRoyale?.message ?? "Loading live data…"}
            </p>
          </article>
          <article className="gaming-widget">
            <h3>Steam</h3>
            <p className="gaming-widget-label">Recently Played</p>
            <ol className="recently-played-placeholder" aria-label="Steam recently played">
              {steam?.status === "ok" && steam.data.recentlyPlayed.length > 0
                ? steam.data.recentlyPlayed.map((game) => (
                    <li key={game.storeHref}>
                      <a
                        className="text-link"
                        href={game.storeHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {game.name}
                      </a>
                      {game.playtimeMinutes !== null && (
                        <small>{(game.playtimeMinutes / 60).toFixed(1)} h in the last 2 weeks</small>
                      )}
                    </li>
                  ))
                : Array.from({ length: 3 }, (_, index) => <li key={index}>—</li>)}
            </ol>
            <p className="data-note">
              {steam?.status === "ok"
                ? steam.data.recentlyPlayed.length > 0
                  ? "Live from Steam."
                  : "No recently played games."
                : steam?.message ?? "Loading live data…"}
            </p>
          </article>
        </div>
      </section>

      <section className="section" id="collections">
        <h2>Collections</h2>
        <div className="dropdown-list">
          <details className="dropdown-entry">
            <summary>Natural Things</summary>
            <div className="dropdown-content">
              <p className="placeholder-copy">
                I like gardening and plant-keeping, so I collect dried flowers and press them sometimes also. I also like collecting rocks and fossils. Catch me at the beach with a hammer just throwing shale around. 
              </p>
              <div className="media-placeholder media-placeholder--gallery">
                Photo gallery placeholder
              </div>
            </div>
          </details>
          <details className="dropdown-entry">
            <summary>Scrapbook</summary>
            <div className="dropdown-content">
              <p className="placeholder-copy">
                I hoard (and organize) a bunch of junk and like making scrapbooks with it. Everything has sentimental value! Here are some pages I like in particular.
              </p>
              <div className="media-placeholder media-placeholder--photo">Photo placeholder</div>
            </div>
          </details>
          <details className="dropdown-entry">
            <summary>Pokémon Cards</summary>
            <div className="dropdown-content">
              <p className="placeholder-copy">
                Here are some of my favourite Pokémon cards from my collection! You're just going to have to trust that I actually have them.
              </p>
              <PokemonCardWheel />
            </div>
          </details>
        </div>
      </section>

      <section className="section" id="food">
        <h2>Food</h2>
        <p className="placeholder-copy">
          I'm a big snacker, and tend to eat more of appetizers and starters rather than fully balanced meals... 
          My family is from Chengdu, so I grew up eating Sichuan cuisine and naturally have a strong comfort attachment to snacks like jelly noodles, bell dumplings, and sour+spicy noodles.
          However, I make an effort to try all sorts of foods and have found that I also really enjoy udon, laugenstange, italian sandwiches, and french-style beef tartare. 
        </p>
        <details className="dropdown-entry food-photo-dropdown">
          <summary>Photos</summary>
          <div className="dropdown-content">
            <div className="media-placeholder media-placeholder--gallery">
              Photo gallery placeholder
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}

export function Portfolio() {
  const [mode, setMode] = useState<Mode>("serious");

  useEffect(() => {
    try {
      const storedMode = window.localStorage.getItem(storedModeKey);
      if (storedMode === "serious" || storedMode === "fun") {
        setMode(storedMode);
      }
    } catch {
      // Keep Main Quest as the default when browser storage is unavailable.
    }
  }, []);

  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    try {
      window.localStorage.setItem(storedModeKey, nextMode);
    } catch {
      // Mode switching still works for the current page without browser storage.
    }
  }

  function switchMode() {
    const nextMode: Mode = mode === "serious" ? "fun" : "serious";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const applyMode = () => {
      selectMode(nextMode);
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
            onClick={() => selectMode("serious")}
          >
            同同
          </a>
          <div className="topbar-actions">
            <button
              type="button"
              className="text-btn mode-switch"
              onClick={switchMode}
              aria-label={`Switch to ${mode === "serious" ? "Side Quests" : "Main Quest"}`}
            >
              {mode === "serious" ? "Side Quests" : "Main Quest"}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <NightSky />

      <main className={`container layout mode-${mode}`}>
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
                  <ExternalLinkIcon />
                </a>
              </>
            ) : "nic / nickel / nickels / nnickels / nnickelsj"}
          </p>
          <div className="hero-description">
            {mode === "serious" ? (
              <>
                <p>
                  Hello! I'm Nicole, an Astronomy and Physics Specialist student at the University
                  of Toronto. My research interests include galaxy formation and evolution,
                  observational cosmology, early universe physics, and stellar remnants. Below is a
                  quick overview of my academic profile. Feel free to reach out via email or connect
                 on LinkedIn :))
                </p>

              </>
            ) : (
              <p>
                Hi!! It's Nicole again. Outside of astrophysics and career-goal-adjacent stuff, I'm
                very interested in philosophy (namely metaphysics and epistemology, though
                intersectional questions are my favourite). I have many interests, collections,
                and hobbies I'd like to share with you in this mode... Please enjoy!
              </p>
            )}
          </div>
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
