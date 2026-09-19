"use client";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useState } from "react";
import type { PublicStatsResponse } from "../../api-stats";
import { ExternalLinkIcon } from "../icons";
import ListeningCoverWheel from "./music-shelf";
import PokemonCardWheel from "./pokemon-shelf";
import { DeferredGallery } from "./deferred-gallery";
import { listeningRankings, galleryPhotos, naturalThingsPhotos, scrapbookPhotos, foodPhotos, sideQuestNavigationRows } from "./data";
let sideQuestScrollAnimationFrame: number | null = null;
const MAX_ANIMATION_FRAME_INTERVAL_MS = 1_000 / 60;


function animationFrameIsTooSoon(now: number, lastRenderedAt: number | null) {
  return (
    lastRenderedAt !== null &&
    now - lastRenderedAt < MAX_ANIMATION_FRAME_INTERVAL_MS - 0.5
  );
}

function navigateToSideQuestDestination(
  event: ReactMouseEvent<HTMLAnchorElement>,
  href: string,
) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  event.preventDefault();
  const target = document.querySelector(href);
  if (!(target instanceof HTMLElement)) return;

  let dropdown: HTMLDetailsElement | null = null;

  if (target instanceof HTMLDetailsElement) {
    dropdown = target;
  } else if (
    target instanceof HTMLElement
    && target.dataset.expandOnNavigate === "true"
  ) {
    dropdown = target.querySelector<HTMLDetailsElement>(":scope > details");
  }

  if (dropdown instanceof HTMLDetailsElement) {
    dropdown.open = true;
  }

  window.history.replaceState(null, "", href);

  const headerHeight = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--header-height"),
  ) || 48;
  const destination = Math.max(
    0,
    target.getBoundingClientRect().top + window.scrollY - headerHeight - 16,
  );

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, destination);
    return;
  }

  if (sideQuestScrollAnimationFrame !== null) {
    window.cancelAnimationFrame(sideQuestScrollAnimationFrame);
  }

  const start = window.scrollY;
  const distance = destination - start;
  const duration = 260;
  const startedAt = performance.now();
  let lastRenderedAt: number | null = null;

  const animateScroll = (now: number) => {
    if (animationFrameIsTooSoon(now, lastRenderedAt)) {
      sideQuestScrollAnimationFrame = window.requestAnimationFrame(animateScroll);
      return;
    }
    lastRenderedAt = now;
    const progress = Math.min((now - startedAt) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    window.scrollTo(0, start + distance * easedProgress);

    if (progress < 1) {
      sideQuestScrollAnimationFrame = window.requestAnimationFrame(animateScroll);
    } else {
      sideQuestScrollAnimationFrame = null;
    }
  };

  sideQuestScrollAnimationFrame = window.requestAnimationFrame(animateScroll);
}

