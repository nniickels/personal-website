export interface StatsEnv {
  APIFY_TOKEN?: string;
  CLASH_ROYALE_API_TOKEN?: string;
  STEAM_WEB_API_KEY?: string;
  STEAM_ID64?: string;
}

type ProviderResult<T> =
  | { status: "ok"; data: T }
  | { status: "unavailable"; message: string };

type SpotifyArtist = {
  name: string;
  href: string | null;
  playedMs: number;
};

type SpotifyTrack = {
  name: string;
  artists: string[];
  href: string | null;
  playedMs: number;
};

type SpotifyGenre = {
  name: string;
  playedMs: number;
};

type SteamGame = {
  name: string;
  playtimeMinutes: number | null;
  storeHref: string;
};

export type PublicStatsResponse = {
  pinterest: ProviderResult<{ monthlyViews: number }>;
  spotify: ProviderResult<{
    source: "stats.fm";
    range: "lifetime";
    orderBy: "time";
    genres: SpotifyGenre[];
    artists: SpotifyArtist[];
    tracks: SpotifyTrack[];
  }>;
  clashRoyale: ProviderResult<{ trophies: number }>;
  steam: ProviderResult<{ recentlyPlayed: SteamGame[]; windowDays: 14 }>;
};

class UpstreamError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number,
  ) {
    super(`${provider} returned ${status}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

async function fetchJson(provider: string, url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new UpstreamError(provider, response.status);
  }
  return response.json();
}

async function providerResult<T>(
  provider: string,
  configured: boolean,
  load: () => Promise<T>,
): Promise<ProviderResult<T>> {
  if (!configured) {
    return { status: "unavailable", message: "API connection required." };
  }

  try {
    return { status: "ok", data: await load() };
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "portfolio stats request failed",
        provider,
        status: error instanceof UpstreamError ? error.status : undefined,
      }),
    );
    return { status: "unavailable", message: "Live data is temporarily unavailable." };
  }
}

function statsFmSpotifyHref(item: Record<string, unknown>, type: "artist" | "track") {
  const externalIds = isRecord(item.externalIds) ? item.externalIds : null;
  const spotifyId = externalIds
    ? getArray(externalIds.spotify).find((value): value is string => typeof value === "string")
    : null;
  return spotifyId ? `https://open.spotify.com/${type}/${spotifyId}` : null;
}

async function getSpotifyStats() {
  const baseUrl = "https://api.stats.fm/api/v1/users/nnickels/top";
  const query = "range=lifetime&orderBy=TIME&limit=10";
  const [genrePayload, artistPayload, trackPayload] = await Promise.all([
    fetchJson(
      "stats.fm-genres",
      `${baseUrl}/genres?${query}`,
    ),
    fetchJson(
      "stats.fm-artists",
      `${baseUrl}/artists?${query}`,
    ),
    fetchJson("stats.fm-tracks", `${baseUrl}/tracks?${query}`),
  ]);

  const genreItems = isRecord(genrePayload) ? getArray(genrePayload.items) : [];
  const artistItems = isRecord(artistPayload) ? getArray(artistPayload.items) : [];
  const trackItems = isRecord(trackPayload) ? getArray(trackPayload.items) : [];

  const genres = genreItems.flatMap((item): SpotifyGenre[] => {
    if (!isRecord(item) || !isRecord(item.genre)) return [];
    const name = getString(item.genre.tag);
    const playedMs = getNumber(item.playedMs);
    return name && playedMs !== null ? [{ name, playedMs }] : [];
  }).slice(0, 5);

  const artists = artistItems.flatMap((item): SpotifyArtist[] => {
    if (!isRecord(item) || !isRecord(item.artist)) return [];
    const name = getString(item.artist.name);
    const playedMs = getNumber(item.playedMs);
    return name && playedMs !== null
      ? [{ name, href: statsFmSpotifyHref(item.artist, "artist"), playedMs }]
      : [];
  });

  const tracks = trackItems.flatMap((item): SpotifyTrack[] => {
    if (!isRecord(item) || !isRecord(item.track)) return [];
    const name = getString(item.track.name);
    const playedMs = getNumber(item.playedMs);
    if (!name || playedMs === null) return [];
    const artistNames = getArray(item.track.artists).flatMap((artist): string[] => {
      if (!isRecord(artist)) return [];
      const artistName = getString(artist.name);
      return artistName ? [artistName] : [];
    });
    return [{
      name,
      artists: artistNames,
      href: statsFmSpotifyHref(item.track, "track"),
      playedMs,
    }];
  });

  return {
    source: "stats.fm" as const,
    range: "lifetime" as const,
    orderBy: "time" as const,
    genres,
    artists,
    tracks,
  };
}

type CloudflareCacheStorage = CacheStorage & { default: Cache };

async function getPinterestStats(env: StatsEnv): Promise<{ monthlyViews: number }> {
  const cache = (globalThis.caches as CloudflareCacheStorage | undefined)?.default;
  const cacheKey = new Request("https://nicolejiang.com/__cache/pinterest-monthly-views");
  const cached = await cache?.match(cacheKey);

  if (cached) {
    const cachedPayload: unknown = await cached.json();
    const cachedMonthlyViews = isRecord(cachedPayload)
      ? getNumber(cachedPayload.monthlyViews)
      : null;
    if (cachedMonthlyViews !== null) return { monthlyViews: cachedMonthlyViews };
  }

  const payload = await fetchJson(
    "pinterest",
    "https://api.apify.com/v2/actors/fetch_cat~pinterest-profile-scraper/run-sync-get-dataset-items?timeout=45&clean=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.APIFY_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usernames: ["nnickelsj"],
        includeBoards: false,
        includePins: false,
      }),
      signal: AbortSignal.timeout(50_000),
    },
  );

  const profile = getArray(payload).find(isRecord);
  const monthlyViews = profile ? getNumber(profile.monthlyViews) : null;
  if (monthlyViews === null) {
    throw new Error("Pinterest profile response did not include monthlyViews");
  }

  const result = { monthlyViews };
  if (cache) {
    await cache.put(
      cacheKey,
      Response.json(result, { headers: { "Cache-Control": "public, max-age=21600" } }),
    );
  }
  return result;
}

