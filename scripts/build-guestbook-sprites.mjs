import sharp from "sharp";
import { extractGuestbookSprite as extract } from "./guestbook-sprite-utils.mjs";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, writeFile } from "node:fs/promises";

// Extract independent, padded sprites from generated sheets. Keep only the
// main connected silhouette so adjacent cells and stray pixels cannot bleed.
const [source, animals, star, pets, stars, fourPoints] = process.argv.slice(2);
if (!source) throw new Error("Usage: node scripts/build-guestbook-sprites.mjs source.png [animals.png] [star.png] [pets.png] [star-colours.png] [four-point-stars.png] [--stars-only|--restore-non-pokemon]");
const model = await readFile(new URL("../src/guestbook-model.ts", import.meta.url), "utf8");
const stickers = [...model.matchAll(/id: "([^"]+)"[^\n]+sprite: (\d+)/g)].map(([, id, sprite]) => ({ id, sprite: Number(sprite) }));
const output = new URL("../public/guestbook/stickers/", import.meta.url);
await mkdir(output, { recursive: true });


const replacements = { swan: 0, duck: 1, "eurasian-coot": 2, "black-swan": 3, cat: 4, dog: 5 };
let processed = 0;
for (const { id, sprite } of stickers) {
  if (["bunny", "snail", "leaf-sheep", "celebi", "mew", "pink-orchid", "yellow-orchid", "lily-of-the-valley", "amber-moth", "yellow-butterfly", "violet-butterfly", "swallowtail-butterfly", "red-butterfly", "white-butterfly", "rust-moth", "pink-eyespot-moth", "pansies", "bleeding-hearts", "usagi"].includes(id)) continue;
  const starIndex = ["star", "star-white", "star-yellow", "star-red"].indexOf(id);
  if (process.argv.includes("--stars-only") && starIndex < 0) continue;
  if (["leafeon", "absol", "lilligant", "turtwig", "xerneas", "alolan-vulpix", "glaceon"].includes(id)) continue;
  const replacement = animals && Object.hasOwn(replacements, id);
  const variantIndex = ["star-white", "star-yellow", "star-red"].indexOf(id);
  const image = fourPoints && starIndex >= 0
    ? await sharp(await extract(fourPoints, starIndex, 2, 2)).resize(48, 48, { kernel: "nearest" })
      .extend({ top: 8, bottom: 8, left: 8, right: 8, background: "#0000" }).png().toBuffer()
    : stars && variantIndex >= 0
    ? await sharp(await extract(stars, variantIndex, 3, 1)).resize(48, 48, { kernel: "nearest" })
      .extend({ top: 8, bottom: 8, left: 8, right: 8, background: "#0000" }).png().toBuffer()
    : pets && (id === "cat" || id === "dog")
    ? await extract(pets, id === "cat" ? 0 : 1, 2, 1)
    : id === "star" && star
    ? await sharp(star).trim({ threshold: 12 }).resize(40, 40, { fit: "contain", background: "#0000", kernel: "nearest" })
      .extend({ top: 12, bottom: 12, left: 12, right: 12, background: "#0000" }).png().toBuffer()
    : await extract(replacement ? animals : source, replacement ? replacements[id] : sprite, replacement ? 3 : 7, replacement ? 2 : 7);
  await writeFile(new URL(`${id}.png`, output), image);
  processed++;
}
console.log(`Extracted ${processed} isolated sprites.`);
