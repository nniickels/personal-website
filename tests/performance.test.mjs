import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";
function mockCache(t, value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "caches");
  Object.defineProperty(globalThis, "caches", { value, configurable: true });
  t.after(() => { if (previous) Object.defineProperty(globalThis, "caches", previous); else delete globalThis.caches; });
}
import sharp from "sharp";
import worker from "../dist/server/index.js";

const env = { CLASH_ROYALE_API_TOKEN: "test-token", STEAM_WEB_API_KEY: "test-key", STEAM_ID64: "test-account" };
const request = () => new Request("https://example.test/api/stats");
const pending = [];
const context = { waitUntil(promise) { pending.push(promise); }, passThroughOnException() {} };
class MemoryCache {
  entries = new Map();
  async match(key) { return this.entries.get(key.url)?.clone(); }
  async put(key, value) { this.entries.set(key.url, value.clone()); }
}
function providerResponse(url, trophies = 1234) {
  if (url.includes("royaleapi")) return Response.json({ trophies });
  if (url.includes("steampowered")) return Response.json({ response: { games: [{ appid: 10, name: "Fixture Game" }] } });
  return Response.json({ items: [] });
}

test("analytics preview requests decoded bodies while Cloudflare preserves compressed passthrough", async (t) => {
  const payload = '{"count":"123"}';
  const compressed = gzipSync(payload);
  let upstream;
  t.mock.method(globalThis, "fetch", async (input, init) => {
    upstream = new Request(input, init);
    return upstream.headers.get("Accept-Encoding") === "identity"
      ? new Response(payload, { headers: { "Content-Length": String(payload.length) } })
      : new Response(compressed, { headers: { "Content-Encoding": "gzip", "Content-Length": String(compressed.length) } });
  });
  for (const runtime of [undefined, {}]) {
    for (const path of ["/gc/count.js", "/gc/counter/TOTAL.json?test=1", "/gc/count"]) {
      const tracking = path === "/gc/count";
      const response = await worker.fetch(new Request(`https://example.test${path}`, {
        method: tracking ? "POST" : "GET",
        headers: { "Accept-Encoding": "gzip, br", "X-Test-Request": "preserved" },
        ...(tracking ? { body: "tracking payload" } : {}),
      }), runtime, context);
      assert.equal(upstream.url, path === "/gc/count.js" ? "https://gc.zgo.at/count.js" : `https://nickel.goatcounter.com${path.slice(3)}`);
      assert.equal(upstream.headers.get("Accept-Encoding"), runtime === undefined ? "identity" : path === "/gc/count.js" ? null : "gzip, br");
      assert.equal(upstream.headers.get("X-Test-Request"), path === "/gc/count.js" ? null : "preserved");
      if (tracking) { assert.equal(upstream.method, "POST"); assert.equal(await upstream.text(), "tracking payload"); }
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.deepEqual(bytes, runtime === undefined ? Buffer.from(payload) : compressed);
      assert.equal(response.headers.get("Content-Encoding"), runtime === undefined ? null : "gzip");
      assert.equal(Number(response.headers.get("Content-Length")), bytes.length);
      if (path === "/gc/count.js") assert.equal(response.headers.get("Cache-Control"), "public, max-age=86400, s-maxage=86400");
    }
  }
});

test("stats cache serves hits and refreshes stale data without blocking readers", async (t) => {
  const cache = new MemoryCache();
  mockCache(t, { default: cache });
  let now = 1_000_000;
  t.mock.method(Date, "now", () => now);
  let fetches = 0;
  t.mock.method(globalThis, "fetch", async (input) => { fetches++; return providerResponse(String(input)); });
  const first = await worker.fetch(request(), env, context);
  assert.equal(first.headers.get("X-Stats-Cache"), "miss");
  assert.equal((await first.json()).clashRoyale.data.trophies, 1234);
  assert.equal(fetches, 5);
  const second = await worker.fetch(request(), env, context);
  assert.equal(second.headers.get("X-Stats-Cache"), "hit");
  assert.equal(fetches, 5);
  now += 16 * 60_000;
  const stale = await worker.fetch(request(), env, context);
  assert.equal(stale.headers.get("X-Stats-Cache"), "stale");
  assert.equal((await stale.json()).clashRoyale.data.trophies, 1234);
  await Promise.all(pending.splice(0));
  assert.equal(fetches, 10);
  assert.equal((await worker.fetch(request(), env, context)).headers.get("X-Stats-Cache"), "hit");
});

test("partial provider failures retain good data but never extend its original lifetime", async (t) => {
  mockCache(t, { default: new MemoryCache() });
  let now = 1_000_000;
  let failing = false;
  t.mock.method(Date, "now", () => now);
  t.mock.method(globalThis, "fetch", async (input) => {
    const url = String(input);
    return failing && url.includes("royaleapi") ? new Response("Unavailable", { status: 503 }) : providerResponse(url);
  });
  await worker.fetch(request(), env, context);
  now += 16 * 60_000; failing = true;
  await worker.fetch(request(), env, context);
  await Promise.all(pending.splice(0));
  let data = await (await worker.fetch(request(), env, context)).json();
  assert.equal(data.clashRoyale.status, "ok");
  assert.equal(data.steam.status, "ok");
  now += 58.5 * 60_000;
  await worker.fetch(request(), env, context);
  await Promise.all(pending.splice(0));
  now += 0.6 * 60_000;
  data = await (await worker.fetch(request(), env, context)).json();
  assert.equal(data.clashRoyale.status, "unavailable");
  await Promise.all(pending.splice(0));
  data = await (await worker.fetch(request(), env, context)).json();
  assert.equal(data.clashRoyale.status, "unavailable");
  assert.equal(data.steam.status, "ok");
});

