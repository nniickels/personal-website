# Nicole Jiang

The source for [nicolejiang.com](https://nicolejiang.com).

## Repo navigation

- [App](src/app/) — pages, components, and styles.
- [Server](src/) — Worker, API handlers, and caching.
- [Assets](public/) — images, icons, and résumé.
- [Scripts](scripts/) — image generation and metadata cleanup.
- [Tests](tests/) — rendering, browser, and performance checks.
- [Docs](docs/README.md) — setup, runtime configuration, APIs, responsive behavior, search discovery, and Easter eggs.

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

All pages include a motion-safe colored four-point starfield in dark mode, responsive navigation, the Canadian Webring widget, and a combined GoatCounter view count.

## Design references and inspiration

- [Boris Kafidov](https://kafidov.dev/) — general portfolio design template
- [Kevin Thottumkal](https://www.kevinthottumkal.com/) — dark-mode background effects
- [Stanley Pang](https://stanleyp.dev/) — photo galleries and visual details
- [Ryan Alumkal](https://ryanalumkal.github.io/) — horizontal media shelf
- [Alvina Yang](https://www.alvinayang.com/blogs) — interactive simulation widgets
