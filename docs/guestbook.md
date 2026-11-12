# Buttons and guestbook

## Buttons

Add entries to `siteButtons` in `src/app/side-quests/data.ts`. Each entry has a
`name`, site `href`, and local image path. Put 88×31 images in `public/buttons/`.
Buttons show their destination URL on hover or focus.
The laggy button uses Boris’s original [favicon](https://github.com/l2ggy/portfolio/blob/c29bec0ab768f4c70d45d36335e32daccca57473/public/favicon.svg).

## Guestbook

Visitors choose a pixel-art sticker from the paginated grid and click the
landscape, or drag a sticker onto it. A popup asks for their name, an optional message, and confirmation. Invalid spots show
a placement message. Names have a 20-character limit; optional messages allow 150 characters.
Both fields show live character counts.
Sticker images disable the browser’s long-press image menu so touch dragging stays uninterrupted.
Hover or focus a placed sticker to see its name and date. History below
the controls lists date, name, message, sticker, and placement number. It opens at the
latest entries at the top; scrolling down shows older entries. The log uses
Barlow Semi Condensed with column headings.
The landscape refreshes every 20 seconds while it is near the viewport.
The landscape has a narrow painting frame. Below it, the fullscreen control sits
opposite the shared sticker count. The glassine sticker sheet has a spaced dashed border, folded corner,
and italic STIX Two Text label, with separate light and dark colours.
Fullscreen shows only the landscape, all stickers in a compact scrollable
grid, and an exit control. On phones, controls sit above the landscape, with a compact picker below.
The phone picker has extra space above its label and a tighter gap before pagination.
Fullscreen expands the picker into a scrollable grid below the landscape. Browsers without the Fullscreen API use an expanded view.

`src/guestbook-model.ts` defines stickers, category order, and three size tiers.
Pages fill continuously without category headings. The placement mask is
`src/guestbook-map.json`, generated from the composed artwork.
Pixel sprites are kept in `public/guestbook/stickers/`.
Plants and animals use 2D pixel sprites without lineart. Positions use
normalized coordinates. The landscape colours and placement checks use the same
pixel map on the client and server. Placement checks the sticker’s visible
bottom edge, so flowers can stand on grass with their tops over the mountains.
`src/guestbook-sticker-bases.json` is rebuilt with the sprite assets.
The server also checks names, occupied positions, and duplicate submissions.
Placed stickers use three sizes; Pokémon and the buck are enlarged by 35%. Other stickers
use a softer palette baked into their shared images.
`node scripts/build-guestbook-palette.mjs` rebuilds these from the originals;
it also runs with `npm run images:build`. Flowers use a light ivory tint; dahlia, calla lily, and sweet pea petal
colours are set in the palette script. The leaf sheep’s dark eyes are preserved.
Pokémon bypass this conversion.
Sticker artwork uses SVG paths on a logical square-cell grid. Each cell has a
solid fill and a limited palette. Non-Pokémon sprites use a 64×64 frame,
except Usagi at 80×80. Pokémon retain their native cells and colours in padded
frames; supplied enlarged sprites are reduced only to their exact art-cell grid. Landscape hover and drag previews use the same
SVG and size as placed stickers. Hover enlargement uses stepped size changes,
with glow rendered behind the artwork.
Stickers may overlap. Only almost identical
centres are blocked. On touch screens, tap an existing sticker once to read its
label and again to place through it.
Orchids, lily of the valley, pansies, and bleeding hearts use grass. Butterflies and moths can use sky,
grass, or tree canopy. Birds other than the snowy owl can also use grass.
Celebi and Mew can use sky or grass. Alolan Vulpix, Glaceon, and snowy owls
belong on the snowcap. Retired stickers stay
readable in existing entries but cannot be added. Existing sticker IDs stay stable
so older entries keep their artwork, names, and dates.

The `GUESTBOOK` Durable Object stores the shared entries. Its binding and
SQLite migration are in `vite.config.ts`. Deploying the site creates the
production store. Production entries survive deployments.

Run `npm run dev` for the local guestbook. Development entries are separate
from production and persist in `.wrangler/state/`. Keep that directory to
retain local entries. The Node production preview has no Durable Object
binding and shows the guestbook as unavailable.

The older Pokémon use original Black/White battle sprites from
[PokéAPI](https://github.com/PokeAPI/sprites). Xerneas and Alolan Vulpix use the
supplied sprites saved in `public/guestbook/supplied/`. Sources and hashes are in
`public/guestbook/pokemon-sources.json`. Run `node scripts/sync-guestbook-pokemon.mjs`
to refresh the originals, then `npm run images:build` to rebuild the display artwork.

The landscape follows the earlier site reference: soft pixel art, a meadow,
a pond, three snowy peaks, two forest trees, and a cherry blossom tree.
Run `node scripts/build-guestbook-landscape.mjs` to rebuild the image and its
native-resolution placement mask together. Scene metadata and its hash are in
`public/guestbook/landscape-sources.json`.
