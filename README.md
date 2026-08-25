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

All pages share a device-synchronized light/dark theme, a motion-safe colored four-point starfield in dark mode, responsive navigation, the Canadian Webring widget, and a combined GoatCounter view count.

### Playground experiments

- **Black-Hole Growth Simulator** — projects seed growth with a constant Eddington ratio, spin-derived thin-disk radiative efficiency, duty cycle, and a flat ΛCDM time interval. It includes presets, variable guides, a draggable logarithmic growth plot, and a draggable 3D near-edge-on disk whose gaseous texture, photon ring, and lensed arc are illustrative rather than ray-traced.
- **Stellar Evolution Explorer** — follows approximate mass-dependent tracks from the main sequence through giant, nebular, or supernova phases to a white dwarf, neutron star, or black hole. Its clickable timeline is evenly spaced rather than time-scaled, playback slows through longer toy-model intervals, and the neutron-star endpoint uses an illustrative rotating-pulsar beam visual.
- **Gravitational Lensing Sandbox** — demonstrates the two idealized images and Einstein ring of an axisymmetric point-mass thin lens. The source and view are draggable; source size changes illustrative arcs while the magnification readout remains a capped point-source estimate.
- **Orbital Resonance Toy** — compares one to five bodies in prescribed 2:1, 3:2, and 5:3 period-ratio chains or a near-resonant setup. Its explanation connects period ratios to repeat cycles. Display radii remain independent of period, so the toy shows recurring alignments without enforcing Kepler's third law, mutual perturbations, or resonant-angle libration.

The Playground experiments are simplified, illustrative models. Some motion, scale, color, and depth cues are exaggerated or added for clarity rather than being physically precise or necessary to the calculation.

## Search discovery

- `GET /robots.txt` allows crawling and points search engines to the sitemap.
- `GET /sitemap.xml` lists the Main Quest, Side Quests, and Playground pages using their canonical URLs.
- The homepage publishes `ProfilePage` and `Person` structured data connecting Nicole Jiang with the University of Toronto, LinkedIn, and GitHub.
- Canonical URLs, page titles, descriptions, and explicit `index, follow` directives are included in page metadata.

## API Routes

| Endpoint | Purpose |
|----------|---------|
| `GET /api/stats` | Combines stats.fm listening data, Clash Royale trophies, and Steam activity |
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
