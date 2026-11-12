import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const base = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/";
const sources = {
  celebi: ["generation-v/black-white/251.png", "Black/White battle sprite"],
  mew: ["generation-v/black-white/151.png", "Black/White battle sprite"],
  leafeon: ["generation-v/black-white/470.png", "Black/White battle sprite"],
  absol: ["generation-v/black-white/359.png", "Black/White battle sprite"],
  lilligant: ["generation-v/black-white/549.png", "Black/White battle sprite"],
  turtwig: ["generation-v/black-white/387.png", "Black/White battle sprite"],
  glaceon: ["generation-v/black-white/471.png", "Black/White battle sprite"],
  xerneas: ["local:supplied/xerneas.png", "User-supplied rainbow-antler Xerneas sprite"],
  "alolan-vulpix": ["local:supplied/alolan-vulpix.png", "User-supplied Alolan Vulpix sprite"],
};
const records = await Promise.all(Object.entries(sources).map(async ([id, [path, game]]) => {
  const local = path.startsWith("local:");
  const url = local ? null : base + path;
  const original = local
    ? await readFile(new URL("../public/guestbook/" + path.slice(6), import.meta.url))
    : await (async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${id}: ${response.status} from ${url}`);
      return Buffer.from(await response.arrayBuffer());
    })();
  if (!local) await writeFile(new URL(`../public/guestbook/supplied/${id}-original.png`, import.meta.url), original);
  return { id, game, ...(local ? { sourceFile: path.slice(6) } : { url, sourceFile: `supplied/${id}-original.png` }), sourceSha256: createHash("sha256").update(original).digest("hex") };
}));
await writeFile(new URL("../public/guestbook/pokemon-sources.json", import.meta.url), JSON.stringify({
  credit: "Pokémon sprites © Nintendo / Creatures / GAME FREAK. Hosted by PokéAPI.",
  repository: "https://github.com/PokeAPI/sprites", sprites: records,
}, null, 2) + "\n");
console.log(`Saved ${records.length} original Pokémon sprites.`);
