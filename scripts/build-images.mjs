import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Originals remain the source of truth. Filenames include the source and recipe
// hash, so generated assets can be cached immutably without stale replacements.
const recipe = `webp-v2-${sharp.versions.sharp}-thumb78-full86`;
const groups = ["photos", "food-photos", "natural-things", "scrapbook", "music-covers", "pokemon-cards"];
const outputRoot = "public/media";
await mkdir(outputRoot, { recursive: true });
await mkdir("src/generated/media", { recursive: true });
const generatedFiles = new Set();
const generatedSources = new Map();
let originalBytes = 0;
let thumbnailBytes = 0;

for (const group of [...groups, "icons"]) {
  const directory = group === "icons" ? "public" : `public/${group}`;
  const filenames = group === "icons"
    ? ["ontario-science-centre.png", "university-of-toronto.png", "tong-calligraphy.png"]
    : (await readdir(directory)).filter((name) => /\.(jpe?g|png|webp)$/i.test(name)).sort();
  const manifest = {};
  for (const filename of filenames) {
    const input = await readFile(path.join(directory, filename));
    const isScienceCentre = group === "icons" && filename === "ontario-science-centre.png";
    const sourceHash = createHash("sha256").update(recipe)
      .update(isScienceCentre ? "-black-v1" : "").update(input).digest("hex");
    const hash = sourceHash.slice(0, 12);
    const image = sharp(input).rotate();
    // Bake the logo's fixed black fill; only inversion animates in CSS.
    if (isScienceCentre) image.linear(0);
    const metadata = await image.metadata();
    const width = metadata.autoOrient.width;
    const height = metadata.autoOrient.height;
    // Preserve the Science Centre logo's existing cover crop; its box is almost
    // square, so reducing the whole wordmark would throw away the emblem detail.
    const targetWidth = group === "icons" ? (isScienceCentre ? 280 : 128) : width;
    const widths = group === "icons"
      ? [targetWidth]
      : [...new Set([160, 320, 480, 960, width].filter((w) => w <= width))].sort((a, b) => a - b);
    // Match the full input/recipe digest, widths and icon-specific quality rule.
    const cacheKey = `${sourceHash}:${widths.join(",")}:${group === "icons"}`;
    let sources = generatedSources.get(cacheKey);
    if (!sources) {
      sources = [];
      for (const size of widths) {
        const name = `${group}-${path.parse(filename).name}-${hash}-${size}.webp`;
        const output = path.join(outputRoot, name);
        generatedFiles.add(name);
        let bytes;
        try { bytes = (await readFile(output)).length; }
        catch {
          const result = await image.clone().resize({ width: size, withoutEnlargement: true })
            .webp({ quality: size <= 480 && size < width && group !== "icons" ? 78 : 86, effort: 5 }).toBuffer();
          await writeFile(output, result);
          bytes = result.length;
        }
        sources.push({ src: `/media/${name}`, width: size, bytes });
      }
      generatedSources.set(cacheKey, sources);
      thumbnailBytes += (sources.find((source) => source.width >= 320) ?? sources.at(-1)).bytes;
    }
    const src = `/${group === "icons" ? "" : `${group}/`}${filename}`;
    manifest[src] = { width, height, sources: sources.map(({ src, width }) => ({ src, width })) };
    originalBytes += input.length;
  }
  await writeFile(`src/generated/media/${group}.json`, `${JSON.stringify(manifest)}\n`);
}
for (const filename of await readdir(outputRoot)) {
  if (filename.endsWith(".webp") && !generatedFiles.has(filename)) await unlink(path.join(outputRoot, filename));
}
console.log(`Images ready: ${(originalBytes / 1048576).toFixed(2)} MiB originals; ${(thumbnailBytes / 1048576).toFixed(2)} MiB unique candidates at ~320px.`);
