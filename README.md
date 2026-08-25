# Nicole Jiang

The source for [nicolejiang.com](https://nicolejiang.com).


## Structure

- `src/app` contains the pages, shared portfolio shell, theme controls, and styles.
- `src/app/playground/playground.tsx` contains the four interactive astronomy experiments.
- `src/api-stats.ts` combines the public stats.fm feed with secret-backed Clash Royale and Steam data.
- `src/app/robots.ts` and `src/app/sitemap.ts` provide search-engine discovery files.
- `src/worker.ts` connects the app to Cloudflare, serves the stats endpoint, proxies GoatCounter, and handles image optimization.
- `public` contains static images, icons, gallery media, and the résumé PDF.
- `tests` contains rendered-page checks.


## Stack

- **React 19 + TypeScript** — interface and client-side interactions
- **Vinext + Vite** — Next.js-compatible routing and production builds
- **Cloudflare Workers** — edge hosting, API proxying, and image optimization
- **CSS + SVG** — responsive galleries, theme-aware animation, and interactive astronomy visuals
- **stats.fm API** — lifetime listening-time rankings
- **Steam Web API** — recently played games
- **Clash Royale API via RoyaleAPI** — current trophy count
- **GoatCounter** — privacy-friendly, combined view count across every page
- **Canadian Webring** — previous, random, and next-site navigation in the footer

## Pages

| Route | Description |
|-------|-------------|
| `/` | Main Quest — résumé-style education, research, projects, and service |
| `/side-quests` | Side Quests — expandable photos, listening previews and lifetime stats, reading, watching, gaming, collections, and food |
| `/playground` | Playground — draggable black-hole growth, stellar-evolution, gravitational-lensing, and orbital-resonance experiments |

All pages include a motion-safe colored four-point starfield in dark mode, responsive navigation, the Canadian Webring widget, and a combined GoatCounter view count.

## Desktop and mobile differences

Layout responds to available width, so these are the typical orientation differences rather than device assumptions.

### Landscape and portrait

| Feature | Landscape | Portrait |
|---------|-----------|----------|
| Layout and navigation | Uses wider gutters, larger type and media, and single-row header controls when space permits. | Uses compact gutters, smaller type and media, wrapped social icons, and navigation constrained to the viewport. |
| Side Quests section index | Spreads section and subsection links across the available width. | Fits the complete index within the narrow viewport using more compact labels and spacing. |
| Photo galleries | Displays wider multi-column mosaics and larger lightboxes. | Uses narrower responsive gallery columns and controls while preserving image aspect ratios. |
| Playground workspaces | Uses side-by-side experiment visuals and controls when the viewport is wide enough. | Stacks experiment visuals and controls into one column on narrow screens. |
| Playground lifecycle | Desktop and landscape-tablet layouts show all four experiments. `IntersectionObserver` pauses offscreen motion and resumes it shortly before re-entry. Short touchscreen phone landscapes use the accordion instead. | Phone-width portraits use a collapsed single-open accordion. Only the expanded experiment is mounted, and opening one jumps immediately to its heading. |

### Cursor and touchscreen

| Feature | Cursor | Touchscreen |
|---------|--------|-------------|
| Links and controls | Hover and focus states brighten, underline, or raise interactive elements before selection. | Controls use touch-sized targets and activate without depending on hover. |
| Listening music shelf | Hovering a cover starts its looping preview. Clicking expands it, and clicking the expanded cover opens Spotify. | Holding a cover starts its preview. Dragging across covers switches tracks and smoothly scrolls near the shelf edges. Tapping expands it, and tapping the expanded cover opens Spotify. |
| Pokémon card shelf | Hovering identifies a card. Clicking expands it, and clicking the expanded card opens TCG Collector. | Tapping expands a card, and tapping the expanded card opens TCG Collector. Arrow navigation keeps the selected card visible for both input methods. |
| Photo galleries | Clicking a thumbnail opens the lightbox, with hover feedback available beforehand. | Tapping a thumbnail opens the same lightbox viewer. |
| Playground experiments | Click-and-drag controls rotate or reposition experiment objects. | Touch-drag uses the same direct manipulation without requiring hover. |
| Playground performance notice | Hidden. | Shown beneath the page description to recommend desktop for the best performance and allow time for experiments to load. |
| Playground disclosures | Explanation and Variables Guide reveal immediately with matching arrow animation; Advanced Settings retains animated expansion. | Disclosure content is mounted only while open, and the starfield pauses while it is displayed. Explanation and Variables Guide are mutually exclusive. Tablets retain animated expansion; phone accordion layouts reveal content instantly. Playground stars twinkle more slowly and shooting stars are hidden. |

## Search discovery

- `GET /robots.txt` allows crawling and points search engines to the sitemap.
- `GET /sitemap.xml` lists the Main Quest, Side Quests, and Playground pages using their canonical URLs.
- The homepage publishes `WebSite` data for the preferred site name plus page-specific `ProfilePage` and `Person` data connecting Nicole Jiang with the University of Toronto, LinkedIn, and GitHub.
- Canonical URLs, concise page titles, unique descriptions, authorship metadata, and explicit crawl and preview directives are included in page metadata.
- The sitemap contains canonical page locations only; ignored `priority` and `changefreq` hints are intentionally omitted.

## API Routes

| Endpoint | Purpose |
|----------|---------|
| `GET /api/stats` | Combines stats.fm listening data, Clash Royale trophies, and Steam activity |
| `GET /_vinext/image` | Serves Cloudflare-optimized raster images at responsive sizes |
| `GET /gc/count.js` | Proxies the GoatCounter browser tracker |
| `POST /gc/count` | Records page visits without exposing the GoatCounter site code in source URLs |
| `GET /gc/counter/TOTAL.json` | Returns the combined view count for every page |

## Runtime variables

Copy `.env.example` to `.env` for local development. Store production values as
Worker variables in Cloudflare. Encrypt API credentials as secrets; identifiers
and non-sensitive configuration can remain ordinary variables.

- Secrets: `CLASH_ROYALE_API_TOKEN`, `STEAM_WEB_API_KEY`
- Configuration: `STEAM_ID64`; optional GoatCounter override: `GOATCOUNTER_CODE`

## Local development

```bash
npm install
npm run dev
npm run build
npm run start
npm test
```

## Design references and inspiration

- [Boris Kafidov](https://kafidov.dev/) — general portfolio design template
- [Kevin Thottumkal](https://www.kevinthottumkal.com/) — dark-mode background effects
- [Stanley Pang](https://stanleyp.dev/) — photo galleries and visual details
- [Ryan Alumkal](https://ryanalumkal.github.io/) — horizontal media shelf
- [Alvina Yang](https://www.alvinayang.com/blogs) — interactive simulation widgets
