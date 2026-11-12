import sharp from "sharp";
import { pixelSvg } from "./guestbook-pixel-svg.mjs";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";

// Apply one shared palette to the scalable sticker artwork.
const model = await readFile(new URL("../src/guestbook-model.ts", import.meta.url), "utf8");
const pokemon = new Set(model.match(/guestbookPokemonIds[^=]*= new Set\(\[([\s\S]*?)\]/)[1].match(/"[^"]+"/g).map(value => JSON.parse(value)));
const ids = [...model.matchAll(/id: "([^"]+)"[^\n]+sprite: /g)].map(match => match[1]).filter(id => !pokemon.has(id));
const flowers = new Set([
  "bloodroot", "daisy", "lavender", "tulip", "columbine", "sweet-peas",
  "snapdragon", "dahlia", "peony", "calla-lily", "sunflower", "lotus", "pink-orchid", "yellow-orchid", "lily-of-the-valley", "pansies", "bleeding-hearts",
]);
const directory = new URL("../public/guestbook/stickers/", import.meta.url);
for (const id of ids) {
  const contrast = .72;
  const { data, info } = await sharp(fileURLToPath(new URL(`${id}.png`, directory))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let pixel = 0; pixel < data.length; pixel += 4) {
    if (!data[pixel + 3]) continue;
    // Preserve the leaf sheep's tiny eyes instead of fading them with the body.
    if (id === "leaf-sheep" && Math.max(data[pixel], data[pixel + 1], data[pixel + 2]) < 75) continue;
    const [red, green, blue] = data.subarray(pixel, pixel + 3);
    if (id === "dahlia" && red > green * 1.5 && green < 85) {
      data.set(red < 130 ? [166, 89, 85] : red < 175 ? [193, 111, 93] : [216, 137, 106], pixel);
      continue;
    }
    if (id === "usagi") {
      const colour = Math.min(red, green, blue) > 235 ? [250, 248, 239]
        : green < 120 && blue < 110 && red < 180 ? [93, 70, 53]
        : red > green * 1.1 && blue > green * 1.1 ? [225, 151, 179]
        : green > 236 ? [246, 235, 192] : [238, 226, 179];
      data.set(colour, pixel);
      continue;
    }
    let petals;
    if (id === "calla-lily" && red > 180 && green > 170 && blue > 130 && Math.abs(red - green) < 40) {
      petals = green < 233 ? [128, 41, 62] : [139, 48, 69];
    } else if (id === "sweet-peas" && blue > green * 1.1 && blue > red * .9) {
      petals = green < 125 ? [240, 225, 159] : [250, 238, 177];
    }
    if (id === "lavender" && blue > green * 1.1 && blue > red * .9) {
      petals = red < 135 ? [150, 126, 188] : red > 170 ? [184, 162, 216] : [164, 141, 201];
    }
    if (petals) data.set(petals, pixel);
    if (flowers.has(id) && !(green > red + 8 && green > blue + 8)) {
      // Pastel petals retain their hue; foliage uses the shared soft palette.
      const tint = id === "calla-lily" ? .12 : id === "sweet-peas" ? .14 : id === "dahlia" ? .32 : .2;
      const ivory = [250, 240, 228];
      for (let channel = 0; channel < 3; channel++) data[pixel + channel] = Math.round(data[pixel + channel] * (1 - tint) + ivory[channel] * tint);
      continue;
    }
    const grey = .213 * data[pixel] + .715 * data[pixel + 1] + .072 * data[pixel + 2];
    for (let channel = 0; channel < 3; channel++) {
      const saturated = .65 * data[pixel + channel] + .35 * grey;
      data[pixel + channel] = Math.round(Math.min(255, Math.max(0, (saturated * contrast + 255 * (1 - contrast) / 2) * 1.1)));
    }
    if (id === "cat") {
      const softness = Math.max(0, .4 * (1 - grey / 180));
      const warm = [206, 185, 160];
      for (let channel = 0; channel < 3; channel++)
        data[pixel + channel] = Math.round(data[pixel + channel] * (1 - softness) + warm[channel] * softness);
    }

  }
  const encoded = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ palette: true, colours: id === "dahlia" ? 16 : id === "usagi" ? 12 : 24, dither: 0 }).toBuffer();
  const cells = await sharp(encoded).ensureAlpha().raw().toBuffer();
  for (let i = 0; i < cells.length; i += 4) {
    if (cells[i + 3] < 128) cells.fill(0, i, i + 4);
    else cells[i + 3] = 255;
  }
  await writeFile(new URL(`${id}-soft.svg`, directory), pixelSvg(cells, 64, 64));
}
// Usagi's reference has more cells than the standard thumbnail frame can hold.
const usagi = await sharp(fileURLToPath(new URL("../public/guestbook/supplied/usagi-grid.png", import.meta.url))).ensureAlpha().raw().toBuffer();
await writeFile(new URL("usagi-soft.svg", directory), pixelSvg(usagi, 80, 80));
// Preserve every original Pokémon pixel and colour, using scalable cells too.
for (const id of pokemon) {
  const filename = id === "xerneas" || id === "alolan-vulpix" ? `${id}.png` : `${id}-original.png`;
  let source = sharp(fileURLToPath(new URL(`../public/guestbook/supplied/${filename}`, import.meta.url)));
  // Supplied enlargements consist of exact 16×16 or 4×4 blocks per art cell.
  if (id === "xerneas") source = source.resize(90, 100, { kernel: "nearest" });
  if (id === "alolan-vulpix") source = source.resize(53, 46, { kernel: "nearest" });
  const original = await source.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = original.info.width, y0 = original.info.height, x1 = 0, y1 = 0;
  for (let y = 0; y < original.info.height; y++) for (let x = 0; x < original.info.width; x++) {
    if (!original.data[(y * original.info.width + x) * 4 + 3]) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  // Alpha bounds retain isolated edge cells that colour-based trimming can drop.
  if (id === "xerneas") { x0 = 0; y0 = 0; x1 = original.info.width - 1; y1 = original.info.height - 1; }
  const dimensions = { width: x1 - x0 + 1, height: y1 - y0 + 1 };
  const native = await sharp(original.data, { raw: original.info }).extract({ left: x0, top: y0, ...dimensions }).png().toBuffer();
  const frame = id === "xerneas" ? 128 : Math.ceil(Math.max(dimensions.width, dimensions.height) * 64 / 52);
  const left = Math.floor((frame - dimensions.width) / 2), top = Math.floor((frame - dimensions.height) / 2);
  const { data, info } = await sharp(native).extend({ left, top, right: frame - dimensions.width - left,
    bottom: frame - dimensions.height - top, background: "#0000" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  await writeFile(new URL(`${id}.svg`, directory), pixelSvg(data, info.width, info.height));
}
console.log(`Built ${ids.length} logical-grid sprites.`);

// Placement uses the visible bottom edge, not the centre of the padded frame.
const bases = {};
for (const id of [...ids, ...pokemon]) {
  const suffix = pokemon.has(id) ? "" : "-soft";
  const { data, info } = await sharp(await readFile(new URL(`${id}${suffix}.svg`, directory)))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = info.height - 1; y >= 0; y--) {
    const columns = [];
    for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3]) columns.push(x);
    if (!columns.length) continue;
    bases[id] = {
      x: Number(((columns[0] + columns.at(-1) + 1) / 2 / info.width - .5).toFixed(8)),
      y: Number(((y + 1) / info.height - .5).toFixed(8)),
    };
    break;
  }
}
await writeFile(new URL("../src/guestbook-sticker-bases.json", import.meta.url), JSON.stringify(bases) + "\n");
