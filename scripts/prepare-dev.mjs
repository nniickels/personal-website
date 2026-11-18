import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const manifests = ["photos", "postcard-photos", "natural-things", "scrapbook", "music-covers", "pokemon-cards", "icons"];
const ready = manifests.every(group => existsSync(`src/generated/media/${group}.json`))
  && existsSync("public/media") && readdirSync("public/media").some(file => file.endsWith(".webp"))
  && existsSync("public/guestbook/stickers/daisy-soft.png");

if (ready) {
  console.log("Using generated images. After changing artwork, run npm run images:build.");
} else {
  const result = spawnSync("npm", ["run", "images:build"], { stdio: "inherit" });
  if (result.error) console.error(result.error.message);
  process.exit(result.status ?? 1);
}
