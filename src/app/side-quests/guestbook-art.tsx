import type { CSSProperties } from "react";
import { guestbookStickerImage, guestbookPokemonIds } from "../../guestbook-model";
import type { GuestbookStickerId } from "../../guestbook-model";

export default function GuestbookSticker({ id }: { id: GuestbookStickerId }) {
  const image = guestbookStickerImage(id);
  return <span className={`guestbook-art-wrap${guestbookPokemonIds.has(id) ? " is-pokemon" : ""}`}
    style={{ "--sticker-image": `url("${image}")` } as CSSProperties}>
    <img src={image}
      alt="" aria-hidden="true" className="guestbook-sticker-art" width="64" height="64" loading="lazy" draggable="false" decoding="async" />
  </span>;
}
