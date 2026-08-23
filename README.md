# Nicole Jiang

The source for [nicolejiang.com](https://nicolejiang.com).


## Structure

- `src/app` contains the pages and styles.
- `src/worker.ts` connects the app to Cloudflare.
- `public` contains static images and icons.
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

## API Routes

| Endpoint | Purpose |
|----------|---------|
| `GET /api/stats` | Combines stats.fm listening data, Clash Royale trophies, and Steam activity |
| `GET /gc/count.js` | Proxies the GoatCounter browser tracker |
| `POST /gc/count` | Records page visits without exposing the GoatCounter site code in source URLs |
| `GET /gc/counter/TOTAL.json` | Returns the combined view count for every page |

## Runtime variables

Copy `.env.example` to `.env` for local development. Store production values as
Worker variables in Cloudflare, with API keys encrypted as secrets.

- `CLASH_ROYALE_API_TOKEN`
- `CLASH_ROYALE_PLAYER_TAG`
- `STEAM_WEB_API_KEY`
- `STEAM_ID64`
- `GOATCOUNTER_CODE`

## Local development

```bash
npm install
npm run dev
npm run build
```