async function getClashRoyaleStats(env: StatsEnv): Promise<{ trophies: number }> {
  const playerTag = "#PP0U9GRVL";
  const payload = await fetchJson(
    "clash-royale",
    `https://proxy.royaleapi.dev/v1/players/${encodeURIComponent(playerTag)}`,
    { headers: { Authorization: `Bearer ${env.CLASH_ROYALE_API_TOKEN}` } },
  );
  const trophies = isRecord(payload) ? getNumber(payload.trophies) : null;
  if (trophies === null) {
    throw new Error("Clash Royale response did not include trophies");
  }
  return { trophies };
}

async function getSteamStats(
  env: StatsEnv,
): Promise<{ recentlyPlayed: SteamGame[]; windowDays: 14 }> {
  const url = new URL(
    "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/",
  );
  url.search = new URLSearchParams({
    key: env.STEAM_WEB_API_KEY ?? "",
    steamid: env.STEAM_ID64 ?? "",
    count: "3",
    format: "json",
  }).toString();

  const payload = await fetchJson("steam", url.toString());
  const response = isRecord(payload) && isRecord(payload.response) ? payload.response : null;
  const games = response ? getArray(response.games) : [];
  return {
    windowDays: 14,
    recentlyPlayed: games.flatMap((game): SteamGame[] => {
      if (!isRecord(game)) return [];
      const appId = getNumber(game.appid);
      const name = getString(game.name);
      if (appId === null || !name) return [];
      return [
        {
          name,
          playtimeMinutes: getNumber(game.playtime_2weeks),
          storeHref: `https://store.steampowered.com/app/${appId}/`,
        },
      ];
    }),
  };
}

export async function getPublicStats(env: StatsEnv): Promise<PublicStatsResponse> {
  const [pinterest, spotify, clashRoyale, steam] = await Promise.all([
    providerResult("pinterest", Boolean(env.APIFY_TOKEN), () => getPinterestStats(env)),
    providerResult("stats.fm", true, getSpotifyStats),
    providerResult(
      "clash-royale",
      Boolean(env.CLASH_ROYALE_API_TOKEN),
      () => getClashRoyaleStats(env),
    ),
    providerResult("steam", Boolean(env.STEAM_WEB_API_KEY && env.STEAM_ID64), () =>
      getSteamStats(env),
    ),
  ]);

  return { pinterest, spotify, clashRoyale, steam };
}
