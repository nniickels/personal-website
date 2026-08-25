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
  assert.match(html, /name="robots"[^>]*content="index, follow"/i);
  assert.match(html, /type="application\/ld\+json"[^>]*>[\s\S]*?"@type":"ProfilePage"/i);
  assert.match(html, /"name":"Nicole Jiang"/i);
  assert.doesNotMatch(html, /property="og:|name="twitter:/i);
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
  assert.match(html, /href="\/playground"[^>]*>Playground<\/a>/i);
  assert.match(html, /href="\/side-quests"[^>]*>Side Quests<\/a>/i);
  assert.ok(html.indexOf(">Playground</a>") < html.indexOf(">Side Quests</a>"));
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
  assert.equal((html.match(/class="night-star"/g) ?? []).length, 79);
  assert.equal((html.match(/class="shooting-star"/g) ?? []).length, 3);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("publishes search-engine discovery files", async () => {
  const robotsResponse = await render("/robots.txt");
  assert.equal(robotsResponse.status, 200);
  const robots = await robotsResponse.text();
  assert.match(robots, /User-Agent:\s*\*/i);
  assert.match(robots, /Allow:\s*\//i);
  assert.match(robots, /Sitemap:\s*https:\/\/nicolejiang\.com\/sitemap\.xml/i);

  const sitemapResponse = await render("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  assert.match(sitemap, /<loc>https:\/\/nicolejiang\.com\/<\/loc>/i);
  assert.match(sitemap, /<loc>https:\/\/nicolejiang\.com\/side-quests<\/loc>/i);
  assert.match(sitemap, /<loc>https:\/\/nicolejiang\.com\/playground<\/loc>/i);
});

test("keeps the animated starfield dark-mode-only and motion-safe", async () => {
  const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
  const source = await readFile(new URL("../src/app/portfolio.tsx", import.meta.url), "utf8");
  assert.match(css, /:root\[data-theme="light"\] \.night-sky\s*\{[\s\S]*?visibility:\s*hidden/i);
  assert.match(css, /\.night-star::before,\s*\.night-star::after\s*\{/i);
  assert.match(css, /\.night-star\s*\{[\s\S]*?clip-path:\s*polygon\([\s\S]*?50% 0[\s\S]*?100% 50%[\s\S]*?50% 100%[\s\S]*?0 50%/i);
  assert.match(css, /\.night-star::before\s*\{[\s\S]*?height:\s*calc\(100% \+ 8px\)[\s\S]*?46%[\s\S]*?54%/i);
  assert.match(css, /\.night-star::after\s*\{[\s\S]*?width:\s*calc\(100% \+ 8px\)[\s\S]*?46%[\s\S]*?54%/i);
  assert.match(css, /background:\s*var\(--star-color/i);
  assert.match(source, /"--star-color":\s*star\.colour/i);
  assert.match(source, /createNightStars\(79, 7\)/i);
  assert.match(source, /isLeftEdgeStar[\s\S]*?36 \+ random\(\) \* 52[\s\S]*?15 \+ random\(\) \* 35/i);
  assert.match(source, /#dceaff[\s\S]*#fff0cf[\s\S]*#ffd2ad/i);
  assert.match(source, /colourRoll < 0\.38[\s\S]*colourRoll < 0\.62[\s\S]*colourRoll < 0\.83/i);
  assert.match(source, /sizeRoll\s*<\s*0\.82[\s\S]*sizeRoll\s*<\s*0\.96/i);
  assert.match(source, /2\.4 \+ random\(\) \* 2\.4[\s\S]*5\.4 \+ random\(\) \* 3[\s\S]*8\.5 \+ random\(\) \* 3/i);
  assert.match(source, /"--shoot-color":\s*star\.colour/i);
  assert.match(source, /#edf4ff[\s\S]*#ffe5bb[\s\S]*#d6ffe1/i);
  assert.match(css, /background:\s*var\(--shoot-color/i);
  assert.match(css, /@keyframes night-star-twinkle/i);
  assert.match(css, /@keyframes shooting-star-flight/i);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.shooting-star\s*\{[\s\S]*?display:\s*none/i);
});

test("keeps the phone layout compact without changing wider breakpoints", async () => {
  const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
  const source = await readFile(new URL("../src/app/portfolio.tsx", import.meta.url), "utf8");

  assert.match(
    css,
    /@media \(max-width: 520px\) \{[\s\S]*?\.layout\.container\s*\{[\s\S]*?width:\s*calc\(100% - 1\.25rem\)/,
  );
  assert.match(css, /@media \(max-width: 520px\) \{[\s\S]*?\.hero h1\s*\{[\s\S]*?font-size:\s*clamp\(2rem, 10vw, 2\.25rem\)/);
  assert.match(css, /@media \(max-width: 520px\) \{[\s\S]*?\.listening-cover-wheel-item\s*\{[\s\S]*?flex-basis:\s*88px/);
  assert.match(css, /@media \(max-width: 520px\) \{[\s\S]*?\.pokemon-card-wheel-item\s*\{[\s\S]*?flex-basis:\s*78px/);
  assert.match(source, /\{"\\u2060"\}[\s\S]*?className="external-link-icon"/);
});

test("follows live device color-scheme changes", async () => {
  const toggle = await readFile(new URL("../src/app/theme-toggle.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

  assert.match(toggle, /matchMedia\("\(prefers-color-scheme: dark\)"\)/);
  assert.match(toggle, /addEventListener\("change", handleSystemThemeChange\)/);
  assert.match(toggle, /overrideTheme && overrideTheme !== nextSystemTheme/);
  assert.match(toggle, /localStorage\.removeItem\(storedThemeKey\)/);
  assert.match(toggle, /setTheme\(nextSystemTheme\)/);
  assert.match(layout, /portfolio-theme-override/);
  assert.match(css, /:root\[data-theme="light"\][\s\S]*?--home-logo-filter:\s*invert\(1\)/i);
  assert.match(css, /\.home-link img\s*\{[\s\S]*?filter:\s*var\(--home-logo-filter\)/i);
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
  assert.match(source, /className="cover-instruction-tap">Hold and drag to preview, tap to expand<\/span>/);
  assert.match(source, /interdisciplinary questions are my favourite/);
  assert.match(source, /I highly recommend!/);
  assert.doesNotMatch(source, /intersectional questions|reccomend/i);
  assert.match(source, /className="listening-cover-wheel"[\s\S]*?aria-haspopup="dialog"/);
  assert.match(source, /className="listening-cover-expanded-link"[\s\S]*?target="_blank"/);
  assert.match(source, /aria-label="Track preview volume"/);
  assert.match(source, /<output>\{Math\.round\(volume \* 100\)\}%<\/output>/);
  assert.match(
    source,
    /Here is some music that I enjoy listening to right now![\s\S]*?<ListeningCoverWheel \/>[\s\S]*?And here are my lifetime listening statistics by time \(in hours\) via stats\.fm![\s\S]*?className="listening-rankings"/,
  );
  assert.match(source, /useState\(0\)/);
  assert.doesNotMatch(source, /portfolio-mode|pushState|getEntriesByType\("navigation"\)/);
  assert.match(source, /event\.pointerType === "mouse"[\s\S]*?void playPreview\(index\)/);
  assert.match(source, /handleCoverPointerDown[\s\S]*?window\.setTimeout\([\s\S]*?playPreview\(index\)[\s\S]*?, 300\)/);
  assert.match(source, /press\.currentX = event\.clientX[\s\S]*?press\.currentY = event\.clientY[\s\S]*?if \(press\.previewing\) return/);
  assert.match(source, /press\.hasDragged[\s\S]*?document\.elementFromPoint\(press\.currentX, press\.currentY\)/);
  assert.match(source, /Math\.hypot\(event\.clientX - press\.startX, event\.clientY - press\.startY\) > 6/);
  assert.match(source, /data-listening-index=\{index\}/);
  assert.match(source, /const edgeZone = Math\.min\(96, Math\.max\(56, wheelRect\.width \* 0\.22\)\)/);
  assert.match(source, /edgeScrollStrength = rightStrength - leftStrength[\s\S]*?easedStrength/);
  assert.match(source, /wheel\.scrollLeft \+ direction \* \(1 \+ easedStrength \* 15\)/);
  assert.match(source, /classList\.add\("is-touch-dragging"\)[\s\S]*?requestAnimationFrame/);
  assert.match(source, /classList\.remove\("is-touch-dragging"\)/);
  assert.doesNotMatch(source, /void playPreview\(nextIndex\);\s*scrollWheelToIndex\(nextIndex\)/);
  assert.match(source, /gesture: "pending" \| "horizontal" \| "vertical"/);
  assert.match(source, /wheelRef\.current\.scrollLeft = press\.startWheelScrollLeft - deltaX/);
  assert.match(source, /window\.scrollTo\(\{ top: press\.startPageScrollY - deltaY \}\)/);
  assert.doesNotMatch(source, /getBoundingClientRect\(\)[\s\S]*?isOutsideCover/);
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
  assert.doesNotMatch(statsSource, /pinterest|monthlyViews/i);
  assert.doesNotMatch(statsSource, /api\.apify\.com/);
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

  assert.match(
    source,
    /const sideQuestNavigationRows[\s\S]*?href: "#photo-gallery"[\s\S]*?href: "#listening"[\s\S]*?href: "#reading"[\s\S]*?href: "#watching"[\s\S]*?href: "#gaming"[\s\S]*?href: "#collections"[\s\S]*?href: "#natural-things"[\s\S]*?href: "#scrapbook"[\s\S]*?href: "#pokemon-cards"[\s\S]*?href: "#food"/,
  );
  assert.match(source, /<nav className="side-quest-index" aria-label="Side Quests sections">/);
  assert.match(source, /id="natural-things"/);
  assert.match(source, /id="scrapbook"/);
  assert.match(source, /id="pokemon-cards"/);
  assert.match(
    source,
    /function navigateToSideQuestDestination[\s\S]*?target instanceof HTMLDetailsElement[\s\S]*?target\.dataset\.expandOnNavigate === "true"[\s\S]*?target\.querySelector<HTMLDetailsElement>\(":scope > details"\)[\s\S]*?dropdown\.open = true/,
  );
  assert.match(source, /onClick=\{\(event\) => navigateToSideQuestDestination\(event, item\.href\)\}/);
  assert.match(
    source,
    /const duration = 260[\s\S]*?requestAnimationFrame\(animateScroll\)/,
  );
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /id="photo-gallery" data-expand-on-navigate="true"/);
  assert.match(source, /id="food" data-expand-on-navigate="true"/);
  assert.doesNotMatch(source, /id="collections" data-expand-on-navigate/);

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
    /<details className="dropdown-entry photo-gallery-dropdown">[\s\S]*?<summary>[\s\S]*?<h2>Photo Gallery<\/h2>[\s\S]*?<PhotoGallery \/>[\s\S]*?<\/details>/,
  );
  assert.doesNotMatch(source, /monthly views on Pinterest|Pinterest monthly views/i);
  assert.match(
    source,
    /Find me on[\s\S]*?className="text-link photo-pinterest-link"[\s\S]*?href="https:\/\/ca\.pinterest\.com\/nnickelsj\/"[\s\S]*?<strong>Pinterest<\/strong>[\s\S]*?<ExternalLinkIcon \/>/,
  );
  assert.match(
    source,
    /const funLinks[\s\S]*?name: "Pinterest"[\s\S]*?name: "Spotify"[\s\S]*?name: "Instagram"[\s\S]*?name: "Google Maps"/,
  );
  assert.doesNotMatch(source, /Photo gallery placeholder/);
  assert.match(
    source,
    /<summary>Natural Things<\/summary>[\s\S]*?I like gardening and plant-keeping[\s\S]*?<NaturalThingsGallery \/>/,
  );
  assert.match(
    source,
    /<summary>Scrapbook<\/summary>[\s\S]*?I hoard \(and organize\)[\s\S]*?<ScrapbookGallery \/>/,
  );
  assert.match(
    source,
    /<section className="section" id="food" data-expand-on-navigate="true">[\s\S]*?<details className="dropdown-entry food-photo-dropdown">[\s\S]*?<summary>Photos<\/summary>[\s\S]*?<FoodPhotoGallery \/>[\s\S]*?<\/details>/,
  );
  assert.doesNotMatch(source, /Photo placeholder/);
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
  assert.equal((source.match(/<details className="dropdown-entry" id="(?:natural-things|scrapbook)">/g) ?? []).length, 2);
  assert.match(source, /<div className="collection-static-entry" id="pokemon-cards">[\s\S]*?<h3>Pokémon Cards<\/h3>[\s\S]*?<PokemonCardWheel \/>/);
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

  const naturalThingsAssets = await readdir(
    new URL("../public/natural-things/", import.meta.url),
  );
  assert.equal(naturalThingsAssets.length, 19);
  assert.ok(!naturalThingsAssets.includes("natural-06.jpg"));
  for (const asset of naturalThingsAssets) {
    const photo = await readFile(new URL(`../public/natural-things/${asset}`, import.meta.url));
    assert.ok(photo.length > 20_000);
  }

  const foodAssets = await readdir(new URL("../public/food-photos/", import.meta.url));
  assert.equal(foodAssets.length, 37);
  assert.match(source, /const foodPhotoOrder = \[[\s\S]*?32, 36, 37,[\s\S]*?\] as const/);
  for (const asset of foodAssets) {
    const photo = await readFile(new URL(`../public/food-photos/${asset}`, import.meta.url));
    assert.ok(photo.length > 20_000);
  }

  const photoAssets = await readdir(new URL("../public/photos/", import.meta.url));
  assert.equal(photoAssets.length, 50);
  for (const asset of photoAssets) {
    const photo = await readFile(new URL(`../public/photos/${asset}`, import.meta.url));
    assert.ok(photo.length > 10_000);
  }

  assert.match(source, /const galleryPhotoOrder = \[[\s\S]*?\] as const;/);
  assert.equal(
    [...source.matchAll(/const galleryPhotoOrder = \[([\s\S]*?)\] as const;/g)][0][1]
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean).length,
    50,
  );
  assert.match(source, /className=\{`photo-gallery-grid photo-gallery-grid--\$\{columnCount\}`\}/);
  assert.match(source, /className="photo-gallery-lightbox"/);
  assert.match(source, /aria-label="Previous photo"/);
  assert.match(source, /aria-label="Next photo"/);

  const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.fun-content\s*\{[\s\S]*?gap:\s*2rem/i);
  assert.match(
    css,
    /\.listening-rankings\s*\{[\s\S]*?columns:\s*3 13rem[\s\S]*?column-fill:\s*balance[\s\S]*?margin-top:\s*0\.85rem/i,
  );
  assert.match(css, /\.listening-cover-wheel\s*\{[\s\S]*?display:\s*flex[\s\S]*?overflow-x:\s*auto/i);
  assert.match(css, /\.listening-cover-wheel\.is-touch-dragging\s*\{[\s\S]*?scroll-snap-type:\s*none/i);
  assert.match(css, /\.listening-cover-thumbnail:hover[\s\S]*?box-shadow:[\s\S]*?translateY\(-7px\)/i);
  assert.match(css, /\.listening-cover-thumbnail\s*\{[\s\S]*?touch-action:\s*none[\s\S]*?user-select:\s*none/i);
  assert.match(css, /\.listening-preview-heading \.listening-preview-prompt\s*\{[\s\S]*?color:\s*var\(--muted\)/i);
  assert.match(css, /@media \(hover: none\), \(pointer: coarse\)[\s\S]*?\.cover-instruction-hover[\s\S]*?display:\s*none[\s\S]*?\.cover-instruction-tap[\s\S]*?display:\s*inline/i);
  assert.match(css, /\.listening-preview-heading strong\s*\{[\s\S]*?color:\s*var\(--foreground\)/i);
  assert.match(css, /\.listening-preview-progress\s*\{[\s\S]*?conic-gradient/i);
  assert.doesNotMatch(css, /\.listening-preview-progress\s*\{[\s\S]*?transform:\s*scaleX\(-1\)/i);
  assert.match(css, /\.listening-volume\s*\{[\s\S]*?grid-template-columns:\s*auto 112px auto[\s\S]*?width:\s*max-content/i);
  assert.match(css, /\.listening-volume output\s*\{[\s\S]*?text-align:\s*left/i);
  assert.match(css, /\.mode-content\s*\{[\s\S]*?padding-bottom:\s*4rem/i);
  assert.match(css, /@view-transition\s*\{[\s\S]*?navigation:\s*auto/i);
  assert.match(css, /\.gaming-widget h3\s*\{[\s\S]*?color:\s*var\(--muted\)/i);
  assert.match(css, /@media \(max-width: 520px\)[\s\S]*?\.hero h1\s*\{[\s\S]*?white-space:\s*nowrap/i);
  assert.match(css, /@media \(max-width: 520px\)[\s\S]*?\.social-links\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, 1\.42rem\)/i);
  assert.match(css, /\.pokemon-card-wheel\s*\{[\s\S]*?display:\s*flex[\s\S]*?overflow-x:\s*auto/i);
  assert.match(css, /\.photo-gallery-grid\s*\{[\s\S]*?display:\s*grid[\s\S]*?grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)[\s\S]*?gap:\s*0\.5rem/i);
  assert.match(css, /\.photo-gallery-grid--3\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/i);
  assert.match(css, /\.photo-gallery-column\s*\{[\s\S]*?display:\s*flex[\s\S]*?flex-direction:\s*column[\s\S]*?gap:\s*0\.5rem/i);
  assert.match(css, /\.photo-gallery-thumbnail img\s*\{[\s\S]*?width:\s*100%[\s\S]*?height:\s*auto/i);
  assert.match(css, /\.pokemon-card-lightbox,\s*\.listening-cover-lightbox,\s*\.photo-gallery-lightbox\s*\{[\s\S]*?position:\s*fixed[\s\S]*?backdrop-filter:\s*blur/i);
  assert.match(css, /\.dropdown-entry summary::before\s*\{[\s\S]*?border-bottom/i);
  assert.doesNotMatch(css, /\.dropdown-entry summary::after\s*\{[\s\S]*?content:\s*"\+"/i);
});

test("publishes Side Quests as its own shareable page", async () => {
  const response = await render("/side-quests");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Side Quests — Nicole Jiang<\/title>/i);
  assert.match(html, /rel="canonical"[^>]*href="https:\/\/nicolejiang\.com\/side-quests"/i);
  assert.match(html, /<h1[^>]*>Nicole Jiang<\/h1>/i);
  assert.match(html, /aria-label="Pinterest"/i);
  assert.match(html, /aria-label="Spotify"/i);
  assert.match(html, /aria-label="Instagram"/i);
  assert.match(html, /aria-label="Google Maps"/i);
  assert.equal(
    (html.match(/href="https:\/\/maps\.app\.goo\.gl\/qet6vnym45NpTQ2XA\?g_st=ic"/g) ?? []).length,
    2,
  );
  assert.doesNotMatch(html, /google\.com\/maps\/contrib/i);
  assert.doesNotMatch(html, /property="og:|name="twitter:/i);
  assert.doesNotMatch(html, /aria-label="LinkedIn"|aria-label="GitHub"|aria-label="Email"/i);
  assert.match(html, /href="\/"[^>]*>Main Quest<\/a>/i);
  assert.match(html, /aria-label="Side Quests content"/i);
});

test("publishes an interactive, shareable astronomy Playground", async () => {
  const response = await render("/playground");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Playground — Nicole Jiang<\/title>/i);
  assert.match(html, /rel="canonical"[^>]*href="https:\/\/nicolejiang\.com\/playground"/i);
  assert.match(html, /<h1[^>]*>Playground<\/h1>/i);
  assert.match(html, /These are simplified,[\s\S]*?illustrative models[\s\S]*?visual cues are exaggerated or added for clarity/i);
  assert.match(html, /aria-label="Playground experiments"/i);
  assert.match(html, /href="#black-hole-growth"/i);
  assert.match(html, /href="#gravitational-lensing"/i);
  assert.match(html, /href="#orbital-resonance"/i);
  assert.match(html, /href="#stellar-evolution"/i);
  assert.match(html, /id="black-hole-growth"/i);
  assert.match(html, /id="gravitational-lensing"/i);
  assert.match(html, /id="orbital-resonance"/i);
  assert.match(html, /id="stellar-evolution"/i);
  assert.doesNotMatch(html, /work in progress/i);
  assert.equal((html.match(/Explanation/g) ?? []).length, 4);
  assert.doesNotMatch(html, /Experiment guide|What to do|What to expect/i);
  assert.match(html, /logarithmic mass vertically/i);
  assert.match(html, /benchmark, not a limit/i);
  assert.match(html, /Einstein radius/i);
  assert.match(html, /Pattern repeats after/i);
  const explanationBodies = [
    ...html.matchAll(/<div class="experiment-guide-content">([\s\S]*?)<\/div><\/div><\/details>/g),
  ];
  assert.equal(explanationBodies.length, 4);
  for (const [, explanation] of explanationBodies) {
    assert.equal((explanation.match(/<p>/g) ?? []).length, 2);
  }
  assert.match(html, /Black-Hole Growth Simulator/i);
  assert.match(html, /Gravitational Lensing Sandbox/i);
  assert.match(html, /Orbital Resonance Toy/i);
  assert.match(html, /Stellar Evolution Explorer/i);
  assert.match(html, /Orbiting bodies/i);
  assert.match(html, /Period relationship/i);
  assert.match(html, /In a 2:1 pair,[\s\S]*?inner body completes two orbits/i);
  assert.match(html, /smallest whole number of inner orbits needed[\s\S]*?chain to repeat/i);
  assert.match(html, /2:1 chain/i);
  assert.match(html, /Pause orbits/i);
  assert.match(html, /Mass presets:/i);
  assert.match(html, /Initial mass/i);
  assert.match(html, /type="range"[^>]*aria-label="Evolution progress"/i);
  assert.match(html, /Play evolution/i);
  assert.match(html, /Main-sequence lifetime/i);
  assert.match(html, /Main-sequence luminosity/i);
  assert.match(html, /Final remnant/i);
  assert.match(html, /Lens mass/i);
  assert.match(html, /Distance factor/i);
  assert.match(html, /Perfect alignment/i);
  assert.match(html, /Seed mass/i);
  assert.match(html, /Seed redshift/i);
  assert.match(html, /Observation redshift/i);
  assert.match(html, /Accretion rate/i);
  assert.match(html, /Spin/i);
  assert.match(html, /derived from spin/i);
  assert.match(html, /Advanced settings/i);
  assert.match(html, /Variables guide/i);
  assert.match(html, /Projected mass growth/i);
  assert.match(html, /Cosmic time \(seed → observation\)/i);
  assert.match(html, /Black-hole mass \(M☉, log₁₀ scale\)/i);
  assert.match(html, /10²⁰/i);
  assert.doesNotMatch(html, /10\^20/i);
  assert.match(html, /Time runs from the seed epoch to observation/i);
  assert.match(html, /Variable presets:/i);
  assert.match(html, /ordinary stellar remnants/i);
  assert.match(html, /direct-collapse seeds/i);
  assert.match(html, /near-Eddington quasar/i);
  assert.match(html, /first billion years and early quasars/i);
  assert.match(html, /aria-expanded="false"/i);
  assert.match(html, /Duty cycle/i);
  assert.match(html, /Radiative efficiency/i);
  assert.match(html, /Play growth/i);
  assert.match(html, /Drag to rotate in 3D/i);
  assert.match(html, /Drag to move and rotate the source galaxy/i);
  assert.match(html, /href="\/"[^>]*>Main Quest<\/a>/i);
  assert.match(html, /href="\/side-quests"[^>]*>Side Quests<\/a>/i);

  const source = await readFile(new URL("../src/app/playground/playground.tsx", import.meta.url), "utf8");
  assert.match(source, /className="black-hole-guidance"[\s\S]*?<ExperimentGuide>[\s\S]*?<VariablesGuide \/>[\s\S]*?aria-label="Growth scenarios"/i);
  assert.match(source, /EDDINGTON_TIME_GYR = 0\.45/);
  assert.match(source, /cosmicAgeAtRedshift/);
  assert.match(source, /effectiveEfoldingTime/);
  assert.match(source, /requestAnimationFrame\(animate\)/);
  assert.match(source, /8_500 \* \(1 - initialProgress\)/);
  assert.match(source, /progress >= 1 \? 0\.02 : progress/);
  assert.match(source, /if \(progress >= 1\) setProgress\(0\.02\)/);
  assert.match(source, /1 - \(1 - elapsed\) \*\* 1\.7/);
  assert.match(source, /VISUAL_LOG_MASS_MIN = 1/);
  assert.match(source, /VISUAL_LOG_MASS_REFERENCE_MAX = 15/);
  assert.match(source, /const visualMassScale = Math\.max\(\s*0,/);
  assert.doesNotMatch(source, /const visualMassScale = clamp/);
  assert.match(source, /--mass-scale/);
  assert.doesNotMatch(source, /visualGrowthRange|visualGrowthExtent/);
  assert.doesNotMatch(source, /Visual diameter follows one continuous logarithmic scale and can grow beyond the frame/);
  assert.match(source, /GROWTH_CHART_LOG_MASS_MIN = 1/);
  assert.match(source, /GROWTH_CHART_DEFAULT_LOG_MASS_MAX = 20/);
  assert.match(source, /function formatPowerOfTen[\s\S]*?superscriptCharacters/);
  assert.match(source, /const yMin = GROWTH_CHART_LOG_MASS_MIN/);
  assert.match(source, /const yMax = Math\.max\([\s\S]*?GROWTH_CHART_DEFAULT_LOG_MASS_MAX,[\s\S]*?Math\.ceil\(model\.finalLogMass \+ 0\.25\)/);
  assert.match(source, /scale normally extends to 10²⁰ M☉ and expands automatically/);
  assert.match(source, /preventing the curve from clipping/);
  assert.match(source, /className="growth-chart-marker-hit"/);
  assert.match(source, /role="slider"/);
  assert.match(source, /onPointerDown=\{beginChartScrub\}/);
  assert.match(source, /onPointerMove=\{scrubChart\}/);
  assert.match(source, /onKeyDown=\{scrubChartWithKeyboard\}/);
  assert.match(source, /Drag the dot to inspect any time in the simulation/);
  assert.match(source, /className="rotation-hint">Drag to rotate in 3D<\/p>/);
  assert.match(source, /className="growth-chart-hint">Drag the plot dot to inspect mass growth<\/p>/);
  assert.doesNotMatch(source, /curve continues above the displayed/);
  assert.match(source, /--disk-luminosity/);
  assert.match(source, /--disk-inner-edge/);
  assert.match(source, /const activePresetName = presets\.find/);
  assert.match(source, /aria-pressed=\{isActive\}/);
  assert.match(source, /id="black-hole-advanced-settings"[\s\S]*?label="Spin"/);
  assert.match(source, /className="simulator-controls"[\s\S]*?label="Accretion rate"[\s\S]*?label="Seed redshift"[\s\S]*?className=\{`simulator-advanced/);
  assert.match(source, /className="simulator-controls"[\s\S]*?label="Seed redshift"[\s\S]*?className=\{`simulator-advanced/);
  assert.doesNotMatch(source, /id="black-hole-advanced-settings"[\s\S]*?label="Seed redshift"/);
  assert.match(source, /accretion-flow--outer/);
  assert.match(source, /accretion-flow--middle/);
  assert.match(source, /accretion-flow--inner/);
  assert.match(source, /black-hole-orbit-plane--foreground/);
  assert.match(source, /finite fuel, feedback, mergers, and evolving accretion or spin/);
  assert.match(source, /constant-Eddington-ratio accretion model/);
  assert.match(source, /λ = L \/ Lₑdd/);
  assert.match(source, /neither ray-traced nor drawn to physical scale/);
  assert.match(source, /bright lower[\s\S]*?semicircle is the near side[\s\S]*?upper arc suggests light from its far[\s\S]*?side bent around the black hole/);
  assert.match(source, /The lens is a massive foreground galaxy or cluster[\s\S]*?bends light/);
  assert.match(source, /central dark marker represents its mass as a single point/);
  assert.match(source, /Source size changes the drawn arcs but not the[\s\S]*?magnification estimate/);
  assert.match(source, /readout stops at “&gt; 40×/);
  assert.match(source, /<dt>Relative periods<\/dt>/);
  assert.match(source, /librating resonant angles/);
  assert.match(source, /const discriminant = Math\.sqrt/);
  assert.match(source, /setPointerCapture\(event\.pointerId\)/);
  assert.match(source, /thin-lens equation/);
  assert.match(source, /beginBlackHoleRotation/);
  assert.match(source, /setViewYaw/);
  assert.match(source, /setViewPitch/);
  assert.match(source, /useState\(84\)[\s\S]*?setViewPitch\(84\)/);
  assert.match(source, /setSourceRotation/);
  assert.match(source, /resonancePresets/);
  assert.match(source, /label="Animation speed"[\s\S]*?min=\{1\}[\s\S]*?max=\{10\}/);
  assert.match(source, /type ResonanceBodyCount = 1 \| 2 \| 3 \| 4 \| 5/);
  assert.match(source, /\(\[1, 2, 3, 4, 5\] as const\)/);
  assert.match(source, /setBodyCount/);
  assert.match(source, /prescribed circular,[\s\S]*?coplanar tracks/);
  assert.doesNotMatch(source, /circular, coplanar Keplerian orbits/);
  assert.match(source, /beginOrbitDrag/);
  assert.match(source, /rotateOrbits/);
  assert.match(source, /setPointerCapture\(event\.pointerId\)/);
  assert.match(source, /function stellarEvolutionTrack/);
  assert.match(source, /function navigateToPlaygroundExperiment/);
  assert.match(source, /const duration = 260/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /mass < 8/);
  assert.match(source, /mass < 25/);
  assert.match(source, /Planetary nebula/);
  assert.match(source, /Core-collapse supernova/);
  assert.match(source, /White dwarf/);
  assert.match(source, /Neutron star/);
  assert.match(source, /Black hole/);
  assert.match(source, /timeline begins 5\/6ths through the main sequence/);
  assert.match(source, /Phase markers are evenly[\s\S]*?spaced for readability/);
  assert.match(source, /During playback,[\s\S]*?moves more slowly[\s\S]*?through longer toy-model intervals/);
  assert.match(source, /Surface drift represents[\s\S]*?rotation and convection/);
  assert.match(source, /"--spin-play-state":\s*Math\.abs\(spin\)\s*<\s*0\.005\s*\?\s*"paused"/);
  assert.match(source, /className="rotation-hint">Drag to rotate in 3D<\/p>/);
  assert.match(source, /className="growth-chart-hint">Drag the plot dot to inspect mass growth<\/p>[\s\S]*?<svg/);
  assert.match(source, /className="black-hole-photon-ring"/);
  assert.match(source, /not every neutron star is observed as a radio pulsar/i);
  assert.match(source, /className="stellar-pulsar-beams"/);
  assert.match(source, /stronger giant-phase breathing represents pulsation/);
  assert.match(source, /STELLAR_TIMELINE_START_FRACTION = 5 \/ 6/);
  assert.match(source, /STELLAR_PHASE_POSITIONS = \[0, 100 \/ 3, 200 \/ 3, 100\]/);
  assert.doesNotMatch(source, /STELLAR_EXPANDED_FINAL_TRANSITION_POSITION/);
  assert.doesNotMatch(source, /timelinePositionAfterMainSequenceStart/);
  assert.match(source, /18_000 \* \(1 - initialProgress\)/);
  assert.match(source, /function mainSequenceTimelineStart/);
  assert.match(source, /function progressToStellarTimelinePosition/);
  assert.match(source, /function stellarTimelinePositionToProgress/);
  assert.match(source, /useState\(\(\) => mainSequenceTimelineStart\(1\)\)/);
  assert.match(source, /Phases are evenly spaced, not to scale by time; playback slows through longer intervals\. <strong>Drag to explore or select any phase\.<\/strong>/);
  assert.doesNotMatch(source, /Planetary<br \/>nebula|White<br \/>dwarf/);
  assert.match(source, /5\/6ths through main sequence/);
  assert.match(source, /aria-describedby="stellar-timeline-hint"/);
  assert.match(source, /Surface rotation is visual only/);
  assert.match(source, /flat ΛCDM expansion without radiation/);
  assert.match(source, /axisymmetric point-mass lens uses the scalar thin-lens equation/);
  assert.match(source, /does not[\s\S]*?enforce Kepler&apos;s third law or gravitational dynamics/);
  assert.match(source, /approximate mass-lifetime relation/);
  assert.match(source, /Stellar seed[\s\S]*?10² M☉ remnant at z = 25/);
  assert.match(source, /Direct collapse[\s\S]*?10⁵ M☉ seed at z = 20/);
  assert.match(source, /Rapid growth[\s\S]*?1\.5 Eddington ratio and 90% duty cycle/);
  assert.match(source, /Sun-like[\s\S]*?1 M☉ and ends as a white dwarf/);
  assert.match(source, /Massive[\s\S]*?12 M☉ and ends as a neutron star/);
  assert.match(source, /Very massive[\s\S]*?30 M☉ and ends as a black/);

  const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.simulator-workspace\s*\{[\s\S]*?grid-template-columns:/i);
  assert.match(css, /\.black-hole-stage\s*\{[\s\S]*?touch-action:\s*none/i);
  assert.match(css, /\.black-hole-stage\s*\{[\s\S]*?--simulation-background:\s*#121212/i);
  assert.match(css, /\.lensing-canvas\s*\{[\s\S]*?--simulation-background:\s*#121212/i);
  assert.match(css, /\.resonance-canvas\s*\{[\s\S]*?--simulation-background:\s*#121212/i);
  assert.doesNotMatch(css, /:root\[data-theme="light"\] \.black-hole-stage/);
  assert.match(css, /\.black-hole-stage\s*\{[\s\S]*?height:\s*260px/i);
  assert.match(css, /\.black-hole-core\s*\{[\s\S]*?width:\s*calc\(22px \+ 104px \* var\(--mass-scale\)\)/i);
  assert.match(css, /\.growth-chart-marker-hit\s*\{[\s\S]*?touch-action:\s*none/i);
  assert.match(css, /\.stellar-canvas--main-sequence \.stellar-object/);
  assert.match(css, /\.stellar-canvas--red-giant \.stellar-object/);
  assert.match(css, /@keyframes stellar-main-sequence-breathe/);
  assert.match(css, /@keyframes stellar-giant-pulse/);
  assert.match(css, /@keyframes stellar-surface-drift/);
  assert.match(css, /animation: stellar-surface-drift 12s linear infinite/);
  assert.match(css, /animation-duration: 16s/);
  assert.match(css, /@keyframes stellar-convection-shift/);
  assert.doesNotMatch(css, /--growth-scale/);
  assert.doesNotMatch(css, /\.black-hole-orbit-plane\s*\{[\s\S]*?transition:\s*[\s\S]*?width 460ms/i);
  assert.match(css, /\.variable-guide-content dl\s*\{[\s\S]*?gap:\s*0\.8rem/i);
  assert.match(css, /\.black-hole-guidance > \.experiment-guide\s*\{[\s\S]*?border-bottom:\s*0/i);
  assert.match(css, /\.black-hole-guidance > \.simulator-presets\s*\{[\s\S]*?border-top:\s*1px solid var\(--line\)/i);
  assert.doesNotMatch(css, /\.black-hole-guidance > \.variable-guide\s*\{[^}]*border-top/i);
  assert.match(css, /\.experiment-guide-content\s*\{[\s\S]*?max-width:\s*46rem/i);
  assert.match(css, /\.black-hole-orbit-plane\s*\{[\s\S]*?transform:\s*rotateX\(var\(--view-pitch\)\) rotateZ\(var\(--view-yaw\)\)/i);
  assert.match(css, /\.accretion-disk\s*\{[\s\S]*?conic-gradient[\s\S]*?radial-gradient/i);
  assert.doesNotMatch(css, /\.accretion-disk\s*\{[^}]*repeating-(?:conic|radial)-gradient/i);
  assert.doesNotMatch(css, /\.accretion-texture\s*\{[^}]*repeating-conic-gradient/i);
  assert.match(css, /animation-play-state:\s*var\(--spin-play-state\)/i);
  assert.match(css, /\.growth-chart-hint\s*\{[\s\S]*?grid-column:\s*1 \/ -1/i);
  assert.match(css, /@keyframes stellar-pulsar-sweep/i);
  assert.match(css, /@keyframes stellar-neutron-spin/i);
  assert.match(css, /\.black-hole-core::before/);
  assert.match(css, /\.simulator-presets button\.is-active\s*\{[\s\S]*?box-shadow:/i);
  assert.match(css, /\.black-hole-orbit-plane--foreground\s*\{[\s\S]*?z-index:\s*3/i);
  assert.match(css, /\.accretion-disk--foreground\s*\{[\s\S]*?clip-path:\s*inset\(49% 0 0 0\)/i);
  assert.match(css, /\.growth-chart-figure\s*\{[\s\S]*?grid-template-columns/i);
  assert.match(css, /\.growth-chart-figure\s*\{[\s\S]*?grid-column:\s*1 \/ -1/i);
  assert.match(css, /\.growth-chart-axis-title\s*\{[\s\S]*?fill:\s*var\(--foreground\)/i);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.accretion-texture[\s\S]*?animation:\s*none/i);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.simulator-workspace\s*\{[\s\S]*?grid-template-columns:\s*1fr/i);
  assert.match(css, /\.lensing-canvas\s*\{[\s\S]*?touch-action:\s*none/i);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.lensing-workspace\s*\{[\s\S]*?grid-template-columns:\s*1fr/i);
  assert.match(css, /\.resonance-workspace\s*\{[\s\S]*?grid-template-columns:/i);
  assert.match(css, /\.resonance-canvas\s*\{[\s\S]*?touch-action:\s*none/i);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.resonance-workspace\s*\{[\s\S]*?grid-template-columns:\s*1fr/i);
  assert.match(css, /\.stellar-workspace\s*\{[\s\S]*?grid-template-columns:/i);
  assert.match(css, /\.playground-index-row\s*\{[\s\S]*?repeat\(4, minmax\(0, 1fr\)\)/i);
  assert.match(css, /\.playground-intro\s*\{[\s\S]*?gap:\s*1\.25rem/i);
  assert.doesNotMatch(css, /\.playground-intro\s*\{[^}]*padding-bottom:/i);
  assert.match(css, /\.playground-index\s*\{[\s\S]*?margin-block:\s*-0\.6rem -1\.2rem/i);
  assert.match(css, /\.playground-intro p\s*\{[\s\S]*?color:\s*var\(--muted\)[\s\S]*?font-size:\s*inherit[\s\S]*?line-height:\s*inherit/i);
  assert.match(css, /@media \(max-width: 520px\)[\s\S]*?\.playground-intro\s*\{[\s\S]*?gap:\s*0\.9rem/i);
  assert.match(css, /\.stellar-canvas\s*\{[\s\S]*?--simulation-background:\s*#121212/i);
  assert.match(css, /\.stellar-object\s*\{[\s\S]*?animation:\s*stellar-pulse/i);
  assert.match(css, /\.stellar-timeline li\s*\{[\s\S]*?left:\s*var\(--stage-position\)/i);
  assert.match(css, /\.stellar-timeline-panel\s*\{[\s\S]*?grid-column:\s*1 \/ -1/i);
  assert.match(css, /\.stellar-timeline\s*\{[\s\S]*?width:\s*100%/i);
  assert.match(css, /\.stellar-timeline-scrubber\s*\{[\s\S]*?position:\s*absolute[\s\S]*?width:\s*100%/i);
  assert.match(css, /\.stellar-timeline-hint strong\s*\{[\s\S]*?color:\s*var\(--foreground\)[\s\S]*?font-weight:\s*650/i);
  assert.match(css, /\.stellar-timeline-scrubber::\-webkit-slider-thumb/);
  assert.match(css, /@keyframes stellar-remnant-pulse/i);
  assert.match(css, /@keyframes stellar-marker-pulse/i);
  assert.match(css, /\.stellar-canvas--planetary-nebula \.stellar-nebula/);
  assert.match(css, /\.stellar-canvas--supernova \.stellar-supernova-shell/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.stellar-workspace\s*\{[\s\S]*?grid-template-columns:\s*1fr/i);
});

test("publishes a combined, privacy-friendly site view counter", async () => {
  const portfolio = await readFile(new URL("../src/app/portfolio.tsx", import.meta.url), "utf8");
  const worker = await readFile(new URL("../src/worker.ts", import.meta.url), "utf8");
  const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");

  assert.match(portfolio, /fetch\("\/gc\/counter\/TOTAL\.json"/);
  assert.match(portfolio, /script\.dataset\.goatcounter = `\$\{window\.location\.origin\}\/gc\/count`/);
  assert.match(portfolio, /<ViewCounter \/>/);
  assert.match(worker, /GOATCOUNTER_CODE\?: string/);
  assert.match(worker, /GOATCOUNTER_CODE\?\.trim\(\)\.toLowerCase\(\) \|\| "nickel"/);
  assert.match(worker, /url\.pathname\.startsWith\("\/gc\/"\)/);
  assert.match(worker, /https:\/\/gc\.zgo\.at\/count\.js/);
  assert.match(worker, /url\.pathname\.slice\(3\)/);
  assert.match(envExample, /^GOATCOUNTER_CODE=""$/m);
});

test("does not publish a privacy-policy page", async () => {
  const portfolio = await readFile(new URL("../src/app/portfolio.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(portfolio, /Privacy Policy|href="\/privacy"/);

  const response = await render("/privacy");
  assert.equal(response.status, 404);
});
