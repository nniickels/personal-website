import assert from "node:assert/strict";
import test from "node:test";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { Guestbook, default as worker } from "../dist/server/index.js";

class MemoryStorage {
  records = new Map();
  pending = Promise.resolve();
  async get(key) { return structuredClone(this.records.get(key)); }
  async put(key, value) { this.records.set(key, structuredClone(value)); }
  async list({ prefix }) { return new Map([...this.records].filter(([key]) => key.startsWith(prefix))); }
  transaction(callback) {
    const result = this.pending.then(() => callback(this));
    this.pending = result.catch(() => {});
    return result;
  }
}

function setup() {
  const storage = new MemoryStorage();
  const guestbook = new Guestbook({ storage });
  const env = { GUESTBOOK: { idFromName: (name) => name, get: () => guestbook } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const call = (body, headers = {}) => worker.fetch(new Request("https://example.test/api/guestbook", {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", Origin: "https://example.test", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  }), env, context);
  return { storage, call };
}

const entry = (changes = {}) => ({
  id: crypto.randomUUID(), name: "Visitor", sticker: "daisy", x: 0.35, y: 0.72, ...changes,
});

test("guestbook saves shared entries and treats a retry as the same placement", async () => {
  const { storage, call } = setup();
  const submission = entry({ name: "  nickel  " });
  const first = await call(submission);
  assert.equal(first.status, 201);
  const saved = (await first.json()).entry;
  assert.equal(saved.name, "nickel");
  assert.ok(!Number.isNaN(Date.parse(saved.placedAt)));
  const retry = await call(submission);
  assert.equal(retry.status, 200);
  assert.deepEqual((await retry.json()).entry, saved);
  assert.deepEqual((await (await call()).json()).entries, [saved]);
  const recreated = new Guestbook({ storage });
  const freshResponse = await recreated.fetch(new Request("https://example.test/api/guestbook"));
  assert.deepEqual((await freshResponse.json()).entries, [saved]);
  assert.equal((await call({ ...submission, name: "Different visitor" })).status, 409);
});

test("guestbook rejects invalid regions and accepts each kind of region", async () => {
  const { call } = setup();
  for (const changes of [
    { sticker: "star", x: 0.35, y: 0.72 },
    { sticker: "duck", x: 0.76, y: 0.2 },
    { sticker: "cat", x: 0.68, y: 0.78 },
    { sticker: "cat", x: 0.14, y: 0.6 },
    { sticker: "owl", x: 0.5, y: 0.3 },
    { sticker: "cloud", x: 0.14, y: 0.43 },
    { sticker: "unknown" },
    { name: " " },
    { name: "a".repeat(21) },
    { name: "bad\nname" },
    { x: 1.2 },
  ]) assert.equal((await call(entry(changes))).status, 400, JSON.stringify(changes));
  for (const changes of [
    { sticker: "cloud", x: 0.1, y: 0.1 },
    { sticker: "swan", x: 0.68, y: 0.78 },
    { sticker: "owl", x: 0.14, y: 0.22 },
    { sticker: "deer", x: 0.3, y: 0.8 },
  ]) assert.equal((await call(entry(changes))).status, 201, JSON.stringify(changes));
});

test("simultaneous guestbook posts cannot share a centre or overwrite another placement", async () => {
  const { call } = setup();
  const responses = await Promise.all([call(entry()), call(entry())]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
  assert.equal((await (await call()).json()).entries.length, 1);
});

test("guestbook rejects cross-site posts and oversized bodies", async () => {
  const { call } = setup();
  assert.equal((await call(entry(), { Origin: "https://other.test" })).status, 403);
  assert.equal((await call(entry({ name: "x".repeat(3000) }))).status, 413);
});

test("snow stickers are restricted to the snowcap", async () => {
  for (const sticker of ["snowy-owl", "alolan-vulpix", "glaceon"]) {
    const { call } = setup();
    assert.equal((await call(entry({ sticker, x: .46, y: .24 }))).status, 201);
    assert.equal((await call(entry({ sticker, x: .35, y: .72 }))).status, 400);
    assert.equal((await call(entry({ sticker, x: .08, y: .1 }))).status, 400);
    assert.equal((await call(entry({ sticker, x: .55, y: .545 }))).status, 400);
  }
  const { call } = setup();
  assert.equal((await call(entry({ sticker: "cloud", x: .46, y: .24 }))).status, 400);
});

test("grass near the horizon is placeable and removed saplings cannot be added", async () => {
  const { call } = setup();
  assert.equal((await call(entry({ sticker: "fern", x: .30, y: .57 }))).status, 201);
  assert.equal((await call(entry({ sticker: "seedling", x: .35, y: .72 }))).status, 400);
  assert.equal((await call(entry({ sticker: "fern", x: .46, y: .4 }))).status, 400);
});

test("native-resolution artwork regions match allowed placements", async () => {
  const page = await worker.fetch(new Request("https://example.test/side"), {}, { waitUntil() {}, passThroughOnException() {} });
  const html = await page.text();
  assert.match(html, /src="\/guestbook\/landscape.png"/);
  const { data, info } = await sharp(fileURLToPath(new URL("../public/guestbook/landscape-regions.png", import.meta.url))).raw().toBuffer({ resolveWithObject: true });
  const regions = {
    "82,153,229": ["sky", "cloud"], "84,178,65": ["land", "fern"],
    "44,107,183": ["lake", "duck"], "30,99,46": ["tree", "owl"],
    "255,255,255": ["snow", "snowy-owl"], "128,128,128": ["mountain", null],
    "115,72,37": ["trunk", null],
  };
  const bases = JSON.parse(await readFile(new URL("../src/guestbook-sticker-bases.json", import.meta.url), "utf8"));
  const widths = { cloud: .076, fern: .04, duck: .056, owl: .056, "snowy-owl": .056 };
  function centred(sticker, x, y) {
    return { sticker, x: x - bases[sticker].x * widths[sticker], y: y - bases[sticker].y * widths[sticker] * 1000 / 560 };
  }
  const seen = new Set();
  const keyAt = index => [...data.subarray(index * 3, index * 3 + 3)].join(",");
  for (let row = 0; row < info.height; row++) {
    let start = 0;
    let colour = keyAt(row * info.width);
    for (let column = 1; column <= info.width; column++) {
      const next = column < info.width ? keyAt(row * info.width + column) : null;
      if (next === colour) continue;
      const [terrain, sticker] = regions[colour];
      const x = (start + (column - start) / 2) / info.width;
      const y = (row + .5) / info.height;
      const { call } = setup();
      if (sticker) {
        const position = centred(sticker, x, y);
        if (position.x >= 0 && position.x < 1 && position.y >= 0 && position.y < 1)
          assert.equal((await call(entry(position))).status, 201, `${terrain} at ${x},${y}`);
      }
      const wrong = terrain === "land" ? "cloud" : "fern";
      assert.equal((await call(entry(centred(wrong, x, y)))).status, 400, `${wrong} in ${terrain}`);
      seen.add(terrain);
      start = column;
      colour = next;
    }
  }
  assert.deepEqual([...seen].sort(), ["sky", "land", "lake", "tree", "snow", "mountain", "trunk"].sort());
});

test("source sprites have transparent padding", async () => {
  const directory = new URL("../public/guestbook/stickers/", import.meta.url);
  const files = (await readdir(directory)).filter(file => file.endsWith(".png"));
  assert.equal(files.length, 59);
  for (const file of files) {
    const { data, info } = await sharp(fileURLToPath(new URL(file, directory))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const size = 64;
    assert.equal(info.width, size, file);
    assert.equal(info.height, size, file);
    const padding = 6;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (x < padding || y < padding || x >= size - padding || y >= size - padding) {
        assert.equal(data[(y * size + x) * 4 + 3], 0, `${file} has pixels outside its padded cell`);
      }
    }
  }
});

test("non-snow birds can use grass and retired stickers cannot be added", async () => {
  for (const sticker of ["songbird", "mourning-dove", "cardinal", "blue-jay", "owl", "barn-owl", "swan", "duck", "eurasian-coot", "black-swan"]) {
    const { call } = setup();
    assert.equal((await call(entry({ sticker, x: .35, y: .72 }))).status, 201, sticker);
  }
  for (const sticker of ["blossom", "flying-bird", "seedling"]) {
    const { call } = setup();
    assert.equal((await call(entry({ sticker, x: .35, y: .72 }))).status, 400, sticker);
  }
});

test("reference-style landscape includes a snowy mountain range", async () => {
  const directory = new URL("../public/guestbook/", import.meta.url);
  const manifest = JSON.parse(await readFile(new URL("landscape-sources.json", directory), "utf8"));
  assert.equal(manifest.mountains.length, 3);
  assert.deepEqual(manifest.trees.map(tree => tree.kind), ["oak", "oak", "cherry"]);
  assert.ok(manifest.mountains.every(mountain => mountain.base === .56));
  const image = await readFile(new URL("landscape.png", directory));
  assert.equal(createHash("sha256").update(image).digest("hex"), manifest.sceneSha256);
  const { data } = await sharp(fileURLToPath(new URL("landscape-regions.png", directory))).raw().toBuffer({ resolveWithObject: true });
  let snow = 0, rock = 0;
  for (let i = 0; i < data.length; i += 3) {
    if (data[i] === 255 && data[i+1] === 255 && data[i+2] === 255) snow++;
    if (data[i] === 128 && data[i+1] === 128 && data[i+2] === 128) rock++;
  }
  assert.ok(snow > rock, "Mountain range should have more snow than exposed rock");
});

test("guestbook accepts 20-character names and rejects longer ones", async () => {
  const { call } = setup();
  assert.equal((await call(entry({ name: "é".repeat(20) }))).status, 201);
  assert.equal((await call(entry({ name: "a".repeat(21), x: .3, y: .85 }))).status, 400);
});

test("Pokémon assets retain their recorded sprite sources", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/guestbook/pokemon-sources.json", import.meta.url), "utf8"));
  assert.equal(manifest.sprites.length, 9);
  for (const record of manifest.sprites) {
    const original = await readFile(new URL(`../public/guestbook/${record.sourceFile}`, import.meta.url));
    assert.equal(createHash("sha256").update(original).digest("hex"), record.sourceSha256, record.id);
    if (!record.url) {
      assert.ok(["xerneas", "alolan-vulpix"].includes(record.id));
      assert.equal(record.sourceFile, `supplied/${record.id}.png`);
      const supplied = await readFile(new URL(`../public/guestbook/${record.sourceFile}`, import.meta.url));
      assert.equal(createHash("sha256").update(supplied).digest("hex"), record.sourceSha256);
    } else {
      assert.ok(record.url.startsWith("https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/"));
    }
  }
});

test("stickers can overlap while exact stacking stays blocked", async () => {
  const large = setup();
  assert.equal((await large.call(entry({ sticker: "deer", x: .30, y: .8 }))).status, 201);
  assert.equal((await large.call(entry({ sticker: "deer", x: .34, y: .8 }))).status, 201);
  assert.equal((await large.call(entry({ sticker: "deer", x: .305, y: .8 }))).status, 409);
  const small = setup();
  assert.equal((await small.call(entry({ sticker: "daisy", x: .30, y: .8 }))).status, 201);
  assert.equal((await small.call(entry({ sticker: "daisy", x: .34, y: .8 }))).status, 201);
});

test("each star colour is accepted in the sky", async () => {
  for (const sticker of ["star", "star-white", "star-yellow", "star-red"]) {
    const { call } = setup();
    assert.equal((await call(entry({ sticker, x: .1, y: .1 }))).status, 201, sticker);
    assert.equal((await call(entry({ sticker, x: .3, y: .8 }))).status, 400, sticker);
  }
});

test("bunny and snail can be placed on grass", async () => {
  for (const sticker of ["bunny", "snail"]) {
    const { call } = setup();
    assert.equal((await call(entry({ sticker, x: .3, y: .8 }))).status, 201);
    assert.equal((await call(entry({ sticker, x: .68, y: .78 }))).status, 400);
  }
});

test("stickers have clean transparent pixel sprite assets", async () => {
  const directory = new URL("../public/guestbook/stickers/", import.meta.url);
  const files = (await readdir(directory)).filter(file => file.endsWith(".png") && !file.endsWith("-cursor.png"));
  assert.ok(files.length >= 50);
  assert.ok(files.every(file => !file.endsWith("-flat.png") && !file.endsWith("-simple.png")));
  const { data, info } = await sharp(fileURLToPath(new URL("cat.png", directory))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 64);
  assert.equal(info.height, 64);
  const colours = new Set();
  for (let i = 0; i < data.length; i += 4) if (data[i+3]) colours.add([...data.subarray(i, i+4)].join(","));
  assert.ok(colours.size > 1, "Cat should retain its colour markings");
  for (let i = 3; i < data.length; i += 4) assert.ok(data[i] === 0 || data[i] === 255, "Pixel contours must be opaque or transparent");
});

test("grass replaces the distant hill band up to the mountain", async () => {
  const { call } = setup();
  for (const [x, y] of [[.3, .57], [.5, .57], [.7, .57]]) {
    const response = await call(entry({ sticker: "fern", x, y }));
    assert.equal(response.status, 201, `Unusable meadow at ${x},${y}`);
  }
});

test("Celebi and Mew can use the sky and grass", async () => {
  for (const sticker of ["celebi", "mew"]) {
    const { call } = setup();
    assert.equal((await call(entry({ sticker, x: .1, y: .1 }))).status, 201);
    assert.equal((await call(entry({ sticker, x: .3, y: .8 }))).status, 201);
    assert.equal((await call(entry({ sticker, x: .68, y: .78 }))).status, 400);
  }
});

test("sprite assets contain only rebuild sources and displayed artwork", async () => {
  const model = await readFile(new URL("../src/guestbook-model.ts", import.meta.url), "utf8");
  const ids = [...model.matchAll(/id: "([^"]+)"[^\n]+sprite: /g)].map(match => match[1]);
  const manifest = JSON.parse(await readFile(new URL("../public/guestbook/pokemon-sources.json", import.meta.url), "utf8"));
  const pokemon = new Set(manifest.sprites.map(item => item.id));
  const expected = ids.flatMap(id => pokemon.has(id) ? [id + ".svg"] : [id + ".png", id + "-soft.svg"]);
  const files = await readdir(new URL("../public/guestbook/stickers/", import.meta.url));
  assert.deepEqual(files.sort(), expected.sort());
});

test("leaf sheep sea slug belongs in the lake", async () => {
  const { call } = setup();
  assert.equal((await call(entry({ sticker: "leaf-sheep", x: .68, y: .78 }))).status, 201);
  assert.equal((await call(entry({ sticker: "leaf-sheep", x: .3, y: .8 }))).status, 400);
  assert.equal((await call(entry({ sticker: "leaf-sheep", x: .1, y: .1 }))).status, 400);
});


test("new flowers belong on grass and insects can use sky, grass, or tree canopy", async () => {
  for (const sticker of ["pink-orchid", "yellow-orchid", "lily-of-the-valley", "pansies", "bleeding-hearts"]) {
    const { call } = setup();
    assert.equal((await call(entry({ sticker, x: .3, y: .8 }))).status, 201);
    assert.equal((await call(entry({ sticker, x: .68, y: .78 }))).status, 400);
  }
  for (const sticker of ["amber-moth", "yellow-butterfly", "violet-butterfly", "swallowtail-butterfly", "red-butterfly", "white-butterfly", "rust-moth", "pink-eyespot-moth"]) {
    for (const [x, y] of [[.1, .1], [.3, .8], [.14, .43]]) {
      const { call } = setup();
      assert.equal((await call(entry({ sticker, x, y }))).status, 201, sticker);
    }
    const { call } = setup();
    assert.equal((await call(entry({ sticker, x: .68, y: .78 }))).status, 400);
  }
});


test("Usagi belongs on grass", async () => {
  const { call } = setup();
  assert.equal((await call(entry({ sticker: "usagi", x: .3, y: .8 }))).status, 201);
  assert.equal((await call(entry({ sticker: "usagi", x: .1, y: .1 }))).status, 400);
});

test("scalable sticker artwork has solid cells without image filters", async () => {
  const directory = new URL("../public/guestbook/stickers/", import.meta.url);
  const files = (await readdir(directory)).filter(file => file.endsWith("-soft.svg"));
  assert.equal(files.length, 59);
  for (const file of files) {
    const svg = await readFile(new URL(file, directory));
    assert.match(svg.toString(), file === "usagi-soft.svg" ? /viewBox="0 0 80 80" shape-rendering="crispEdges"/ : /viewBox="0 0 64 64" shape-rendering="crispEdges"/);
    assert.doesNotMatch(svg.toString(), /<image|<filter|gradient|stroke=/);
    const vector = await sharp(svg, { density: 72 }).ensureAlpha().raw().toBuffer();
    for (let i = 3; i < vector.length; i += 4) assert.ok(vector[i] === 0 || vector[i] === 255, file);
    if (file === "usagi-soft.svg") {
      const source = await sharp(fileURLToPath(new URL("../supplied/usagi-grid.png", directory))).ensureAlpha().raw().toBuffer();
      assert.deepEqual(vector, source);
    }
  }
});

test("every painted meadow pixel is classified as land", async () => {
  const scene = await sharp(fileURLToPath(new URL("../public/guestbook/landscape.png", import.meta.url))).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const map = JSON.parse(await readFile(new URL("../src/guestbook-map.json", import.meta.url), "utf8"));
  const terrain = new Uint8Array(map.width * map.height);
  let offset = 0;
  for (const run of map.runs.split(".")) {
    const length = parseInt(run.slice(0, -1), 36);
    terrain.fill(Number(run.slice(-1)), offset, offset + length);
    offset += length;
  }
  const grass = new Set(["709757", "7da562", "8bb16e", "98bb7b", "a8c78a", "b3ce97"]);
  assert.equal(scene.info.width, map.width);
  assert.equal(scene.info.height, map.height);
  let checked = 0;
  for (let pixel = 0; pixel < terrain.length; pixel++) {
    if (!grass.has(scene.data.subarray(pixel * 3, pixel * 3 + 3).toString("hex"))) continue;
    assert.equal(map.zones[terrain[pixel]], "land", `Grass at ${pixel % map.width},${Math.floor(pixel / map.width)}`);
    checked++;
  }
  assert.ok(checked > 160_000);
});


test("detailed reference sprites retain their native cells", async () => {
  const directory = new URL("../public/guestbook/", import.meta.url);
  const xerneas = await sharp(await readFile(new URL("stickers/xerneas.svg", directory))).ensureAlpha().raw().toBuffer();
  const source = await sharp(fileURLToPath(new URL("supplied/xerneas.png", directory)))
    .resize(90, 100, { kernel: "nearest" }).extend({ top: 14, bottom: 14, left: 19, right: 19, background: "#0000" }).ensureAlpha().raw().toBuffer();
  assert.deepEqual(xerneas, source);
  const usagi = await sharp(fileURLToPath(new URL("supplied/usagi-grid.png", directory))).ensureAlpha().raw().toBuffer();
  let highlights = 0;
  for (let i = 0; i < usagi.length; i += 4) if (usagi[i] === 250 && usagi[i + 1] === 248 && usagi[i + 2] === 239 && usagi[i + 3] === 255) highlights++;
  assert.equal(highlights, 7);
});

test("all Pokémon artwork keeps every native opaque cell and colour", async () => {
  const directory = new URL("../public/guestbook/", import.meta.url);
  const records = JSON.parse(await readFile(new URL("pokemon-sources.json", directory), "utf8")).sprites;
  function colours(data) {
    const counts = new Map();
    for (let i = 0; i < data.length; i += 4) if (data[i + 3]) {
      const key = [...data.subarray(i, i + 4)].join(",");
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }
  for (const record of records) {
    let original = sharp(fileURLToPath(new URL(record.sourceFile, directory)));
    if (record.id === "xerneas") original = original.resize(90, 100, { kernel: "nearest" });
    if (record.id === "alolan-vulpix") original = original.resize(53, 46, { kernel: "nearest" });
    const source = await original.ensureAlpha().raw().toBuffer();
    const svg = await sharp(await readFile(new URL(`stickers/${record.id}.svg`, directory))).ensureAlpha().raw().toBuffer();
    assert.deepEqual(colours(svg), colours(source), record.id);
  }
});


test("supplied enlarged Pokémon have uniform blocks with no lost subcell detail", async () => {
  for (const [id, width, height] of [["xerneas", 90, 100], ["alolan-vulpix", 53, 46]]) {
    const path = fileURLToPath(new URL(`../public/guestbook/supplied/${id}.png`, import.meta.url));
    const original = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const restored = await sharp(await sharp(path).resize(width, height, { kernel: "nearest" }).png().toBuffer())
      .resize(original.info.width, original.info.height, { kernel: "nearest" }).ensureAlpha().raw().toBuffer();
    assert.ok(restored.equals(original.data), id);
  }
});


test("the visible sticker base determines placement across region boundaries", async () => {
  for (const [x, y, expected] of [[.3, .54, 201], [.3, .50, 400], [.65, .61, 400]]) {
    const { call } = setup();
    assert.equal((await call(entry({ sticker: "sunflower", x, y }))).status, expected, `${x},${y}`);
  }
});

test("optional sticker messages persist and are included in retry checks", async () => {
  const { storage, call } = setup();
  const submission = entry({ message: "  Hello\r\nfrom the pond!  " });
  const response = await call(submission);
  assert.equal(response.status, 201);
  const saved = (await response.json()).entry;
  assert.equal(saved.message, "Hello\nfrom the pond!");
  assert.equal((await call(submission)).status, 200);
  assert.equal((await call({ ...submission, message: "Different message" })).status, 409);
  const recreated = new Guestbook({ storage });
  const list = await recreated.fetch(new Request("https://example.test/api/guestbook"));
  assert.deepEqual((await list.json()).entries, [saved]);
});

test("sticker messages are optional and limited to 150 characters", async () => {
  for (const message of [undefined, "", "   "]) {
    const { call } = setup();
    const response = await call(entry({ message }));
    assert.equal(response.status, 201);
    assert.equal((await response.json()).entry.message, undefined);
  }
  for (const message of ["🌸".repeat(150), "A short note\nwith two lines."]) {
    const { call } = setup();
    const response = await call(entry({ message }));
    assert.equal(response.status, 201);
    assert.equal((await response.json()).entry.message, message);
  }
  for (const message of ["a".repeat(151), "bad\u0000message", 42, null, {}]) {
    const { call } = setup();
    assert.equal((await call(entry({ message }))).status, 400);
  }
});


test("visitor names accept 20 characters and reject 21", async () => {
  for (const [name, expected] of [["a".repeat(20), 201], ["a".repeat(21), 400]]) {
    const { call } = setup();
    assert.equal((await call(entry({ name }))).status, expected);
  }
});


test("the laggy button embeds Boris's original favicon artwork", async () => {
  const original = await readFile(new URL("../public/buttons/boris-favicon.svg", import.meta.url));
  assert.equal(createHash("sha1").update(`blob ${original.length}\0`).update(original).digest("hex"), "0349d8cbd0b99e0a519be3695b5bf2fa369b8c8e");
  const button = await readFile(new URL("../public/buttons/laggy.svg", import.meta.url), "utf8");
  for (const path of original.toString().matchAll(/<path[^>]+>/g)) assert.ok(button.includes(path[0]));
});

test("the bunny button uses solid-colour vector cells", async () => {
  const svg = await readFile(new URL("../public/buttons/bunnies.svg", import.meta.url), "utf8");
  assert.match(svg, /shape-rendering="crispEdges"/);
  assert.doesNotMatch(svg, /<image|<filter|gradient|fill-opacity|stroke=/);
  const { data } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const colours = new Set();
  for (let i = 0; i < data.length; i += 4) {
    assert.ok(data[i + 3] === 0 || data[i + 3] === 255);
    if (data[i + 3]) colours.add([...data.subarray(i, i + 3)].join(","));
  }
  assert.equal(colours.size, 1);
});
