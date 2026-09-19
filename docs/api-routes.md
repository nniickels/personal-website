# API Routes

| Endpoint | Purpose |
|----------|---------|
| `GET /api/stats` | Combines stats.fm listening data, Clash Royale trophies, and Steam activity |
| `GET /media/*` | Serves content-hashed WebP thumbnails and enlarged images with immutable caching |
| `GET /gc/count.js` | Proxies the GoatCounter browser tracker |
| `POST /gc/count` | Records page visits without exposing the GoatCounter site code in source URLs |
| `GET /gc/counter/TOTAL.json` | Returns the combined view count for every page |
