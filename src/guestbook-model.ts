import guestbookMap from "./guestbook-map.json";
import stickerBases from "./guestbook-sticker-bases.json";

export const guestbookNameLimit = 20;
export const guestbookMessageLimit = 150;

export type GuestbookZone = "sky" | "land" | "lake" | "tree" | "snow";

export const guestbookStickers = [
  { id: "lilypad", label: "Lily pad", zone: "lake", sprite: 0 },
  { id: "fern", label: "Fern", zone: "land", sprite: 1 },
  { id: "mossy-rock", label: "Mossy rock", zone: "land", sprite: 2 },
  { id: "mushroom", label: "Mushroom", zone: "land", sprite: 3 },
  { id: "cloud", label: "Cloud", zone: "sky", sprite: 4 },
  { id: "star", label: "Blue-white star", zone: "sky", sprite: 5 },
  { id: "star-white", label: "White star", zone: "sky", sprite: 5 },
  { id: "star-yellow", label: "Yellow star", zone: "sky", sprite: 5 },
  { id: "star-red", label: "Red star", zone: "sky", sprite: 5 },
  { id: "bloodroot", label: "Bloodroot", zone: "land", sprite: 6 },
  { id: "daisy", label: "Oxeye daisy", zone: "land", sprite: 7 },
  { id: "lavender", label: "Lavender", zone: "land", sprite: 8 },
  { id: "tulip", label: "Tulip", zone: "land", sprite: 9 },
  { id: "columbine", label: "Columbine", zone: "land", sprite: 10 },
  { id: "sweet-peas", label: "Sweet peas", zone: "land", sprite: 11 },
  { id: "snapdragon", label: "Snapdragon", zone: "land", sprite: 12 },
  { id: "dahlia", label: "Dahlia", zone: "land", sprite: 13 },
  { id: "peony", label: "Peony", zone: "land", sprite: 14 },
  { id: "calla-lily", label: "Calla lily", zone: "land", sprite: 15 },
  { id: "songbird", label: "Chickadee", zone: "tree", sprite: 16 },
  { id: "mourning-dove", label: "Mourning dove", zone: "tree", sprite: 17 },
  { id: "deer-fawn", label: "Fawn", zone: "land", sprite: 18 },
  { id: "deer-doe", label: "Doe", zone: "land", sprite: 19 },
  { id: "deer", label: "Buck", zone: "land", sprite: 20 },
  { id: "owl", label: "Great horned owl", zone: "tree", sprite: 21 },
  { id: "barn-owl", label: "Barn owl", zone: "tree", sprite: 22 },
  { id: "snowy-owl", label: "Snowy owl", zone: "snow", sprite: 23 },
  { id: "cardinal", label: "Cardinal", zone: "tree", sprite: 24 },
  { id: "blue-jay", label: "Blue jay", zone: "tree", sprite: 25 },
  { id: "swan", label: "Swan", zone: "lake", sprite: 26 },
  { id: "duck", label: "Mallard", zone: "lake", sprite: 27 },
  { id: "eurasian-coot", label: "Eurasian coot", zone: "lake", sprite: 28 },
  { id: "black-swan", label: "Black swan", zone: "lake", sprite: 29 },
  { id: "cat", label: "Cat", zone: "land", sprite: 30 },
  { id: "chipmunk", label: "Chipmunk", zone: "land", sprite: 31 },
  { id: "batman", label: "Batman", zone: "land", sprite: 32 },
  { id: "leafeon", label: "Leafeon", zone: "land", sprite: 33 },
  { id: "absol", label: "Absol", zone: "land", sprite: 34 },
  { id: "lilligant", label: "Lilligant", zone: "land", sprite: 35 },
  { id: "turtwig", label: "Turtwig", zone: "land", sprite: 36 },
  { id: "xerneas", label: "Xerneas", zone: "land", sprite: 37 },
  { id: "alolan-vulpix", label: "Alolan Vulpix", zone: "snow", sprite: 38 },
  { id: "glaceon", label: "Glaceon", zone: "snow", sprite: 39 },
  { id: "sunflower", label: "Sunflower", zone: "land", sprite: 40 },
  { id: "blossom", label: "Blossom", zone: "land", sprite: 41 },
  { id: "seedling", label: "Seedling", zone: "land", sprite: 42 },
  { id: "dog", label: "Dog", zone: "land", sprite: 43 },
  { id: "flying-bird", label: "Flying bird", zone: "sky", sprite: 44 },
  { id: "lotus", label: "Lotus flower", zone: "lake", sprite: 45 },
  { id: "bunny", label: "Bunny", zone: "land", sprite: 0 },
  { id: "snail", label: "Snail", zone: "land", sprite: 0 },
  { id: "leaf-sheep", label: "Leaf sheep sea slug", zone: "lake", sprite: 0 },
  { id: "celebi", label: "Celebi", zone: "sky", sprite: 0 },
  { id: "mew", label: "Mew", zone: "sky", sprite: 0 },
  { id: "pink-orchid", label: "Pink orchid", zone: "land", sprite: 0 },
  { id: "yellow-orchid", label: "Yellow orchid", zone: "land", sprite: 0 },
  { id: "lily-of-the-valley", label: "Lily of the valley", zone: "land", sprite: 0 },
  { id: "pansies", label: "Pansies", zone: "land", sprite: 0 },
  { id: "bleeding-hearts", label: "Bleeding hearts", zone: "land", sprite: 0 },
  { id: "usagi", label: "Usagi", zone: "land", sprite: 0 },
  { id: "amber-moth", label: "Amber moth", zone: "sky", sprite: 0 },
  { id: "yellow-butterfly", label: "Yellow butterfly", zone: "sky", sprite: 0 },
  { id: "violet-butterfly", label: "Violet butterfly", zone: "sky", sprite: 0 },
  { id: "swallowtail-butterfly", label: "Swallowtail butterfly", zone: "sky", sprite: 0 },
  { id: "red-butterfly", label: "Red butterfly", zone: "sky", sprite: 0 },
  { id: "white-butterfly", label: "White butterfly", zone: "sky", sprite: 0 },
  { id: "rust-moth", label: "Rust moth", zone: "sky", sprite: 0 },
  { id: "pink-eyespot-moth", label: "Pink eyespot moth", zone: "sky", sprite: 0 },
] as const satisfies readonly { id: string; label: string; zone: GuestbookZone; sprite: number }[];

