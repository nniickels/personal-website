# Nicole Jiang

The source for [nicolejiang.com](https://nicolejiang.com).


## Structure

- `src/app` contains the pages, shared portfolio shell, theme controls, and styles.
- `src/app/sky-easter-eggs.tsx` contains shooting-star wishes and the idle meteor shower.
- `src/app/playground/playground.tsx` loads the four independent experiment modules as needed and preserves their state between layouts.
- `src/app/playground/shared.tsx` handles experiment visibility, touchscreen visual pausing, playback pacing, and frame-batched inputs.
- `src/app/side-quests` contains the music and card shelves, deferred galleries, and separately loaded viewers.
- `scripts/build-images.mjs` generates responsive WebP assets and dimension manifests from the original images.
- `src/api-stats.ts` combines the public stats.fm feed with secret-backed Clash Royale and Steam data.
- `src/app/robots.ts` and `src/app/sitemap.ts` provide search-engine discovery files.
- `src/worker.ts` connects the app to Cloudflare, serves the stats endpoint, proxies GoatCounter, and uses `src/stats-cache.ts` for stale-while-revalidate stats caching.
- `public` contains static images, icons, gallery media, the social-preview artwork, and the résumé PDF.
- `tests/rendered-html.test.mjs` checks rendered-page contracts; `tests/performance.test.mjs` checks generated images, provider deadlines, and stats caching.
- `tests/browser/performance.spec.ts` checks desktop and mobile interactions against a production build using Playwright; `responsive.spec.ts` checks viewport overflow in WebKit.
- `tests/browser/interaction.spec.ts` checks continuous slider/drag updates, final-value flushing, keyboard input, mobile visual pausing, and black-hole scaling and spin behavior.
- `docs/easter-eggs.md` documents the sky interactions, timing, layers, mobile rules, and verification checklist.


## Stack

- **React 19 + TypeScript** — interface and client-side interactions
- **Vinext + Vite** — Next.js-compatible routing and production builds
- **Cloudflare Workers** — edge hosting, API proxying, and stats caching
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
| `/side-quests` | Side Quests — expandable photos, listening previews and lifetime stats, reading, watching, recently played Steam game names, collections, and food |
| `/playground` | Playground — draggable black-hole growth, stellar-evolution, gravitational-lensing, and orbital-resonance experiments |

All pages include a motion-safe colored four-point starfield in dark mode, responsive navigation, the Canadian Webring widget, and a combined GoatCounter view count. Viewports wider than 520px show 96 stars; widths up to 520px show 64 stars at a smaller size. On devices without hover or with a coarse pointer, only eight background stars animate; the remaining visible stars stay static. This limit applies across all three pages and in either orientation. Devices with hover and a fine pointer retain the original animation behavior. Reduced-motion preferences disable twinkling.

The Steam widget lists up to three recently played game names without playtime totals. When fewer than three games were played during the 14-day window, it displays a corresponding no-other-games note.

## Astronomy Easter eggs

| Feature | Trigger | Behavior |
|---------|---------|----------|
| Shooting-star wish | Click or tap within the invisible 96×96-pixel target around a visible shooting star. | Pauses the star for 1.6 seconds and shows “Make a wish ✧” for 3.2 seconds. |
| Meteor shower | Leave a supported desktop page idle for 10 seconds in dark mode. | Adds 12 foreground and 18 background meteors, dims the page content, and displays “Meteor shower!” at the bottom. Activity ends the shower. |

The meteor shower is disabled at widths of 700px or less, on devices without hover, or with a coarse primary pointer. The calligraphy logo is a standard home link with immediate navigation on every device. Moving meteors are disabled when reduced motion is requested.

See [Easter egg documentation](docs/easter-eggs.md) for exact click timing, rendering details, and known limitations.

## Desktop and mobile differences

Layout responds to viewport dimensions, while touch-specific behavior responds to pointer and hover capabilities. The phone copy and compact navigation apply at widths up to 520px; the Playground accordion uses the separate rules below.

### Wide and compact layouts

| Feature | Wide layout | Compact layout |
|---------|-----------|----------|
| Layout and navigation | Uses wider gutters, larger type and media, and full page-link labels. | Uses compact gutters, smaller type and media, and shortened “Main”, “Side”, and “Play” navigation labels at phone widths. |
| Main Quest copy | Shows the full introduction, project descriptions, and service descriptions. | Uses a shorter introduction and hides project and service descriptions at phone widths. |
| Side Quests section index | Spreads section and subsection links across the available width. | Fits the complete index within the narrow viewport using more compact labels and spacing. |
| Side Quests copy and rankings | Shows full introductory and interest paragraphs and expanded listening rankings. | Uses a shorter introduction and interest lists; Watching and Gaming lists use two columns. Top Tracks stays expanded, while artist and album rankings use disclosures. The Food introduction is hidden, and the two gaming widgets remain side by side. |
| Side Quests lifecycle | Galleries initialize on first disclosure opening; viewers load on demand. | Same lifecycle, with smaller responsive image candidates selected for the displayed size and screen density. |
| Photo galleries | Displays wider multi-column mosaics and larger lightboxes. | Uses narrower responsive gallery columns and controls while preserving image aspect ratios. |
| Playground workspaces | Uses side-by-side experiment visuals and controls when the viewport is wide enough. | In the accordion layout, settings appear before the scene and action buttons after it. The black-hole chart follows its actions; the stellar timeline appears before its playback actions. |
| Playground explanations and results | Shows chart captions and model notes alongside the full explanations. | In the accordion layout, hides the black-hole chart caption and standalone model notes, includes concise model summaries inside Explanation, and arranges result cards in three columns. |
| Playground lifecycle | All four experiment slots remain available; each experiment loads shortly before entering view. Offscreen motion pauses. | A single-open accordion initializes only requested experiments. React Activity retains visited experiments’ state while hiding their DOM and stopping effects. Rotation preserves settings and the selected panel. |

### Cursor and touchscreen

| Feature | Cursor | Touchscreen |
|---------|--------|-------------|
| Links and controls | Hover and focus states brighten, underline, or raise interactive elements before selection. | Controls use touch-sized targets and activate without depending on hover. |
| Idle meteor shower | Available above 700px with hover and a fine primary pointer. | Disabled; the logo navigates home immediately. |
| Shooting-star wishes | Click a visible star to pause it and display a wish message. | Tap a visible star on Main Quest or Side Quests; regular shooting stars remain hidden in the touchscreen Playground. |
| Listening music shelf | Hovering a cover starts its looping preview. Clicking expands it, and clicking the expanded cover opens Spotify. | Holding a cover starts its preview. Dragging across covers switches tracks and smoothly scrolls near the shelf edges. Tapping expands it, and tapping the expanded cover opens Spotify. |
| Pokémon card shelf | Hovering identifies a card. Clicking expands it, and clicking the expanded card opens TCG Collector. | Tapping expands a card, and tapping the expanded card opens TCG Collector. Arrow navigation keeps the selected card visible for both input methods. |
| Photo galleries | Clicking a thumbnail opens the lightbox, with hover feedback available beforehand. | Tapping a thumbnail opens the same lightbox viewer. |
| Playground experiments | Click-and-drag controls rotate or reposition experiment objects. | Touch-drag uses the same direct manipulation without requiring hover. |
| Playground playback rate | Autonomous JavaScript playback updates up to 60 times per second, backing off to 30 for Save-Data or observed frame delays. Playback pauses outside the experiment section's visibility margin or in a hidden tab. | The same playback policy. Direct dragging follows display frames; touch capability alone does not reduce the playback rate. |
| Playground decorative motion | Uses the experiment section's visibility to pause decorative animation. | Also pauses decorative CSS animations when the visual itself leaves the viewport. Reading nearby controls does not reset state or independently stop simulation playback. |
| Black Hole experiment | Includes the Variables Guide, all variable sliders, growth playback, the draggable mass-growth plot, presets, results, and 3D rotation. | Includes the same complete feature set in the mobile accordion. |
| Black Hole rendering | Retains mass-dependent layout dimensions and nine decorative animations. | Scales fixed-size geometry with transforms. Two rotating disk textures provide motion; the six orbiting streaks are hidden and the photon ring stays static. Spin direction and near-zero-spin pausing remain supported. |
| Playground loading feedback | A loading indicator appears while an experiment chunk is loading. | The same contextual indicator replaces the permanent desktop recommendation. |
| Playground disclosures | Explanation and Variables Guide reveal immediately with matching arrow animation; Advanced Settings retains animated expansion. | Black Hole defers Variables Guide and Advanced Settings content until open; its Explanation and Variables Guide are mutually exclusive. Accordion layouts disable Advanced Settings expansion transitions. The eight animated background stars continue while reading, with twinkle durations 2.4 times longer in Playground; shooting stars are hidden. |

The Playground accordion applies at widths up to 700px in portrait, or heights up to 520px in landscape with a coarse pointer. Other viewports use the full experiment layout, including larger portrait tablets. Touch-specific controls and starfield adjustments separately use `(hover: none), (pointer: coarse)`; these checks do not impose a blanket playback-rate reduction.

## Search discovery

- `GET /robots.txt` allows crawling and points search engines to the sitemap.
- `GET /sitemap.xml` lists the Main Quest, Side Quests, and Playground pages using their canonical URLs.
- The homepage publishes `WebSite` data for the preferred site name plus page-specific `ProfilePage` and `Person` data connecting Nicole Jiang with the University of Toronto, LinkedIn, and GitHub.
- Canonical URLs, concise page titles, unique descriptions, authorship metadata, and explicit crawl and preview directives are included in page metadata.
- Every public page publishes Open Graph and Twitter large-image metadata using `public/og.png`, the title `Nicole Jiang`, and the embed description `Personal website and portfolio.`
- The sitemap contains canonical page locations only; ignored `priority` and `changefreq` hints are intentionally omitted.

## API Routes

| Endpoint | Purpose |
|----------|---------|
| `GET /api/stats` | Combines stats.fm listening data, Clash Royale trophies, and Steam activity |
| `GET /media/*` | Serves content-hashed WebP thumbnails and enlarged images with immutable caching |
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
```

Production build and validation (Node.js 22.13.0 or newer):

```bash
npm run build
npm run typecheck
npm test
npx playwright install chromium webkit
npm run test:browser
```

`npm test` rebuilds the site. Browser tests use Chromium for desktop/phone interactions and WebKit for responsive layout and phone slider/drag checks. They use the most recent production build and start a server on `127.0.0.1:4173`, reusing an existing server there outside CI. Stop any stale server before testing a new build. Avoid rebuilding the shared `dist` directory while a production preview or browser check is running: the server can retain references to removed asset filenames. Use `npm run start` separately to preview the production site manually.

Run `npm run privacy:strip-gallery-metadata` after adding gallery JPEGs. It losslessly removes EXIF, XMP, IPTC, comments, and other nonessential application metadata while preserving image pixels, JFIF data, and colour profiles.

## Design references and inspiration

- [Boris Kafidov](https://kafidov.dev/) — general portfolio design template
- [Kevin Thottumkal](https://www.kevinthottumkal.com/) — dark-mode background effects
- [Stanley Pang](https://stanleyp.dev/) — photo galleries and visual details
- [Ryan Alumkal](https://ryanalumkal.github.io/) — horizontal media shelf
- [Alvina Yang](https://www.alvinayang.com/blogs) — interactive simulation widgets
