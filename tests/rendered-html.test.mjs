import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  assert.match(html, /rel="icon"[^>]*href="\/favicon\.svg"[^>]*type="image\/svg\+xml"/i);
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
  assert.match(favicon, />同<\/text>/);
  assert.doesNotMatch(favicon, /同同/);
  assert.match(favicon, /STKaiti/);
  assert.match(favicon, /prefers-color-scheme:\s*dark/);
});

test("keeps the Side Quests interest sections and stats in the requested order", async () => {
  const source = await readFile(new URL("../src/app/portfolio.tsx", import.meta.url), "utf8");
  const headings = [
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

  const collectionSubsections = ["Natural Things", "Scrapbook", "Pokémon Cards"].map((label) =>
    source.indexOf(`<summary>${label}</summary>`),
  );
  collectionSubsections.forEach((position) => assert.notEqual(position, -1));
  assert.deepEqual(collectionSubsections, [...collectionSubsections].sort((a, b) => a - b));

  assert.match(source, /The Book of Laughter and Forgetting/);
  assert.match(source, /Batman: Arkham Knight/);
  assert.match(source, /<h3>Clash Royale<\/h3>/);
  assert.match(source, /<p className="gaming-widget-label">Trophies<\/p>/);
  assert.match(source, /<h3>Steam<\/h3>/);
  assert.match(source, /<p className="gaming-widget-label">Recently Played<\/p>/);
  assert.match(source, /A short description of my natural-history collections will go here\./);
  assert.match(source, /A short description of my scrapbook and process will go here\./);
  assert.match(source, /A short description of my Pokémon card collection will go here\./);
  assert.match(source, /Photo gallery placeholder/);
  assert.match(source, /Photo placeholder/);
  assert.match(source, /Photo scroll wheel placeholder/);
  assert.equal((source.match(/<details className="dropdown-entry">/g) ?? []).length, 3);

  const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.fun-content\s*\{[\s\S]*?gap:\s*2rem/i);
  assert.match(css, /\.dropdown-entry summary::before\s*\{[\s\S]*?border-bottom/i);
  assert.doesNotMatch(css, /\.dropdown-entry summary::after\s*\{[\s\S]*?content:\s*"\+"/i);
});
