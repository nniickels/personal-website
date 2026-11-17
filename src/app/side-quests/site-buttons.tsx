"use client";

import { useRef, useState } from "react";
import { siteButtons } from "./data";

export default function SiteButtons() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLAnchorElement>(null);
  const [destination, setDestination] = useState<(typeof siteButtons)[number] | null>(null);
  return (
    <section className="section" id="buttons">
      <h2>Buttons</h2>
      <p className="site-buttons-description">Cool people and miscellaneous sites and stuff~</p>
      {siteButtons.length ? (
        <div className="site-button-wall">
          {siteButtons.map((site, index) => (
            <a key={site.href} href={site.href} target="_blank" rel="noopener noreferrer" aria-label={site.name} aria-describedby={"site-button-url-" + index}
              onClick={event => {
                if (!dialog.current || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
                  || !matchMedia("(max-width: 600px), (hover: none) and (pointer: coarse)").matches) return;
                event.preventDefault();
                trigger.current = event.currentTarget;
                setDestination(site);
                dialog.current.showModal();
              }}>
              <img src={site.image} alt={site.name} width={88} height={31} loading="lazy" />
              <span className="site-button-url" role="tooltip" id={"site-button-url-" + index}>{site.name}</span>
            </a>
          ))}
        </div>
      ) : <p className="placeholder-copy">A place for buttons from sites I like. Coming soon.</p>}
      <dialog ref={dialog} className="webring-confirmation" aria-labelledby="site-button-confirmation-title"
        onClose={() => { setDestination(null); trigger.current?.focus({ preventScroll: true }); }}>
        <h2 id="site-button-confirmation-title">Redirect to {destination?.name}?</h2>
        <div className="webring-confirmation-actions">
          <button type="button" autoFocus onClick={() => dialog.current?.close()}>No</button>
          <button type="button" onClick={() => {
            if (destination) window.open(destination.href, "_blank", "noopener,noreferrer");
            dialog.current?.close();
          }}>Yes</button>
        </div>
      </dialog>
    </section>
  );
}
