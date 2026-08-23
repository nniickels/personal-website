# Nicole Jiang

The source for [nicolejiang.com](https://nicolejiang.com).


## Structure

- `src/app` contains the pages and styles.
- `src/app/robots.ts` and `src/app/sitemap.ts` provide search-engine discovery files.
- `src/worker.ts` connects the app to Cloudflare.
- `public` contains static images, icons, gallery media, and the résumé PDF.
- `tests` contains rendered-page checks.


## Stack

- **React 19 + TypeScript** — interface and client-side interactions
- **Vinext + Vite** — Next.js-compatible routing and production builds
- **Cloudflare Workers** — edge hosting, API proxying, and image optimization
- **stats.fm API** — lifetime listening-time rankings
- **Steam Web API** — recently played games
- **Clash Royale API via RoyaleAPI** — current trophy count
- **GoatCounter** — privacy-friendly, combined view count across both pages

## Pages

| Route | Description |
|-------|-------------|
| `/` | Main Quest — résumé-style education, research, projects, and service |
| `/side-quests` | Side Quests — photos, listening, reading, watching, gaming, collections, and food |

## Search discovery

- `GET /robots.txt` allows crawling and points search engines to the sitemap.
- `GET /sitemap.xml` lists the Main Quest and Side Quests pages using their canonical URLs.
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
