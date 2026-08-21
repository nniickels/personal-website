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
  assert.match(html, />Serious Mode<\/button>/i);
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
  assert.match(html, /class="hero-postscript"[^>]*>\s*P\.S\./i);
  assert.doesNotMatch(html, /<ul\b/i);
  assert.match(html, /theme-icon__sun/i);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
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

test("keeps the Fun Mode interest sections and stats in the requested order", async () => {
  const source = await readFile(new URL("../src/app/portfolio.tsx", import.meta.url), "utf8");
  const headings = [
    "<h2>Pinterest</h2>",
    "<h2>Reading</h2>",
    "<h2>Music</h2>",
    "<h2>Gaming</h2>",
    "<h2>Other Media</h2>",
    "<h2>Collections</h2>",
    "<h2>Food</h2>",
  ];
  const positions = headings.map((heading) => source.indexOf(heading));

  positions.forEach((position) => assert.notEqual(position, -1));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));

  for (const label of ["Top 5 Genres", "Top 10 Artists", "Top 10 Tracks"]) {
    assert.match(source, new RegExp(label));
  }

  for (const collection of [
    "Plants & Dried Plants",
    "Rocks & Fossils",
    "Scrapbook",
    "Pokémon Cards",
  ]) {
    assert.match(source, new RegExp(collection.replace("&", "&amp;|&")));
  }
});
