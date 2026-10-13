"use client";

import { useRef, useState } from "react";
import { ResponsiveImage } from "../responsive-image";
import { ExternalLinkIcon, TurnArrowIcon } from "../icons";
import { imageAssets } from "./gallery-assets";

import { postcards } from "./place-postcards-data";
import { PostcardStamp } from "./postcard-stamp";

export default function PlacePostcards() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState<1 | -1 | null>(null);
  const [editingNumber, setEditingNumber] = useState(false);
  const [numberDraft, setNumberDraft] = useState("");
  const cancelNumberEdit = useRef(false);
  const moving = useRef(false);
  function jumpToNumber() {
    const number = Number(numberDraft);
    if (!cancelNumberEdit.current && !moving.current && /^\d+$/.test(numberDraft)
      && Number.isInteger(number) && number >= 1 && number <= postcards.length) {
      setIndex(number - 1);
      setFlipped(false);
    }
    cancelNumberEdit.current = false;
    setEditingNumber(false);
  }
  function move(step: 1 | -1) {
    if (moving.current) return;
    moving.current = true;
    setDirection(step);
  }
  function finishMove() {
    if (direction === null) return;
    setIndex((current) => (current + direction + postcards.length) % postcards.length);
    setFlipped(false);
    setDirection(null);
    moving.current = false;
  }

  return (
    <section className="section places-section" id="favourite-places" aria-labelledby="places-title">
      <div className="places-heading">
        <h2 id="places-title">Places</h2>
      </div>
      <p className="placeholder-copy">
        Some of my favourite places! I like earning points on Google Maps; find me{" "}
        <a className="text-link places-maps-link" href="https://maps.app.goo.gl/qet6vnym45NpTQ2XA?g_st=ic" target="_blank" rel="noreferrer"><strong>here!</strong><ExternalLinkIcon /></a>
      </p>
      <div className={`postcard-stack${direction === -1 ? " is-shuffling postcard-stack--backwards" : direction === 1 ? " is-shuffling" : ""}`}>
        {postcards.map((card, cardIndex) => {
          const rank = (cardIndex - index + postcards.length) % postcards.length;
          const active = rank === 0;
          const incoming = direction !== null && cardIndex === (index + direction + postcards.length) % postcards.length;
          const settling = direction === 1 ? rank === 2 : direction === -1 && rank === 1;
          const parked = rank > 2 && !incoming;
          // Keep the three visible layers and the previous card ready. The other
          // entries stay in the data, without hidden images or card faces in the DOM.
          if (parked && rank !== postcards.length - 1) return null;
          const showBack = active && flipped;
          const photoAsset = imageAssets[card.photo];
          // Cover-fit landscape images are wider than the mobile frame. Request
          // enough pixels for the whole scaled image, including the cropped edges.
          const mobileImageWidth = photoAsset ? Math.ceil(420 * photoAsset.width / photoAsset.height) : 640;
          return (
          <div key={cardIndex}
            className={`postcard-slot postcard-slot--${Math.min(rank, 2)}${parked ? " postcard-parked" : ""}${direction !== null ? active ? " postcard-exiting" : incoming ? " postcard-entering" : settling ? " postcard-settling" : "" : ""}`}
            inert={!active || direction !== null} aria-hidden={!active}
            onAnimationEnd={(event) => { if (active && event.target === event.currentTarget) finishMove(); }}>
        <article className={`place-postcard${showBack ? " is-flipped" : ""}`} aria-label={`${card.title}, postcard ${cardIndex + 1} of ${postcards.length}`}>
          <div className="postcard-face postcard-front" inert={showBack} aria-hidden={showBack}>
            <div className="postcard-photo">
              {card.photo && photoAsset
                ? <ResponsiveImage asset={photoAsset} expanded
                    loading={parked || incoming ? "eager" : "lazy"}
                    sizes={`(max-width: 600px) max(90vw, ${mobileImageWidth}px), 640px`}
                    style={{ objectPosition: card.photoPosition }} alt={card.alt} />
                : <div className="postcard-photo-placeholder">A place for your next postcard</div>}
              <span className="postcard-number">POSTCARD No. {String(cardIndex + 1).padStart(2, "0")}</span>
            </div>
            <div className="postcard-caption">
              <div><h3>{card.title}</h3><p>{card.caption}</p></div>
              <button type="button" onClick={() => setFlipped(true)} aria-label={`Turn over ${card.title}`}>Turn over <TurnArrowIcon /></button>
            </div>
          </div>
          <div className="postcard-face postcard-back" inert={!showBack} aria-hidden={!showBack}>
            <div className="postcard-back-top"><span>POSTCARD / {String(cardIndex + 1).padStart(2, "0")}</span><div className="postcard-stamp" data-kind={card.stamp} aria-hidden="true"><PostcardStamp kind={card.stamp} /></div></div>
            <div className="postcard-letter">
              <div className="postcard-message"><span className="postcard-rating" aria-label="Five star rating">★★★★★</span><p>{card.note}</p><span className="postcard-signature">— nic</span></div>
              <div className="postcard-address"><span className="postcard-to">a place to remember</span><h3>{card.title}</h3><p className="postcard-location">{card.address || "\u00a0"}</p><p className="postcard-location">{card.country || "\u00a0"}</p><p className="postcard-highlight"><strong>Don’t miss</strong>{card.order}</p></div>
            </div>
            <div className="postcard-back-bottom"><button type="button" onClick={() => setFlipped(false)}>Photo side <TurnArrowIcon /></button></div>
          </div>
        </article>
          </div>
          );
        })}
      </div>
      <div className="postcard-controls">
        <button type="button" aria-label="Previous favourite place" disabled={direction !== null} onClick={() => move(-1)}>←</button>
        <span className="postcard-counter">
          {editingNumber ? <input className="postcard-number-input" type="text" inputMode="numeric" pattern="[0-9]*"
            maxLength={String(postcards.length).length} aria-label={`Postcard number (1 to ${postcards.length})`}
            autoFocus value={numberDraft}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => setNumberDraft(event.target.value)} onBlur={jumpToNumber}
            onKeyDown={(event) => {
              if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); }
              if (event.key === "Escape") { cancelNumberEdit.current = true; event.currentTarget.blur(); }
            }} /> : <button type="button" className="postcard-number-display"
              aria-label={`Edit postcard number, currently ${index + 1} of ${postcards.length}`}
              disabled={direction !== null}
              onClick={() => { setNumberDraft(String(index + 1)); setEditingNumber(true); }}>
              {index + 1}
            </button>}
          <span aria-hidden="true"> / {postcards.length}</span>
        </span>
        <button type="button" aria-label="Next favourite place" disabled={direction !== null} onClick={() => move(1)}>→</button>
      </div>
    </section>
  );
}
