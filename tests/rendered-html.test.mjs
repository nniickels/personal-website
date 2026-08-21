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
  assert.match(html, /rel="icon"[^>]*href="\/favicon\.svg\?v=2"[^>]*type="image\/svg\+xml"/i);
  assert.match(html, /rel="icon"[^>]*href="\/favicon-32\.png\?v=2"[^>]*sizes="32x32"/i);
  assert.match(html, /rel="apple-touch-icon"[^>]*href="\/apple-touch-icon\.png\?v=2"/i);
  assert.match(html, /<h1[^>]*>Nicole Jiang<\/h1>/i);
  assert.match(html, /aria-label="LinkedIn"/i);
  assert.match(html, /aria-label="GitHub"/i);
  assert.match(html, /aria-label="Email"/i);
  assert.doesNotMatch(html, /aria-label="Google Maps"|aria-label="Pinterest"|aria-label="Spotify"|aria-label="Instagram"/i);
  assert.match(html, /class="[^"]*theme-toggle[^"]*"/i);
  assert.match(html, />Side Quests<\/button>/i);
  assert.match(html, /aria-label="Nicole Jiang home"[^>]*>\s*同同\s*<\/a>/i);
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

  const favicon = await readFile(new URL("../public/favicon.svg", import.meta.url), "utf8");
  assert.match(favicon, /<title>同<\/title>/);
  assert.doesNotMatch(favicon, /<text|font-family/);
  assert.match(favicon, /fill="#fff"/);
  assert.match(favicon, /stroke="#000"/);

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
  assert.match(source, /Lifetime rankings by listening time, via stats\.fm\./);
  assert.match(source, /Now playing preview of\.\.\./);
  assert.match(source, /className="listening-cover-wheel"[\s\S]*?aria-haspopup="dialog"/);
  assert.match(source, /className="listening-cover-expanded-link"[\s\S]*?target="_blank"/);
  assert.match(source, /aria-label="Track preview volume"/);
  assert.match(source, /<output>\{Math\.round\(volume \* 100\)\}%<\/output>/);
  assert.match(source, /<ListeningCoverWheel \/>[\s\S]*?Text placeholder\.[\s\S]*?className="listening-rankings"/);
  assert.match(source, /useState\(0\)/);
  assert.match(source, /onMouseEnter=\{\(\) => void playPreview\(index\)\}/);
  assert.match(source, /audio\.muted = nextVolume === 0/);
  assert.equal((source.match(/https:\/\/p\.scdn\.co\/mp3-preview\//g) ?? []).length, 10);
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
  ]) {
    assert.match(source, new RegExp(trackId));
  }

  const statsSource = await readFile(new URL("../src/api-stats.ts", import.meta.url), "utf8");
  assert.match(statsSource, /api\.stats\.fm\/api\/v1\/users\/nnickels\/top/);
  assert.match(statsSource, /range=lifetime&orderBy=TIME/);
  assert.match(statsSource, /genres[\s\S]*?slice\(0, 5\)/);
  assert.doesNotMatch(statsSource, /api\.spotify\.com\/v1\/me\/top/);
  assert.doesNotMatch(source, /\}\s*hr`/);

  const collectionSubsections = ["Natural Things", "Scrapbook", "Pokémon Cards"].map((label) =>
    source.indexOf(`<summary>${label}</summary>`),
  );
  collectionSubsections.forEach((position) => assert.notEqual(position, -1));
  assert.deepEqual(collectionSubsections, [...collectionSubsections].sort((a, b) => a - b));

  assert.match(source, /The Book of Laughter and Forgetting/);
  assert.match(source, /Batman: Arkham Knight/);
  assert.match(source, /className="text-link"[\s\S]*?href="https:\/\/store\.steampowered\.com\/app\/208650\/Batman_Arkham_Knight\/"/);
  assert.match(source, /className="text-link"[\s\S]*?href="https:\/\/store\.steampowered\.com\/app\/2240620\/UNBEATABLE\/"/);
  assert.match(source, /<h3>Clash Royale<\/h3>/);
  assert.match(source, /<p className="gaming-widget-label">Trophies<\/p>/);
  assert.match(source, /clashRoyale\.data\.trophies\.toLocaleString\(\)/);
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
    /<details className="dropdown-entry photo-gallery-dropdown">[\s\S]*?<summary>[\s\S]*?<h2>Photo Gallery<\/h2>[\s\S]*?I like taking photos![\s\S]*?Pinterest monthly viewers[\s\S]*?Photo gallery placeholder[\s\S]*?<\/details>/,
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
  for (const cardId of ["49478", "41668", "41665", "39747"]) {
    assert.match(source, new RegExp(`https://www\\.tcgcollector\\.com/cards/${cardId}/`));
  }
  const requestedCardOrder = [
    "M Scizor-EX (Rage of the Broken Heavens 058/080)",
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
  assert.equal((source.match(/<details className="dropdown-entry">/g) ?? []).length, 3);

  const cardAssets = await readdir(new URL("../public/pokemon-cards/", import.meta.url));
  assert.equal(cardAssets.length, 15);
  for (const asset of cardAssets) {
    const card = await readFile(new URL(`../public/pokemon-cards/${asset}`, import.meta.url));
    assert.ok(card.length > 10_000);
  }

  const coverAssets = await readdir(new URL("../public/music-covers/", import.meta.url));
  assert.equal(coverAssets.length, 10);
  for (const asset of coverAssets) {
    const cover = await readFile(new URL(`../public/music-covers/${asset}`, import.meta.url));
    assert.ok(cover.length > 10_000);
  }

  const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.fun-content\s*\{[\s\S]*?gap:\s*2rem/i);
  assert.match(
    css,
    /\.listening-rankings\s*\{[\s\S]*?columns:\s*3 13rem[\s\S]*?column-fill:\s*balance/i,
  );
  assert.match(css, /\.listening-cover-wheel\s*\{[\s\S]*?display:\s*flex[\s\S]*?overflow-x:\s*auto/i);
  assert.match(css, /\.listening-cover-thumbnail:hover[\s\S]*?box-shadow:[\s\S]*?translateY\(-7px\)/i);
  assert.match(css, /\.listening-volume\s*\{[\s\S]*?grid-template-columns:\s*auto 112px auto[\s\S]*?width:\s*max-content/i);
  assert.match(css, /\.listening-volume output\s*\{[\s\S]*?text-align:\s*left/i);
  assert.match(css, /\.mode-content\s*\{[\s\S]*?padding-bottom:\s*4rem/i);
  assert.match(css, /\.gaming-widget h3\s*\{[\s\S]*?color:\s*var\(--muted\)/i);
  assert.match(css, /\.pokemon-card-wheel\s*\{[\s\S]*?display:\s*flex[\s\S]*?overflow-x:\s*auto/i);
  assert.match(css, /\.pokemon-card-lightbox,\s*\.listening-cover-lightbox\s*\{[\s\S]*?position:\s*fixed[\s\S]*?backdrop-filter:\s*blur/i);
  assert.match(css, /\.dropdown-entry summary::before\s*\{[\s\S]*?border-bottom/i);
  assert.doesNotMatch(css, /\.dropdown-entry summary::after\s*\{[\s\S]*?content:\s*"\+"/i);
});

test("publishes a clearly labeled Pinterest privacy policy", async () => {
  const portfolio = await readFile(new URL("../src/app/portfolio.tsx", import.meta.url), "utf8");
  const privacy = await readFile(new URL("../src/app/privacy/page.tsx", import.meta.url), "utf8");

  assert.match(portfolio, /Privacy Policy/);
  assert.match(privacy, /title: "Privacy Policy \| Nicole Jiang"/);
  assert.match(privacy, /<h1>Privacy Policy<\/h1>/);
  assert.match(privacy, /Pinterest data/);
  assert.match(privacy, /monthly viewer count/);
  assert.match(privacy, /encrypted Cloudflare Worker secrets/);
  assert.match(privacy, /Access, deletion, and revocation/);
  assert.match(privacy, /nicolejiang9474@gmail\.com/);
});
