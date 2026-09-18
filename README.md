# Nicole Jiang

The source for [nicolejiang.com](https://nicolejiang.com).


## Structure

- `src/app` contains the pages, shared portfolio shell, theme controls, and styles.
- `src/app/sky-easter-eggs.tsx` contains shooting-star wishes, the idle meteor shower, and the calligraphy constellation trigger.
- `src/app/playground/playground.tsx` loads the four independent experiment modules as needed and preserves their state between layouts.
- `src/app/side-quests` contains the music and card shelves, deferred galleries, and separately loaded viewers.
- `scripts/build-images.mjs` generates responsive WebP assets and dimension manifests from the original images.
- `src/api-stats.ts` combines the public stats.fm feed with secret-backed Clash Royale and Steam data.
- `src/app/robots.ts` and `src/app/sitemap.ts` provide search-engine discovery files.
- `src/worker.ts` connects the app to Cloudflare, serves the stats endpoint, proxies GoatCounter, and uses `src/stats-cache.ts` for stale-while-revalidate stats caching.
- `public` contains static images, icons, gallery media, the social-preview artwork, and the résumé PDF.
- `tests/rendered-html.test.mjs` checks rendered-page contracts; `tests/performance.test.mjs` checks generated images, provider deadlines, and stats caching.
- `tests/browser/performance.spec.ts` checks desktop and mobile interactions against a production build using Playwright; `responsive.spec.ts` checks viewport overflow in WebKit.
- `tests/browser/interaction.spec.ts` checks continuous slider/drag updates, final-value flushing, and keyboard input.
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

All pages include a motion-safe colored four-point starfield in dark mode, responsive navigation, the Canadian Webring widget, and a combined GoatCounter view count. Desktop and tablet layouts show 96 stars; phone widths up to 520px show 64 stars at a smaller size.

The Steam widget lists up to three recently played game names without playtime totals. When fewer than three games were played during the 14-day window, it displays a corresponding no-other-games note.

## Astronomy Easter eggs

| Feature | Trigger | Behavior |
|---------|---------|----------|
| Shooting-star wish | Click or tap within the invisible 96×96-pixel target around a visible shooting star. | Pauses the star for 1.6 seconds and shows “Make a wish ✧” for 3.2 seconds. |
| Meteor shower | Leave a supported desktop page idle for 10 seconds in dark mode. | Adds 12 foreground and 18 background meteors, dims the page content, and displays “Meteor shower!” at the bottom. Activity ends the shower. |
| Calligraphy constellation | Click the home logo five times quickly on desktop. | Reveals an “N” made of four-point stars for four seconds. Retriggering restarts the animation. |

The meteor shower and constellation are disabled at widths of 700px or less, on devices without hover, or with a coarse primary pointer. Mobile logo navigation is immediate; desktop logo navigation waits 300 ms to allow repeated clicks. Moving meteors are disabled when reduced motion is requested. The constellation remains available as a static reveal on supported desktop devices.

See [Easter egg documentation](docs/easter-eggs.md) for exact click timing, rendering details, and known limitations.

## Desktop and mobile differences

Layout responds to available width, so these are the typical orientation differences rather than device assumptions.

### Landscape and portrait

| Feature | Landscape | Portrait |
|---------|-----------|----------|
| Layout and navigation | Uses wider gutters, larger type and media, and single-row header controls when space permits. | Uses compact gutters, smaller type and media, wrapped social icons, and navigation constrained to the viewport. |
| Side Quests section index | Spreads section and subsection links across the available width. | Fits the complete index within the narrow viewport using more compact labels and spacing. |
| Side Quests lifecycle | Galleries initialize on first disclosure opening; viewers load on demand. | Same lifecycle, with smaller responsive image candidates selected for the displayed size and screen density. |
| Photo galleries | Displays wider multi-column mosaics and larger lightboxes. | Uses narrower responsive gallery columns and controls while preserving image aspect ratios. |
| Playground workspaces | Uses side-by-side experiment visuals and controls when the viewport is wide enough. | Stacks experiment visuals and controls into one column on narrow screens. |
| Playground lifecycle | All four experiment slots remain available; each experiment loads shortly before entering view. Offscreen motion pauses. | A single-open accordion initializes only requested experiments. React Activity retains visited experiments’ state while hiding their DOM and stopping effects. Rotation preserves settings and the selected panel. |

### Cursor and touchscreen

| Feature | Cursor | Touchscreen |
|---------|--------|-------------|
| Links and controls | Hover and focus states brighten, underline, or raise interactive elements before selection. | Controls use touch-sized targets and activate without depending on hover. |
| Idle meteor shower and constellation | Available above 700px with hover and a fine primary pointer. | Disabled; the logo navigates home immediately. |
| Shooting-star wishes | Click a visible star to pause it and display a wish message. | Tap a visible star on Main Quest or Side Quests; regular shooting stars remain hidden in the touchscreen Playground. |
| Listening music shelf | Hovering a cover starts its looping preview. Clicking expands it, and clicking the expanded cover opens Spotify. | Holding a cover starts its preview. Dragging across covers switches tracks and smoothly scrolls near the shelf edges. Tapping expands it, and tapping the expanded cover opens Spotify. |
| Pokémon card shelf | Hovering identifies a card. Clicking expands it, and clicking the expanded card opens TCG Collector. | Tapping expands a card, and tapping the expanded card opens TCG Collector. Arrow navigation keeps the selected card visible for both input methods. |
| Photo galleries | Clicking a thumbnail opens the lightbox, with hover feedback available beforehand. | Tapping a thumbnail opens the same lightbox viewer. |
| Playground experiments | Click-and-drag controls rotate or reposition experiment objects. | Touch-drag uses the same direct manipulation without requiring hover. |
| Playground animation rate | Smooth CSS easing; autonomous JavaScript playback updates up to 60 times per second, backing off to 30 for Save-Data or observed frame delays. Offscreen and hidden-tab experiment motion pauses. | The same playback policy. Direct dragging follows display frames; touch capability alone does not lower quality. |
| Black Hole experiment | Includes the Variables Guide, all variable sliders, growth playback, the draggable mass-growth plot, presets, results, and 3D rotation. | Includes the same complete feature set in the mobile accordion. |
| Playground loading feedback | A loading indicator appears while an experiment chunk is loading. | The same contextual indicator replaces the permanent desktop recommendation. |
| Playground disclosures | Explanation and Variables Guide reveal immediately with matching arrow animation; Advanced Settings retains animated expansion. | Black Hole defers Variables Guide and Advanced Settings content until open; its Explanation and Variables Guide are mutually exclusive. The starfield continues while reading. Accordion layouts disable Advanced Settings expansion transitions. Playground stars twinkle more slowly, half remain static, and shooting stars are hidden. |

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

`npm test` rebuilds the site. Browser tests use Chromium for desktop/phone interactions and WebKit for responsive layout and phone slider/drag checks. They use the most recent production build and start a server on `127.0.0.1:4173`, reusing an existing server there outside CI. Stop any stale server before testing a new build. Use `npm run start` separately to preview the production site manually.

Run `npm run privacy:strip-gallery-metadata` after adding gallery JPEGs. It losslessly removes EXIF, XMP, IPTC, comments, and other nonessential application metadata while preserving image pixels, JFIF data, and colour profiles.

## Design references and inspiration

- [Boris Kafidov](https://kafidov.dev/) — general portfolio design template
- [Kevin Thottumkal](https://www.kevinthottumkal.com/) — dark-mode background effects
- [Stanley Pang](https://stanleyp.dev/) — photo galleries and visual details
- [Ryan Alumkal](https://ryanalumkal.github.io/) — horizontal media shelf
- [Alvina Yang](https://www.alvinayang.com/blogs) — interactive simulation widgets

## Performance workflow

`predev` and `prebuild` generate images automatically. `npm run images:build` also runs independently. Original photos stay unchanged in `public`; generated `public/media` files and `src/generated/media` manifests are ignored by Git and reproducible from those originals. WebP thumbnails use widths up to 480px, and lightboxes can select larger candidates up to each original's native width. The image recipe and source hash are included in URLs. `public/_headers` marks only those fingerprinted assets immutable. No Cloudflare Images binding is needed.

When adding or replacing media, update the originals and their entries in `src/app/side-quests/data.ts`, then regenerate images (restart an already running dev server if needed). The generator handles the six gallery/shelf directories and three education/service logos listed in `scripts/build-images.mjs`; other assets, including the social preview and résumé, are unchanged. It auto-orients images, strips metadata from generated WebPs, and removes obsolete generated variants. Originals remain publicly accessible, so keep using the privacy command for source JPEGs. Commit source assets and code, not generated outputs.

Non-icon candidates are 160, 320, 480, 960, and native-width pixels where available, without enlargement. Small variants use WebP quality 78 and larger/native variants use quality 86. Logos use a single 128px variant, except the Science Centre wordmark at 280px to retain detail in its existing crop. The generator's byte summary compares one roughly 320px variant per source against originals; it is an asset-size comparison, not a measured page-load or Core Web Vitals result. Bump the recipe identifier whenever changing generation settings so immutable URLs cannot reuse an older encoding.

The homepage keeps résumé markup on the server and loads only shared interactive controls. Playground CSS is route-specific, its simulation modules load on demand, and gallery metadata/viewers stay outside the homepage's client dependency graph. Gallery dimensions reserve layout space before decoding. The black-hole curve is calculated independently of playback progress; lens dragging coalesces pointer updates once per frame; static simulation stars are memoized.

Experiment rendering reuses unchanged JSX regions for scenes, controls, explanations, chart geometry, and result panels. Shared sliders move their native thumb immediately and publish the latest value to the experiment each display frame; black-hole rotation/chart dragging, stellar timeline scrubbing, and orbit dragging also combine intermediate samples per frame. Rotation accumulates every movement before publishing so direction changes and clamping retain their existing behavior. Release, cancellation, and lost pointer capture flush the final sample; queued work is cancelled when its component is hidden or unmounted. These changes do not alter visual effects, CSS easing, scientific formulas, or playback frame-rate policy.

Stats use a four-second deadline per upstream request. The Workers Cache API stores a snapshot for up to 75 minutes, serves it fresh for 15 minutes, then returns stale data immediately while `waitUntil` refreshes it. Partial failures retain the affected provider's last successful data only within its original retention window, with a one-minute freshness interval before another request triggers a retry. Cache read failures fall back to direct fetching; write failures still return the fetched data. Public responses separately allow five minutes of HTTP caching. `X-Stats-Cache` reports `hit`, `stale`, or `miss`; production edge hit behavior must be verified after deployment.

`npm test` checks rendered page contracts, actual image dimensions/metadata/byte budgets, provider deadlines, and cache behavior. `npm run test:browser` uses a local production server to check desktop and mobile loading, gallery navigation, deep links, retained experiment state across closing and rotation, offscreen playback, shelf proportions, and mobile interaction under CPU throttling. Run `npm run build` before browser tests. Browser tests stub external services and do not record analytics visits. These regression checks do not establish production Core Web Vitals or real-device performance.
