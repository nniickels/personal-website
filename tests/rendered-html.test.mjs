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
  assert.match(html, />Google Maps<\/a>/i);
  assert.match(html, />Pinterest<\/a>/i);
  assert.match(html, />Spotify<\/a>/i);
  assert.match(html, />LinkedIn<\/a>/i);
  assert.match(html, /class="theme-toggle"/i);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("server-renders the combined résumé and CV page", async () => {
  const response = await render("/resume");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<h1[^>]*>Résumé \/ CV<\/h1>/i);
});

test("redirects the old CV route to the combined page", async () => {
  const response = await render("/cv");
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "http://localhost/resume");
});