export type GuestbookStickerId = (typeof guestbookStickers)[number]["id"];
export type GuestbookEntry = {
  id: string;
  sticker: GuestbookStickerId;
  name: string;
  message?: string;
  x: number;
  y: number;
  placedAt: string;
};
export type GuestbookSubmission = Omit<GuestbookEntry, "placedAt">;

export type GuestbookTerrain = GuestbookZone | "mountain" | "trunk";
export const guestbookPixelWidth = guestbookMap.width;
export const guestbookPixelHeight = guestbookMap.height;

// This mask is generated while composing the actual artwork, at its native
// resolution. Client and server use the same regions, including leaf gaps.
const terrainPixels = new Uint8Array(guestbookPixelWidth * guestbookPixelHeight);
let offset = 0;
for (const run of guestbookMap.runs.split(".")) {
  const length = parseInt(run.slice(0, -1), 36);
  terrainPixels.fill(Number(run.slice(-1)), offset, offset + length);
  offset += length;
}
export function guestbookTerrainAt(x: number, y: number): GuestbookTerrain | null {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x >= 1 || y < 0 || y >= 1) return null;
  const index = Math.floor(y * guestbookPixelHeight) * guestbookPixelWidth + Math.floor(x * guestbookPixelWidth);
  return guestbookMap.zones[terrainPixels[index]] as GuestbookTerrain;
}

const retiredGuestbookStickers: ReadonlySet<string> = new Set(["seedling", "blossom", "flying-bird"]);
const guestbookBirds: ReadonlySet<string> = new Set([
  "songbird", "mourning-dove", "cardinal", "blue-jay", "owl", "barn-owl",
  "swan", "duck", "eurasian-coot", "black-swan",
]);

const guestbookInsects: ReadonlySet<string> = new Set([
  "amber-moth", "yellow-butterfly", "violet-butterfly", "swallowtail-butterfly",
  "red-butterfly", "white-butterfly", "rust-moth", "pink-eyespot-moth",
]);

// Category order is continuous; categories never reserve or label a page.
const pickerOrder: readonly GuestbookStickerId[] = [
  "fern", "mossy-rock", "mushroom", "lilypad", "lotus",
  "bloodroot", "daisy", "lavender", "tulip", "columbine", "sweet-peas", "snapdragon", "dahlia", "peony", "pansies", "calla-lily", "pink-orchid", "yellow-orchid", "lily-of-the-valley", "bleeding-hearts", "sunflower",
  "cloud", "star", "star-white", "star-yellow", "star-red",
  "yellow-butterfly", "violet-butterfly", "swallowtail-butterfly", "red-butterfly", "white-butterfly", "amber-moth", "rust-moth", "pink-eyespot-moth",
  "songbird", "mourning-dove", "cardinal", "blue-jay", "owl", "barn-owl", "snowy-owl", "duck", "eurasian-coot", "swan", "black-swan",
  "deer-fawn", "deer-doe", "deer", "cat", "dog", "chipmunk", "bunny", "snail", "leaf-sheep",
  "leafeon", "absol", "lilligant", "turtwig", "xerneas", "alolan-vulpix", "glaceon", "celebi", "mew", "usagi", "batman",
];
export const guestbookPickerStickers = pickerOrder.map(id => guestbookStickers.find(item => item.id === id)!);
export const guestbookStickersPerPage = 12;
export const guestbookMobileStickersPerPage = 14;

