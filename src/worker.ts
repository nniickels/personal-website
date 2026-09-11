/** Cloudflare Worker entry point for the site. */
import handler from "vinext/server/app-router-entry";
import type { StatsEnv } from "./api-stats";
import { serveStats } from "./stats-cache";

interface Env extends StatsEnv {
  GOATCOUNTER_CODE?: string;
  ASSETS: { fetch(request: Request): Promise<Response> };

}

function getGoatCounterCode(env: Env | undefined) {
  // The GoatCounter site code is public. Keep a production-safe fallback so a
  // Git deployment cannot silently disable counting when the optional Worker
  // variable is missing from a newly activated version.
  const code = env?.GOATCOUNTER_CODE?.trim().toLowerCase() || "nickel";
  return code && /^[a-z0-9-]+$/.test(code) ? code : null;
}

async function proxyGoatCounter(request: Request, env: Env | undefined): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/gc/count.js") {
    const response = await fetch("https://gc.zgo.at/count.js");
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return new Response(response.body, { status: response.status, headers });
  }

  const code = getGoatCounterCode(env);
  if (!code) {
    return Response.json(
      { error: "View counter is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const upstreamUrl = new URL(url.pathname.slice(3) + url.search, `https://${code}.goatcounter.com`);

  try {
    return await fetch(new Request(upstreamUrl, request));
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "GoatCounter request failed",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    );
    return Response.json(
      { error: "View counter is temporarily unavailable." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/gc/")) {
      return proxyGoatCounter(request, env);
    }

    if (url.pathname === "/api/stats") {
      if (request.method !== "GET") {
        return Response.json(
          { error: "Method not allowed" },
          { status: 405, headers: { Allow: "GET" } },
        );
      }

      // vinext's local production server does not inject a Worker env object.
      // Public stats.fm data can still load; secret-backed providers report unavailable.
      const cache = typeof caches === "undefined" ? undefined : (caches as CacheStorage & { default?: Cache }).default;
      return serveStats(request, env ?? {}, ctx, cache);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
