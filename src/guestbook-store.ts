import { guestbookPlacementOccupied, parseGuestbookSubmission } from "./guestbook-model";
import type { GuestbookEntry } from "./guestbook-model";

interface Storage {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
  list<T>(options: { prefix: string }): Promise<Map<string, T>>;
  transaction<T>(callback: (storage: Storage) => Promise<T>): Promise<T>;
}

export interface GuestbookNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(request: Request): Promise<Response> };
}

function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}

// One object holds the shared scene. Transactions prevent simultaneous posts
// from overwriting each other or occupying the same position.
export class Guestbook {
  constructor(private state: { storage: Storage }) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method === "GET") {
      const records = await this.state.storage.list<GuestbookEntry>({ prefix: "entry:" });
      return json({ entries: [...records.values()].sort((a, b) => a.placedAt.localeCompare(b.placedAt)) });
    }
    if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "GET, POST" } });
    if (!request.headers.get("Content-Type")?.startsWith("application/json")) return json({ error: "Send a JSON entry." }, 415);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "An entry is required." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return json({ error: "The entry is too large." }, 413);
      }
      chunks.push(value);
    }
    let value: unknown;
    try {
      const body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
      }
      value = JSON.parse(new TextDecoder().decode(body));
    } catch {
      return json({ error: "The entry could not be read." }, 400);
    }
    const submission = parseGuestbookSubmission(value);
    if (!submission) return json({ error: "Choose a sticker, enter a name, and place it in its allowed area." }, 400);
    return this.state.storage.transaction(async (storage) => {
      const key = "entry:" + submission.id;
      const existing = await storage.get<GuestbookEntry>(key);
      if (existing) {
        if (existing.sticker !== submission.sticker || (existing.message || "") !== (submission.message || "") || existing.name !== submission.name || existing.x !== submission.x || existing.y !== submission.y) {
          return json({ error: "That entry was already placed." }, 409);
        }
        return json({ entry: existing });
      }
      const records = await storage.list<GuestbookEntry>({ prefix: "entry:" });
      if (records.size >= 1200) return json({ error: "This landscape is full." }, 409);
      if (guestbookPlacementOccupied([...records.values()], submission.x, submission.y)) return json({ error: "Move a little to the side. Stickers can overlap." }, 409);
      const entry: GuestbookEntry = { ...submission, placedAt: new Date().toISOString() };
      await storage.put(key, entry);
      return json({ entry }, 201);
    });
  }
}

export async function serveGuestbook(request: Request, namespace?: GuestbookNamespace) {
  if (request.method !== "GET" && request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "GET, POST" } });
  if (request.method === "POST" && request.headers.get("Origin") !== new URL(request.url).origin) {
    return json({ error: "Place stickers from the guestbook page." }, 403);
  }
  if (!namespace) return json({ error: "The guestbook is unavailable. Please try again later." }, 503);
  try {
    return await namespace.get(namespace.idFromName("side-landscape-v1")).fetch(request);
  } catch (error) {
    console.error("Guestbook storage request failed.", error);
    return json({ error: "The guestbook could not be saved. Please try again." }, 503);
  }
}
