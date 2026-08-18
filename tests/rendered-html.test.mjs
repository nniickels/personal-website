import assert from "node:assert/strict";
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
  assert.match(html, /<h1[^>]*>Nicole Jiang<\/h1>/i);
  assert.match(html, />LinkedIn<\/a>/i);
  assert.doesNotMatch(html, />Google Maps<\/a>|>Pinterest<\/a>|>Spotify<\/a>/i);
  assert.match(html, /class="theme-toggle"/i);
  assert.match(html, />Serious Mode<\/button>/i);
  assert.match(html, />Fun Mode!<\/button>/i);
  assert.match(html, /<h2>Experience<\/h2>/i);
  assert.match(html, /<h2>Projects<\/h2>/i);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("does not publish separate résumé or CV pages", async () => {
  for (const pathname of ["/resume", "/cv"]) {
    const response = await render(pathname);
    assert.equal(response.status, 404);
  }
});
