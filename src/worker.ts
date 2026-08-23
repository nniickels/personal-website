/** Cloudflare Worker entry point for the site. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { getPublicStats, type StatsEnv } from "./api-stats";

interface Env extends StatsEnv {
  GOATCOUNTER_CODE?: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
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

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/gc/")) {
      return proxyGoatCounter(request, env);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
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
      const stats = await getPublicStats(env ?? {});
      return Response.json(stats, {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600",
        },
      });
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
