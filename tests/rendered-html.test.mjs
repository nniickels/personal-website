import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
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
  assert.match(html, /<h1>Nicole Jiang<\/h1>/i);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("renders Steam games as titles only", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, />UNBEATABLE</i);
  assert.doesNotMatch(html, /UNBEATABLE\s*(?:\d|[0-9.]+\s*h|hours?|minutes?|played for)/i);
});

test("shows a note when fewer than three Steam games were played recently", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /No other games played within the last 14 days/);
});