export function guestbookStickerImage(id: string) {
  return `/guestbook/stickers/${id}${guestbookPokemonIds.has(id) ? "" : "-soft"}.svg`;
}

export const guestbookPokemonIds: ReadonlySet<string> = new Set([
  "leafeon", "absol", "lilligant", "turtwig", "xerneas", "alolan-vulpix", "glaceon", "celebi", "mew",
]);

export function guestbookStickerWidth(id: string) {
  return guestbookStickerWidths[guestbookStickerSize(id)] * (guestbookPokemonIds.has(id) || id === "deer" ? 1.35 : 1);
}

export const guestbookStickerWidths = { small: 4, medium: 5.6, large: 7.6 } as const;
export function guestbookStickerSize(id: string): keyof typeof guestbookStickerWidths {
  if (["cloud", "deer-doe", "deer", "batman", "xerneas", "pink-orchid", "yellow-orchid", "lily-of-the-valley", "pansies", "bleeding-hearts"].includes(id)) return "large";
  if (["deer-fawn", "cat", "dog", "bunny", "owl", "barn-owl", "snowy-owl", "swan", "duck", "eurasian-coot", "black-swan", "leafeon", "absol", "lilligant", "alolan-vulpix", "glaceon", "mew", "leaf-sheep", "sunflower", "mossy-rock", "pink-orchid", "yellow-orchid", "lily-of-the-valley", "pansies", "bleeding-hearts", "usagi", "bloodroot", "daisy", "lavender", "tulip", "columbine", "sweet-peas", "snapdragon", "dahlia", "peony", "calla-lily", "lotus"].includes(id)) return "medium";
  return "small";
}

export function guestbookAllowedZones(stickerId: string): readonly GuestbookZone[] {
  const sticker = guestbookStickers.find(item => item.id === stickerId);
  if (!sticker || retiredGuestbookStickers.has(stickerId)) return [];
  if (stickerId === "celebi" || stickerId === "mew") return ["sky", "land"];
  if (guestbookInsects.has(stickerId)) return ["sky", "land", "tree"];
  return guestbookBirds.has(stickerId) ? [sticker.zone, "land"] : [sticker.zone];
}

export function allowsGuestbookPlacement(stickerId: string, x: number, y: number) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x >= 1 || y < 0 || y >= 1) return false;
  const base = stickerBases[stickerId as keyof typeof stickerBases];
  if (!base) return false;
  const width = guestbookStickerWidth(stickerId) / 100;
  // Match the square sticker frame and the landscape's 1000:560 display ratio.
  const terrain = guestbookTerrainAt(x + base.x * width, y + base.y * width * 1000 / 560);
  return guestbookAllowedZones(stickerId).some(zone => zone === terrain);
}

export function parseGuestbookSubmission(value: unknown): GuestbookSubmission | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Record<string, unknown>;
  if (typeof entry.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entry.id)
    || typeof entry.name !== "string" || typeof entry.sticker !== "string"
    || typeof entry.x !== "number" || typeof entry.y !== "number") return null;
  const name = entry.name.trim().normalize("NFC");
  if (entry.message !== undefined && typeof entry.message !== "string") return null;
  const message = ((entry.message as string | undefined) || "").replace(/\r\n?/g, "\n").trim().normalize("NFC");
  if (Array.from(message).length > guestbookMessageLimit || /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/.test(message)) return null;
  if (!name || Array.from(name).length > guestbookNameLimit || /[\u0000-\u001f\u007f-\u009f]/.test(name)
    || !allowsGuestbookPlacement(entry.sticker, entry.x, entry.y)) return null;
  return { id: entry.id, name, ...(message ? { message } : {}), sticker: entry.sticker as GuestbookStickerId, x: entry.x, y: entry.y };
}

export function guestbookPlacementOccupied(entries: readonly GuestbookEntry[], x: number, y: number) {
  // Only protect the centres from exact stacking; silhouettes may overlap.
  return entries.some(entry => Math.hypot((entry.x - x) * 1000, (entry.y - y) * 560) < 8);
}
