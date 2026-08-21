export interface StatsEnv {
  PINTEREST_ACCESS_TOKEN?: string;
  SPOTIFY_CLIENT_ID?: string;
  SPOTIFY_CLIENT_SECRET?: string;
  SPOTIFY_REFRESH_TOKEN?: string;
  CLASH_ROYALE_API_TOKEN?: string;
  CLASH_ROYALE_PLAYER_TAG?: string;
  STEAM_WEB_API_KEY?: string;
  STEAM_ID64?: string;
}

type ProviderResult<T> =
  | { status: "ok"; data: T }
  | { status: "unavailable"; message: string };

type SpotifyArtist = {
  name: string;
  href: string | null;
};

type SpotifyTrack = {
  name: string;
  artists: string[];
  href: string | null;
};

type SteamGame = {
  name: string;
  playtimeMinutes: number | null;
  storeHref: string;
};

export type PublicStatsResponse = {
  pinterest: ProviderResult<{ monthlyViews: number }>;
  spotify: ProviderResult<{
    range: "long_term";
    genres: string[];
    artists: SpotifyArtist[];
    tracks: SpotifyTrack[];
  }>;
  clashRoyale: ProviderResult<{ trophies: number }>;
  steam: ProviderResult<{ recentlyPlayed: SteamGame[] }>;
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

async function getPinterestStats(env: StatsEnv): Promise<{ monthlyViews: number }> {
  const payload = await fetchJson("pinterest", "https://api.pinterest.com/v5/user_account", {
    headers: { Authorization: `Bearer ${env.PINTEREST_ACCESS_TOKEN}` },
  });

  const monthlyViews = isRecord(payload) ? getNumber(payload.monthly_views) : null;
  if (monthlyViews === null) {
    throw new Error("Pinterest response did not include monthly_views");
  }
  return { monthlyViews };
}

async function getSpotifyAccessToken(env: StatsEnv): Promise<string> {
  const credentials = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
  const payload = await fetchJson("spotify-token", "https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: env.SPOTIFY_REFRESH_TOKEN ?? "",
    }),
  });
  const accessToken = isRecord(payload) ? getString(payload.access_token) : null;
  if (!accessToken) {
    throw new Error("Spotify token response did not include an access token");
  }
  return accessToken;
}

function spotifyHref(item: Record<string, unknown>): string | null {
  return isRecord(item.external_urls) ? getString(item.external_urls.spotify) : null;
}

async function getSpotifyStats(env: StatsEnv) {
  const accessToken = await getSpotifyAccessToken(env);
  const headers = { Authorization: `Bearer ${accessToken}` };
  const [artistPayload, trackPayload] = await Promise.all([
    fetchJson(
      "spotify-artists",
      "https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=10",
      { headers },
    ),
    fetchJson(
      "spotify-tracks",
      "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=10",
      { headers },
    ),
  ]);

  const artistItems = isRecord(artistPayload) ? getArray(artistPayload.items) : [];
  const trackItems = isRecord(trackPayload) ? getArray(trackPayload.items) : [];
  const genreCounts = new Map<string, number>();

  const artists = artistItems.flatMap((item): SpotifyArtist[] => {
    if (!isRecord(item)) return [];
    for (const genre of getArray(item.genres)) {
      if (typeof genre === "string") genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
    const name = getString(item.name);
    return name ? [{ name, href: spotifyHref(item) }] : [];
  });

  const tracks = trackItems.flatMap((item): SpotifyTrack[] => {
    if (!isRecord(item)) return [];
    const name = getString(item.name);
    if (!name) return [];
    const artistNames = getArray(item.artists).flatMap((artist): string[] => {
      if (!isRecord(artist)) return [];
      const artistName = getString(artist.name);
      return artistName ? [artistName] : [];
    });
    return [{ name, artists: artistNames, href: spotifyHref(item) }];
  });

  const genres = [...genreCounts.entries()]
    .sort(([leftName, leftCount], [rightName, rightCount]) =>
      rightCount - leftCount || leftName.localeCompare(rightName),
    )
    .slice(0, 5)
    .map(([genre]) => genre);

  return { range: "long_term" as const, genres, artists, tracks };
}

async function getClashRoyaleStats(env: StatsEnv): Promise<{ trophies: number }> {
  const playerTag = (env.CLASH_ROYALE_PLAYER_TAG ?? "").trim().replace(/^#/, "").toUpperCase();
  const payload = await fetchJson(
    "clash-royale",
    `https://proxy.royaleapi.dev/v1/players/${encodeURIComponent(`#${playerTag}`)}`,
    { headers: { Authorization: `Bearer ${env.CLASH_ROYALE_API_TOKEN}` } },
  );
  const trophies = isRecord(payload) ? getNumber(payload.trophies) : null;
  if (trophies === null) {
    throw new Error("Clash Royale response did not include trophies");
  }
  return { trophies };
}

async function getSteamStats(env: StatsEnv): Promise<{ recentlyPlayed: SteamGame[] }> {
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
    providerResult("pinterest", Boolean(env.PINTEREST_ACCESS_TOKEN), () =>
      getPinterestStats(env),
    ),
    providerResult(
      "spotify",
      Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET && env.SPOTIFY_REFRESH_TOKEN),
      () => getSpotifyStats(env),
    ),
    providerResult(
      "clash-royale",
      Boolean(env.CLASH_ROYALE_API_TOKEN && env.CLASH_ROYALE_PLAYER_TAG),
      () => getClashRoyaleStats(env),
    ),
    providerResult("steam", Boolean(env.STEAM_WEB_API_KEY && env.STEAM_ID64), () =>
      getSteamStats(env),
    ),
  ]);

  return { pinterest, spotify, clashRoyale, steam };
}