test("a stalled provider has a bounded deadline and other providers still return", async (t) => {
  mockCache(t, undefined);
  t.mock.method(globalThis, "fetch", async (input, init) => {
    if (!String(input).includes("royaleapi")) return providerResponse(String(input));
    return new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(init.signal.reason), { once: true }));
  });
  // Keep the event loop alive while AbortSignal's unref'ed deadline is pending.
  const keepAlive = setInterval(() => {}, 1000);
  try {
    const start = performance.now();
    const data = await (await worker.fetch(request(), env, context)).json();
    assert.ok(performance.now() - start < 5500);
    assert.equal(data.clashRoyale.status, "unavailable");
    assert.equal(data.spotify.status, "ok");
    assert.equal(data.steam.status, "ok");
  } finally { clearInterval(keepAlive); }
});

test("immutable build asset caching covers only versioned URLs", async () => {
  const headers = await readFile(new URL("../public/_headers", import.meta.url), "utf8");
  assert.match(headers, /^\/_next\/static\/\*\n\s+Cache-Control: public, max-age=31536000, immutable$/m);
  assert.match(headers, /^\/media\/\*\n\s+Cache-Control: public, max-age=31536000, immutable$/m);
  const directory = fileURLToPath(new URL("../dist/client/_next/static", import.meta.url));
  const files = (await readdir(directory, { recursive: true, withFileTypes: true })).filter((entry) => entry.isFile());
  assert.ok(files.length > 0);
  for (const entry of files) {
    const path = relative(directory, join(entry.parentPath, entry.name)).replaceAll("\\", "/");
    const hashedAsset = /(?:^|\/)[^/]+[-.][A-Za-z0-9_-]{8}\.(?:js|css)(?:\.map)?$/.test(path);
    const buildManifest = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\/_(?:build|ssg)Manifest\.js$/.test(path);
    assert.ok(hashedAsset || buildManifest, `Immutable cache requires a versioned URL: ${path}`);
  }
});

test("generated image candidates match their dimensions and remove metadata", async () => {
  let originalBytes = 0;
  let thumbBytes = 0;
  for (const filename of await readdir(new URL("../src/generated/media", import.meta.url))) {
    const assets = JSON.parse(await readFile(new URL(`../src/generated/media/${filename}`, import.meta.url), "utf8"));
    for (const [original, asset] of Object.entries(assets)) {
      assert.ok(asset.width > 0 && asset.height > 0);
      const candidate = asset.sources.find((source) => source.width >= 320) ?? asset.sources.at(-1);
      originalBytes += (await readFile(new URL(`../public${original}`, import.meta.url))).length;
      thumbBytes += (await readFile(new URL(`../public${candidate.src}`, import.meta.url))).length;
      for (const source of asset.sources) {
        const metadata = await sharp(fileURLToPath(new URL(`../public${source.src}`, import.meta.url))).metadata();
        assert.equal(metadata.width, source.width);
        assert.ok(Math.abs(metadata.height / metadata.width - asset.height / asset.width) < 0.01);
        assert.equal(metadata.format, "webp");
        assert.equal(metadata.exif, undefined);
        assert.equal(metadata.xmp, undefined);
        assert.ok(source.width <= asset.width);
      }
    }
  }
  assert.ok(thumbBytes < originalBytes * 0.2, "thumbnail set must remain below 20% of original bytes");
  const music = JSON.parse(await readFile(new URL("../src/generated/media/music-covers.json", import.meta.url), "utf8"));
  for (const [first, second] of [
    ["0bOvjYU552KSscyA0af4aw", "0cVaG276BeCnxIxf42puZ1"],
    ["0mc51xomEC6CZUZdB8xgQU", "4bZnIdaGBf162pZEkxXSgQ"],
  ]) {
    const originals = [first, second].map((id) => `/music-covers/${id}.jpg`);
    assert.deepEqual(await readFile(new URL(`../public${originals[0]}`, import.meta.url)), await readFile(new URL(`../public${originals[1]}`, import.meta.url)));
    assert.deepEqual(music[originals[0]], music[originals[1]], "identical covers share dimensions and generated URLs");
  }
});


test("stats still load if edge cache storage is unavailable", async (t) => {
  mockCache(t, { default: { match: async () => { throw new Error("offline"); }, put: async () => { throw new Error("offline"); } } });
  t.mock.method(globalThis, "fetch", async (input) => providerResponse(String(input)));
  const response = await worker.fetch(request(), env, context);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).clashRoyale.status, "ok");
  assert.equal((await worker.fetch(new Request("https://example.test/api/stats", { method: "POST" }), env, context)).status, 405);
});
