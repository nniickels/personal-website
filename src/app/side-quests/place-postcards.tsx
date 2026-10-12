"use client";

import { useRef, useState } from "react";
import { ResponsiveImage } from "../responsive-image";
import { ExternalLinkIcon } from "../icons";
import { imageAssets } from "./gallery-assets";

import { postcards } from "./place-postcards-data";

export default function PlacePostcards() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState<1 | -1 | null>(null);
  const moving = useRef(false);
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
        Some of my favourite places! I like earning points on Google Maps; Find me{" "}
        <a className="text-link places-maps-link" href="https://maps.app.goo.gl/qet6vnym45NpTQ2XA?g_st=ic" target="_blank" rel="noreferrer"><strong>here!</strong><ExternalLinkIcon /></a>
      </p>
      <div className={`postcard-stack${direction === -1 ? " is-shuffling postcard-stack--backwards" : direction === 1 ? " is-shuffling" : ""}`}>
        {postcards.map((card, cardIndex) => {
          const rank = (cardIndex - index + postcards.length) % postcards.length;
          const active = rank === 0;
          const incoming = direction !== null && cardIndex === (index + direction + postcards.length) % postcards.length;
          const settling = direction === 1 ? rank === 2 : direction === -1 && rank === 1;
          const parked = rank > 2 && !incoming;
          const showBack = active && flipped;
          return (
          <div key={cardIndex}
            className={`postcard-slot postcard-slot--${Math.min(rank, 2)}${parked ? " postcard-parked" : ""}${direction !== null ? active ? " postcard-exiting" : incoming ? " postcard-entering" : settling ? " postcard-settling" : "" : ""}`}
            inert={!active || direction !== null} aria-hidden={!active}
            onAnimationEnd={(event) => { if (active && event.target === event.currentTarget) finishMove(); }}>
        <article className={`place-postcard${showBack ? " is-flipped" : ""}`} aria-label={`${card.title}, postcard ${cardIndex + 1} of ${postcards.length}`}>
          <div className="postcard-face postcard-front" inert={showBack} aria-hidden={showBack}>
            <div className="postcard-photo">
              <ResponsiveImage asset={imageAssets[card.photo]} expanded sizes="(max-width: 600px) 90vw, 640px" alt={card.alt} />
              <span className="postcard-number">POSTCARD No. {String(cardIndex + 1).padStart(2, "0")}</span>
            </div>
            <div className="postcard-caption">
              <div><h3>{card.title}</h3><p>{card.caption}</p></div>
              <button type="button" onClick={() => setFlipped(true)} aria-label={`Turn over ${card.title}`}>Turn over <span aria-hidden="true">↪</span></button>
            </div>
          </div>
          <div className="postcard-face postcard-back" inert={!showBack} aria-hidden={!showBack}>
            <div className="postcard-back-top"><span>POSTCARD / {String(cardIndex + 1).padStart(2, "0")}</span><div className="postcard-postmark">{card.mark}</div><div className="postcard-stamp" aria-hidden="true">{card.stamp}</div></div>
            <div className="postcard-letter">
              <div className="postcard-message"><span className="postcard-rating" aria-label="Sample five star rating">★★★★★ <small>sample rating</small></span><p>{card.note}</p><span className="postcard-signature">— nic</span></div>
              <div className="postcard-address"><span className="postcard-to">a place to remember</span><h3>{card.title}</h3><p><strong>My order</strong>{card.order}</p><p><strong>One thing I remember</strong>{card.memory}</p><a href={card.mapsHref} target="_blank" rel="noreferrer">My Google Maps ↗</a></div>
            </div>
            <div className="postcard-back-bottom"><span>Sample note · preview only</span><button type="button" onClick={() => setFlipped(false)}>Photo side <span aria-hidden="true">↪</span></button></div>
          </div>
        </article>
          </div>
          );
        })}
      </div>
      <div className="postcard-controls"><button type="button" aria-label="Previous favourite place" disabled={direction !== null} onClick={() => move(-1)}>←</button><span aria-live="polite">{index + 1} / {postcards.length}</span><button type="button" aria-label="Next favourite place" disabled={direction !== null} onClick={() => move(1)}>→</button></div>
    </section>
  );
}
