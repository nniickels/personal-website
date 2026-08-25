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

| Feature | Desktop and landscape tablets | Phones |
|---------|-------------------------------|--------|
| Layout and navigation | Uses wider gutters, full-size type and media, and single-row header controls. | Uses compact gutters, smaller type and media, wrapped social icons, and navigation constrained to the viewport. |
| Side Quests section index | Uses the full-width section and subsection index with pointer hover states. | Keeps the complete index within the narrow viewport with compact labels and touch-sized targets. |
| Listening music shelf | Hovering a cover starts its looping preview; clicking expands it, and clicking the expanded cover opens Spotify. | Holding a cover starts its preview. Dragging across covers switches tracks and smoothly scrolls near the shelf edges. Tapping expands a cover, and tapping the expanded cover opens Spotify. |
| Pokémon card shelf | Hover states identify cards; clicking expands a card, and clicking the expanded card opens TCG Collector. | Tapping expands a card, and tapping the expanded card opens TCG Collector. Arrow navigation keeps the selected card visible on both layouts. |
| Photo galleries | Uses wider multi-column mosaics with hover feedback and large lightboxes. | Uses responsive, smaller gallery columns and controls while preserving image aspect ratios; tapping opens the same lightbox viewer. |
| Playground layout | Displays all four experiments in sequence. `IntersectionObserver` pauses offscreen JavaScript and CSS animations and resumes them shortly before they return to view. | Presents the experiments as a collapsed single-open accordion. Only the expanded experiment is mounted, so collapsed simulations do not run. Experiment workspaces stack their visuals and controls into one column. |

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