export function FunContent() {
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

  const spotify = stats?.spotify;
  const clashRoyale = stats?.clashRoyale;
  const steam = stats?.steam;

  const formatListeningTime = (playedMs: number) => {
    const hours = playedMs / 3_600_000;
    return hours >= 100 ? Math.round(hours).toLocaleString() : hours.toFixed(1);
  };

  const rankingData = spotify?.status === "ok"
    ? [
        {
          kind: "genres",
          title: "Top 5 Genres",
          count: 5,
          items: spotify.data.genres.map((genre) => ({
            name: genre.name,
            href: null,
            playedMs: genre.playedMs,
          })),
        },
        { kind: "artists", title: "Top 10 Artists", count: 10, items: spotify.data.artists },
        {
          kind: "tracks",
          title: "Top 10 Tracks",
          count: 10,
          items: spotify.data.tracks.map((track) => ({
            name: `${track.name} — ${track.artists.join(", ")}`,
            href: track.href,
            playedMs: track.playedMs,
          })),
        },
      ]
    : listeningRankings.map(({ kind, title, count }) => ({ kind, title, count, items: [] }));

  return (
    <div
      className="mode-content fun-content"
      aria-label="Side Quests content"
    >
      <nav className="side-quest-index" aria-label="Side Quests sections">
        {sideQuestNavigationRows.map((row, rowIndex) => (
          <div className="side-quest-index-row" key={rowIndex}>
            {row.map((item, itemIndex) => (
              <span className="side-quest-index-item" key={item.href}>
                {itemIndex > 0 && <span className="side-quest-index-divider">|</span>}
                <a
                  className="text-link side-quest-index-link"
                  href={item.href}
                  onClick={(event) => navigateToSideQuestDestination(event, item.href)}
                >
                  {item.label}
                </a>
              </span>
            ))}
          </div>
        ))}
      </nav>

      <section className="section" id="photo-gallery" data-expand-on-navigate="true">
        <details className="dropdown-entry photo-gallery-dropdown">
          <summary>
            <h2>Photo Gallery</h2>
            </summary>
          <div className="dropdown-content">
            <p className="placeholder-copy">
              Find me on{" "}
              <a
                className="text-link photo-pinterest-link"
                href="https://ca.pinterest.com/nnickelsj/"
                target="_blank"
                rel="noreferrer"
              >
                <strong>Pinterest</strong>
                <ExternalLinkIcon />
              </a>

            </p>
            <DeferredGallery photos={galleryPhotos} ariaLabel="PhotoGallery" />
          </div>
        </details>
      </section>

      <section className="section" id="listening">
        <h2>Listening</h2>
        <p className="placeholder-copy listening-text-placeholder">
          Here is some music that I enjoy listening to right now!
        </p>
        <ListeningCoverWheel />
        <p className="data-note">
          {spotify?.status === "ok"
            ? "And here are my lifetime listening statistics by time (in hours) via stats.fm! They rarely budge..."
            : spotify?.message ?? "Loading live data…"}
        </p>
        <div className="listening-rankings">
          {rankingData.map(({ kind, title, count, items }) => {
            const rankingList = (
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
                    {items[index] ? (
                      <span className="ranking-time">
                        {formatListeningTime(items[index].playedMs)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            );

            return (
              <article className={`ranking-card ranking-card--${kind}`} key={title}>
                {kind === "tracks" ? (
                  <>
                    <h3>{title}</h3>
                    {rankingList}
                  </>
                ) : (
                  <>
                    <div className="desktop-only">
                      <h3>{title}</h3>
                      {rankingList}
                    </div>
                    <details className="dropdown-entry mobile-only">
                      <summary><h3>{title}</h3></summary>
                      {rankingList}
                    </details>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="section" id="reading">
        <h2>Reading</h2>
        <ul className="mobile-only interest-list placeholder-copy">
          <li><strong><cite>The Book of Laughter and Forgetting</cite></strong> — Milan Kundera (Michael Henry Heim translation)</li>
          <li><strong><cite>Personal Identity</cite></strong> — Derek Parfit (1971)</li>
          <li><a className="text-link" href="https://falseknees.com/about.html" target="_blank" rel="noreferrer"><strong>Joshua Barkman’s works</strong></a></li>
        </ul>
        <p className="placeholder-copy desktop-only">
          My current favourite book is{" "}
          <strong><cite>The Book of Laughter and Forgetting</cite></strong> by Milan Kundera (Michael Henry Heim translation).
          I like his essayistic prose and enjoy reading other books within the realm of literary fiction, philosophical fiction,
          and surrealism. As for papers, I recently read Derek Parfit's 1971 paper on personal identity and took a liking to his theory.
          More casually, I like to read comics and manga also. Some favourites include the{" "}
          <strong><cite>House of Slaughter Vol. 2</cite></strong> and the <strong><cite>Heaven's Design Team</cite></strong> series. I'm also a big fan of all of{""} <strong><cite><a className="text-link" href="https://falseknees.com/about.html" target="_blank" rel="noreferrer">
                Joshua Barkman
              </a></cite></strong>{""}'s works!
        </p>
        </section>

      <section className="section" id="watching">
        <h2>Watching</h2>
        <ul className="mobile-only interest-list placeholder-copy">
          <li><a className="text-link" href="https://www.youtube.com/@JacobGeller" target="_blank" rel="noreferrer"><strong>Jacob Geller</strong></a></li>
          <li><a className="text-link" href="https://www.youtube.com/@DarylTalksGames" target="_blank" rel="noreferrer"><strong>Daryl Talks Games</strong></a></li>
          <li><strong><cite>Mononoke</cite></strong> (2007)</li>
          <li><strong><cite>BoJack Horseman</cite></strong></li>
        </ul>
        <p className="placeholder-copy desktop-only">
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
          If you like video essays about video games and/or philosophy and psychology, I highly recommend! I also really like{" "}
          <strong><cite>BoJack Horseman</cite></strong> and the 2007 anime <strong><cite>Mononoke</cite></strong>.
        </p>
      </section>

      <section className="section" id="gaming">
        <h2>Gaming</h2>
        <ul className="mobile-only interest-list placeholder-copy">
          <li><a className="text-link" href="https://store.steampowered.com/app/208650/Batman_Arkham_Knight/" target="_blank" rel="noreferrer"><strong><cite>Batman: Arkham Knight</cite></strong></a></li>
          <li><a className="text-link" href="https://store.steampowered.com/app/2240620/UNBEATABLE/" target="_blank" rel="noreferrer"><strong><cite>UNBEATABLE</cite></strong></a></li>
          <li><strong><cite>Minecraft</cite></strong></li>
          <li><strong><cite>League of Legends</cite></strong></li>
        </ul>
        <p className="placeholder-copy desktop-only">
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
                ? <>
                    <span className="clash-player-name">nickel</span>{" "}
                    <span className="clash-player-tag">#PP0U9GRVL</span>
                  </>
                : clashRoyale?.message ?? "Loading live data…"}
            </p>
          </article>
          <article className="gaming-widget">
            <h3>Steam</h3>
            <p className="gaming-widget-label">Recently Played</p>
            {steam?.status === "ok" && steam.data.recentlyPlayed.length === 0 ? (
              <p className="steam-empty-state">
                No games played in the last {steam.data.windowDays} days.
              </p>
            ) : (
              <>
                <ol className="recently-played-placeholder" aria-label="Steam recently played">
                  {steam?.status === "ok"
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
                      </li>
                    ))
                    : Array.from({ length: 3 }, (_, index) => <li key={index}>—</li>)}
                </ol>
                {steam?.status === "ok" && steam.data.recentlyPlayed.length < 3 && (
                  <p className="steam-empty-state">
                    No other games played in the past {steam.data.windowDays} days.
                  </p>
                )}
              </>
            )}
            <p className="data-note">
              {steam?.status === "ok"
                ? ""
                : steam?.message ?? "Loading live data…"}
            </p>
          </article>
        </div>
      </section>

      <section className="section" id="collections">
        <h2>Collections</h2>
        <div className="dropdown-list">
          <details className="dropdown-entry" id="natural-things">
            <summary>Natural Things</summary>
            <div className="dropdown-content">
              <p className="placeholder-copy">
                I like gardening and plant-keeping, so I collect dried flowers and press them sometimes also. I also like collecting rocks and fossils. Catch me at the beach with a hammer just throwing shale around.
              </p>
              <DeferredGallery photos={naturalThingsPhotos} ariaLabel="NaturalThingsGallery" desktopColumns={6} />
            </div>
          </details>
          <details className="dropdown-entry" id="scrapbook">
            <summary>Scrapbook</summary>
            <div className="dropdown-content">
              <p className="placeholder-copy">
                I hoard (and organize) a bunch of junk and like making scrapbooks with it. Everything has sentimental value! Here are some pages I like in particular.
              </p>
              <DeferredGallery photos={scrapbookPhotos} ariaLabel="ScrapbookGallery" desktopColumns={3} />
            </div>
          </details>
          <div className="collection-static-entry" id="pokemon-cards">
            <h3>Pokémon Cards</h3>
            <div className="dropdown-content">
              <p className="placeholder-copy">
                Here are some of my favourite Pokémon cards from my collection! You're just going to have to trust that I actually have them.
              </p>
              <PokemonCardWheel />
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="food" data-expand-on-navigate="true">
        <h2>Food</h2>
        <p className="placeholder-copy desktop-only">
          I'm a big snacker, and tend to eat more appetizers and starters than fully balanced meals...
          My family is from Chengdu, so I grew up eating Sichuan cuisine and naturally have a strong comfort attachment to snacks like jelly noodles, bell dumplings, and sour+spicy noodles.
          However, I've been making an effort to try all sorts of foods and have found that I also really enjoy udon, laugenstange, Italian sandwiches, and French-style beef tartare!

        </p>
        <details className="dropdown-entry food-photo-dropdown">
          <summary>Photos</summary>
          <div className="dropdown-content">
            <DeferredGallery photos={foodPhotos} ariaLabel="FoodPhotoGallery" />
          </div>
        </details>
      </section>
    </div>
  );
}
