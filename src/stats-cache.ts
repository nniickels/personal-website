import { getPublicStats, type PublicStatsResponse, type StatsEnv } from "./api-stats";

const FRESH_MS = 15 * 60_000;
const RETAIN_MS = 75 * 60_000;
type Provider = keyof PublicStatsResponse;
const providers: Provider[] = ["spotify", "clashRoyale", "steam"];
type Snapshot = {
  data: PublicStatsResponse;
  updatedAt: Record<Provider, number>;
  freshUntil: number;
};
type Context = { waitUntil(promise: Promise<unknown>): void };

function publicResponse(data: PublicStatsResponse, state: string) {
  return Response.json(data, {
    headers: { "Cache-Control": "public, max-age=300", "X-Stats-Cache": state },
  });
}

// Cache API storage lasts longer than freshness. Stale reads return immediately
// and explicitly revalidate via waitUntil; Cache API does not implement SWR.
export async function serveStats(request: Request, env: StatsEnv, ctx: Context, cache?: Cache): Promise<Response> {
  const key = new Request(new URL(`/__stats-cache/v1/${Boolean(env.CLASH_ROYALE_API_TOKEN)}/${env.STEAM_ID64 ?? "none"}/${Boolean(env.STEAM_WEB_API_KEY)}`, request.url));
  let previous: Snapshot | undefined;
  try {
    const stored = await cache?.match(key);
    if (stored) previous = await stored.json() as Snapshot;
  } catch { console.error(JSON.stringify({ message: "Stats cache read failed" })); }

  const now = Date.now();
  if (previous) {
    // Don't return a successful provider snapshot beyond the retention limit,
    // even when repeated partial failures have refreshed the cache entry's TTL.
    for (const provider of providers) {
      if (previous.data[provider].status === "ok" && now - previous.updatedAt[provider] >= RETAIN_MS) {
        previous.data[provider] = { status: "unavailable", message: "Live data is temporarily unavailable." };
      }
    }
  }
  if (previous && previous.freshUntil > now) return publicResponse(previous.data, "hit");

  const refresh = async () => {
    const data = await getPublicStats(env);
    const refreshedAt = Date.now();
    const updatedAt = { spotify: 0, clashRoyale: 0, steam: 0 };
    let failed = false;
    for (const provider of providers) {
      const configured = provider === "spotify" || (provider === "clashRoyale"
        ? Boolean(env.CLASH_ROYALE_API_TOKEN) : Boolean(env.STEAM_WEB_API_KEY && env.STEAM_ID64));
      if (data[provider].status === "ok") updatedAt[provider] = refreshedAt;
      else if (configured) {
        failed = true;
        if (previous?.data[provider].status === "ok" && refreshedAt - previous.updatedAt[provider] < RETAIN_MS) {
          // The key and value share the same provider; Object.assign retains the
          // discriminated result without weakening the public response type.
          Object.assign(data, { [provider]: previous.data[provider] });
          updatedAt[provider] = previous.updatedAt[provider];
        }
      }
    }
    const snapshot: Snapshot = { data, updatedAt, freshUntil: refreshedAt + (failed ? 60_000 : FRESH_MS) };
    try {
      await cache?.put(key, Response.json(snapshot, { headers: { "Cache-Control": `public, max-age=${RETAIN_MS / 1000}` } }));
    } catch { console.error(JSON.stringify({ message: "Stats cache write failed" })); }
    return data;
  };

  if (previous) {
    ctx.waitUntil(refresh().catch(() => console.error(JSON.stringify({ message: "Stats refresh failed" }))));
    return publicResponse(previous.data, "stale");
  }
  return publicResponse(await refresh(), "miss");
}
