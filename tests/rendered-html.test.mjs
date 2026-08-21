import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders Nicole Jiang's homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Nicole Jiang<\/title>/i);
  assert.match(html, /property="og:title"[^>]*content="Nicole Jiang"/i);
  assert.match(html, /property="og:image"[^>]*content="https:\/\/nicolejiang\.com\/og\.png\?v=7"/i);
  assert.match(html, /property="og:image:width"[^>]*content="1200"/i);
  assert.match(html, /property="og:image:height"[^>]*content="630"/i);
  assert.match(html, /name="twitter:card"[^>]*content="summary_large_image"/i);
  assert.match(html, /rel="canonical"[^>]*href="https:\/\/nicolejiang\.com\/?"/i);
  assert.match(html, /rel="icon"[^>]*href="\/favicon-32\.png\?v=3"[^>]*sizes="32x32"/i);
  assert.match(html, /rel="apple-touch-icon"[^>]*href="\/apple-touch-icon\.png\?v=3"/i);
  assert.doesNotMatch(html, /favicon\.svg/i);
  assert.match(html, /<h1[^>]*>Nicole Jiang<\/h1>/i);
  assert.match(html, /aria-label="LinkedIn"/i);
  assert.match(html, /aria-label="GitHub"/i);
  assert.match(html, /aria-label="Email"/i);
  assert.doesNotMatch(html, /aria-label="Google Maps"|aria-label="Pinterest"|aria-label="Spotify"|aria-label="Instagram"/i);
  assert.match(html, /class="[^"]*theme-toggle[^"]*"/i);
  assert.match(html, />Side Quests<\/button>/i);
  assert.match(html, /aria-label="Nicole Jiang home"[^>]*>[\s\S]*?tong-calligraphy\.png[\s\S]*?tong-calligraphy\.png[\s\S]*?<\/a>/i);
  assert.doesNotMatch(html, />\s*同同\s*<\/a>/i);
  assert.match(html, /astrophysics undergrad @ uoft/i);
  assert.match(html, /href="\/resume\.pdf"[^>]*target="_blank"[\s\S]*?class="external-link-icon"/i);
  assert.match(html, /src="\/university-of-toronto\.png"/i);
  assert.match(html, /src="\/ontario-science-centre\.png"/i);
  assert.match(html, /Ontario Science Centre Science School/i);
  assert.match(html, /Feb 2024 - Jun 2024/i);
  assert.match(html, /<h2>Research &amp; Technical Projects<\/h2>/i);
  assert.match(html, /<h2>Service &amp; Leadership<\/h2>/i);
  assert.match(html, /University of Toronto/i);
  assert.match(html, /class="project-description"/i);
  assert.match(html, /Predicting APA Site Choice from mRNA Sequences[\s\S]*?class="external-link-icon"/i);
  assert.match(html, /Royal Astronomical Society of Canada/i);
  assert.match(html, /Ontario Science Centre/i);
  assert.match(html, /class="service-description"/i);
  assert.doesNotMatch(html, /<ul\b/i);
  assert.match(html, /theme-icon__sun/i);
  assert.match(html, /class="night-sky" aria-hidden="true"/i);
  assert.equal((html.match(/class="night-star"/g) ?? []).length, 72);
  assert.equal((html.match(/class="shooting-star"/g) ?? []).length, 3);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("keeps the animated starfield dark-mode-only and motion-safe", async () => {
  const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(css, /:root\[data-theme="light"\] \.night-sky\s*\{[\s\S]*?visibility:\s*hidden/i);
  assert.match(css, /@keyframes night-star-twinkle/i);
  assert.match(css, /@keyframes shooting-star-flight/i);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.shooting-star\s*\{[\s\S]*?display:\s*none/i);
});

test("follows live device color-scheme changes", async () => {
  const toggle = await readFile(new URL("../src/app/theme-toggle.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8");

  assert.match(toggle, /matchMedia\("\(prefers-color-scheme: dark\)"\)/);
  assert.match(toggle, /addEventListener\("change", handleSystemThemeChange\)/);
  assert.match(toggle, /overrideTheme && overrideTheme !== nextSystemTheme/);
  assert.match(toggle, /localStorage\.removeItem\(storedThemeKey\)/);
  assert.match(toggle, /setTheme\(nextSystemTheme\)/);
  assert.match(layout, /portfolio-theme-override/);
});

test("does not publish separate résumé or CV pages", async () => {
  for (const pathname of ["/resume", "/cv"]) {
    const response = await render(pathname);
    assert.equal(response.status, 404);
  }
});

test("publishes the résumé, education logos, and single-character favicon", async () => {
  const resume = await readFile(new URL("../public/resume.pdf", import.meta.url));
  assert.equal(resume.subarray(0, 5).toString(), "%PDF-");

  for (const asset of ["university-of-toronto.png", "ontario-science-centre.png"]) {
    const logo = await readFile(new URL(`../public/${asset}`, import.meta.url));
    assert.deepEqual([...logo.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  }

  const scienceCentreLogo = await readFile(
    new URL("../public/ontario-science-centre.png", import.meta.url),
  );
  assert.equal(scienceCentreLogo.readUInt32BE(16), 940);
  assert.equal(scienceCentreLogo.readUInt32BE(20), 360);

  for (const asset of ["favicon-32.png", "apple-touch-icon.png"]) {
    const icon = await readFile(new URL(`../public/${asset}`, import.meta.url));
    assert.deepEqual([...icon.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  }

  const ico = await readFile(new URL("../public/favicon.ico", import.meta.url));
  assert.deepEqual([...ico.subarray(0, 4)], [0, 0, 1, 0]);
});

test("keeps the Side Quests interest sections and stats in the requested order", async () => {
  const source = await readFile(new URL("../src/app/portfolio.tsx", import.meta.url), "utf8");
  const headings = [
    "<h2>Photo Gallery</h2>",
    "<h2>Listening</h2>",
    "<h2>Reading</h2>",
    "<h2>Watching</h2>",
    "<h2>Gaming</h2>",
    "<h2>Collections</h2>",
    "<h2>Food</h2>",
  ];
  const positions = headings.map((heading) => source.indexOf(heading));

  positions.forEach((position) => assert.notEqual(position, -1));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.doesNotMatch(source, /<h2>Pinterest<\/h2>|<h2>Music<\/h2>|<h2>Other Media<\/h2>/);

  for (const label of ["Top 5 Genres", "Top 10 Artists", "Top 10 Tracks"]) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /And here are my lifetime listening statistics by time \(in hours\) via stats\.fm!/);
  assert.match(source, /Now playing preview of\.\.\./);
  assert.match(source, /className="cover-instruction-hover">Hover a cover<\/span>/);
  assert.match(source, /className="cover-instruction-tap">Hold to preview, tap to expand<\/span>/);
  assert.match(source, /className="listening-cover-wheel"[\s\S]*?aria-haspopup="dialog"/);
  assert.match(source, /className="listening-cover-expanded-link"[\s\S]*?target="_blank"/);
  assert.match(source, /aria-label="Track preview volume"/);
  assert.match(source, /<output>\{Math\.round\(volume \* 100\)\}%<\/output>/);
  assert.match(
    source,
    /Here is some music that I enjoy listening to right now![\s\S]*?<ListeningCoverWheel \/>[\s\S]*?And here are my lifetime listening statistics by time \(in hours\) via stats\.fm![\s\S]*?className="listening-rankings"/,
  );
  assert.match(source, /useState\(0\)/);
  assert.match(source, /getEntriesByType\("navigation"\)/);
  assert.match(source, /navigation\?\.type === "navigate"[\s\S]*?setItem\(storedModeKey, "serious"\)/);
  assert.match(source, /getItem\(storedModeKey\)/);
  assert.match(source, /event\.pointerType === "mouse"[\s\S]*?void playPreview\(index\)/);
  assert.match(source, /handleCoverPointerDown[\s\S]*?window\.setTimeout\([\s\S]*?playPreview\(index\)[\s\S]*?, 500\)/);
  assert.match(source, /Math\.hypot[\s\S]*?> 10/);
  assert.match(source, /handleCoverPointerUp[\s\S]*?openTouchTrack\(index\)/);
  assert.match(source, /setPointerCapture\(event\.pointerId\)/);
  assert.match(source, /if \(press\.previewing\)[\s\S]*?resetPreview\(\)/);
  assert.match(source, /onFocus[\s\S]*?Date\.now\(\) - lastTouchAtRef\.current >= 1_000/);
  assert.match(source, /onContextMenu[\s\S]*?event\.preventDefault\(\)/);
  assert.match(source, /keepPlayingRef\.current = true[\s\S]*?void playPreview\(index\)/);
  assert.match(source, /<audio[\s\S]*?loop/);
  assert.match(source, /aria-label="Track preview progress"/);
  assert.match(source, /previewProgress \* 360/);
  assert.match(source, /audio\.currentTime \/ audio\.duration/);
  assert.match(source, /audio\.muted = nextVolume === 0/);
  assert.equal((source.match(/https:\/\/p\.scdn\.co\/mp3-preview\//g) ?? []).length, 17);
  for (const trackId of [
    "24105EgaBPLzZp5kCeSh9g",
    "3YB9cvd668HXBEq8rbBW8P",
    "4aLulnl3GrOQRDtXdoYejP",
    "4bZnIdaGBf162pZEkxXSgQ",
    "0mc51xomEC6CZUZdB8xgQU",
    "20ZvzoDSefcZo6bj10jgGC",
    "4Vie7AYSqfGHEP2uBh0ua5",
    "6ccWXgRMKsX3GjjiYdAlSd",
    "2LMloFiV7DHpBhITOaBSam",
    "0bOvjYU552KSscyA0af4aw",
    "6n9AvpTLSNunpIr2Gr2AXa",
    "0cVaG276BeCnxIxf42puZ1",
    "1XowbeLc27U22ao4MgJKO0",
    "4qTlJH6ZM4sUX39EB9VMFy",
    "6DUKQUhWqUySYngLXLNwP2",
    "7DmtizlT6hVi5Uf1WL6TT3",
    "6JkRuPFjvHLOpMeubjra1Q",
  ]) {
    assert.match(source, new RegExp(trackId));
  }

  const statsSource = await readFile(new URL("../src/api-stats.ts", import.meta.url), "utf8");
  assert.match(statsSource, /api\.stats\.fm\/api\/v1\/users\/nnickels\/top/);
  assert.match(statsSource, /range=lifetime&orderBy=TIME/);
  assert.match(statsSource, /genres[\s\S]*?slice\(0, 5\)/);
  assert.doesNotMatch(statsSource, /api\.spotify\.com\/v1\/me\/top/);
  assert.doesNotMatch(source, /\}\s*hr`/);

  const collectionSubsections = [
    "<summary>Natural Things</summary>",
    "<summary>Scrapbook</summary>",
    "<h3>Pokémon Cards</h3>",
  ].map((markup) => source.indexOf(markup));
  collectionSubsections.forEach((position) => assert.notEqual(position, -1));
  assert.deepEqual(collectionSubsections, [...collectionSubsections].sort((a, b) => a - b));

  assert.match(source, /The Book of Laughter and Forgetting/);
  assert.match(source, /Batman: Arkham Knight/);
  assert.match(source, /className="text-link"[\s\S]*?href="https:\/\/store\.steampowered\.com\/app\/208650\/Batman_Arkham_Knight\/"/);
  assert.match(source, /className="text-link"[\s\S]*?href="https:\/\/store\.steampowered\.com\/app\/2240620\/UNBEATABLE\/"/);
  assert.match(source, /<h3>Clash Royale<\/h3>/);
  assert.match(source, /<p className="gaming-widget-label">Trophies<\/p>/);
  assert.match(source, /clashRoyale\.data\.trophies\.toLocaleString\(\)/);
  assert.match(source, /className="clash-player-name">nickel<\/span>/);
  assert.match(source, /className="clash-player-tag">#PP0U9GRVL<\/span>/);
  assert.match(statsSource, /const playerTag = "#PP0U9GRVL"/);
  assert.match(statsSource, /Boolean\(env\.CLASH_ROYALE_API_TOKEN\)/);
  assert.match(source, /<h3>Steam<\/h3>/);
  assert.match(source, /<p className="gaming-widget-label">Recently Played<\/p>/);
  assert.match(source, /No games played in the last \{steam\.data\.windowDays\} days\./);
  assert.match(statsSource, /windowDays: 14/);
  assert.match(source, /href="https:\/\/www\.youtube\.com\/@JacobGeller"/);
  assert.match(source, /href="https:\/\/www\.youtube\.com\/@DarylTalksGames"/);
  assert.match(source, /I like gardening and plant-keeping/);
  assert.match(source, /I hoard \(and organize\) a bunch of junk/);
  assert.match(source, /Here are some of my favourite Pokémon cards from my collection!/);
  assert.match(
    source,
    /<details className="dropdown-entry photo-gallery-dropdown">[\s\S]*?<summary>[\s\S]*?<h2>Photo Gallery<\/h2>[\s\S]*?I like taking photos![\s\S]*?Photo gallery placeholder[\s\S]*?<\/details>/,
  );
  assert.doesNotMatch(source, /Pinterest monthly viewers|stats\?\.pinterest/);
  assert.match(
    source,
    /I like taking photos! Find me on[\s\S]*?className="text-link photo-pinterest-link"[\s\S]*?href="https:\/\/ca\.pinterest\.com\/nnickelsj\/"[\s\S]*?<strong>Pinterest<\/strong>[\s\S]*?<ExternalLinkIcon \/>/,
  );
  assert.match(
    source,
    /const funLinks[\s\S]*?name: "Pinterest"[\s\S]*?name: "Spotify"[\s\S]*?name: "Instagram"[\s\S]*?name: "Google Maps"/,
  );
  assert.match(source, /Photo gallery placeholder/);
  assert.equal((source.match(/Photo gallery placeholder/g) ?? []).length, 3);
  assert.match(
    source,
    /<section className="section" id="food">[\s\S]*?<details className="dropdown-entry food-photo-dropdown">[\s\S]*?<summary>Photos<\/summary>[\s\S]*?Photo gallery placeholder[\s\S]*?<\/details>/,
  );
  assert.match(source, /Photo placeholder/);
  assert.doesNotMatch(source, /Photo scroll wheel placeholder/);
  assert.equal((source.match(/https:\/\/www\.tcgcollector\.com\/cards\//g) ?? []).length, 15);
  for (const cardId of ["49478", "41668", "41665", "39747", "7819", "8501", "8544"]) {
    assert.match(source, new RegExp(`https://www\\.tcgcollector\\.com/cards/${cardId}/`));
  }
  const requestedCardOrder = [
    "M Scizor-EX (BREAKpoint 77/122)",
    "M Scizor-EX (BREAKpoint 120/122)",
    "Team Rocket's Houndoom (The Glory of Team Rocket 100/098)",
    "Garchomp & Giratina-GX (Tag Team Collection 128/205)",
    "Lilligant (Black Bolt 092/086)",
    "Lapras (VSTAR Universe 177/172)",
    "Caterpie (Pokémon Card 151 172/165)",
    "Psyduck (Pokémon Card 151 175/165)",
    "Corviknight V (VMAX Climax 248/184)",
  ].map((name) => source.indexOf(`name: "${name}"`));
  requestedCardOrder.forEach((position) => assert.notEqual(position, -1));
  assert.deepEqual(requestedCardOrder, [...requestedCardOrder].sort((a, b) => a - b));
  assert.match(source, /className="pokemon-card-wheel"[\s\S]*?aria-haspopup="dialog"/);
  assert.match(source, /className="pokemon-card-dialog"[\s\S]*?role="dialog"/);
  assert.match(source, /className="pokemon-card-expanded-link"[\s\S]*?target="_blank"/);
  assert.match(source, /event\.key === "Escape"/);
  assert.equal((source.match(/<details className="dropdown-entry">/g) ?? []).length, 2);
  assert.match(source, /<div className="collection-static-entry">[\s\S]*?<h3>Pokémon Cards<\/h3>[\s\S]*?<PokemonCardWheel \/>/);
  assert.doesNotMatch(source, /<summary>Pokémon Cards<\/summary>/);

  const cardAssets = await readdir(new URL("../public/pokemon-cards/", import.meta.url));
  assert.equal(cardAssets.length, 15);
  for (const asset of cardAssets) {
    const card = await readFile(new URL(`../public/pokemon-cards/${asset}`, import.meta.url));
    assert.ok(card.length > 10_000);
  }

  const coverAssets = await readdir(new URL("../public/music-covers/", import.meta.url));
  assert.equal(coverAssets.length, 17);
  for (const asset of coverAssets) {
    const cover = await readFile(new URL(`../public/music-covers/${asset}`, import.meta.url));
    assert.ok(cover.length > 10_000);
  }

  const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.fun-content\s*\{[\s\S]*?gap:\s*2rem/i);
  assert.match(
    css,
    /\.listening-rankings\s*\{[\s\S]*?columns:\s*3 13rem[\s\S]*?column-fill:\s*balance[\s\S]*?margin-top:\s*0\.85rem/i,
  );
  assert.match(css, /\.listening-cover-wheel\s*\{[\s\S]*?display:\s*flex[\s\S]*?overflow-x:\s*auto/i);
  assert.match(css, /\.listening-cover-thumbnail:hover[\s\S]*?box-shadow:[\s\S]*?translateY\(-7px\)/i);
  assert.match(css, /\.listening-cover-thumbnail\s*\{[\s\S]*?touch-action:\s*pan-x pan-y[\s\S]*?user-select:\s*none/i);
  assert.match(css, /\.listening-preview-heading \.listening-preview-prompt\s*\{[\s\S]*?color:\s*var\(--muted\)/i);
  assert.match(css, /@media \(hover: none\), \(pointer: coarse\)[\s\S]*?\.cover-instruction-hover[\s\S]*?display:\s*none[\s\S]*?\.cover-instruction-tap[\s\S]*?display:\s*inline/i);
  assert.match(css, /\.listening-preview-heading strong\s*\{[\s\S]*?color:\s*var\(--foreground\)/i);
  assert.match(css, /\.listening-preview-progress\s*\{[\s\S]*?conic-gradient/i);
  assert.doesNotMatch(css, /\.listening-preview-progress\s*\{[\s\S]*?transform:\s*scaleX\(-1\)/i);
  assert.match(css, /\.listening-volume\s*\{[\s\S]*?grid-template-columns:\s*auto 112px auto[\s\S]*?width:\s*max-content/i);
  assert.match(css, /\.listening-volume output\s*\{[\s\S]*?text-align:\s*left/i);
  assert.match(css, /\.mode-content\s*\{[\s\S]*?padding-bottom:\s*4rem/i);
  assert.match(css, /\.gaming-widget h3\s*\{[\s\S]*?color:\s*var\(--muted\)/i);
  assert.match(css, /@media \(max-width: 520px\)[\s\S]*?\.hero h1\s*\{[\s\S]*?white-space:\s*nowrap/i);
  assert.match(css, /@media \(max-width: 520px\)[\s\S]*?\.social-links\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, 1\.72rem\)/i);
  assert.match(css, /\.pokemon-card-wheel\s*\{[\s\S]*?display:\s*flex[\s\S]*?overflow-x:\s*auto/i);
  assert.match(css, /\.pokemon-card-lightbox,\s*\.listening-cover-lightbox\s*\{[\s\S]*?position:\s*fixed[\s\S]*?backdrop-filter:\s*blur/i);
  assert.match(css, /\.dropdown-entry summary::before\s*\{[\s\S]*?border-bottom/i);
  assert.doesNotMatch(css, /\.dropdown-entry summary::after\s*\{[\s\S]*?content:\s*"\+"/i);
});

test("does not publish a privacy-policy page", async () => {
  const portfolio = await readFile(new URL("../src/app/portfolio.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(portfolio, /Privacy Policy|href="\/privacy"/);

  const response = await render("/privacy");
  assert.equal(response.status, 404);
});
