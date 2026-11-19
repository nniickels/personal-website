"use client";

import { useRef, useState } from "react";
import { siteButtons } from "./data";

const ownButton = { name: "nickels", href: "/buttons/nickels-button.svg", download: true };
const embedCode = '<a href="https://nickels.neocities.org/"><img src="https://nicolejiang.com/buttons/nickels-button.svg" alt="nickels" width="88" height="31"></a>';

export default function SiteButtons() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLAnchorElement>(null);
  const [destination, setDestination] = useState<{ name: string; href: string; download?: boolean } | null>(null);
  const [copyStatus, setCopyStatus] = useState("Copy code");
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
      <p className="site-link-heading">Link to me?</p>
      <div className="site-link-content">
        <div className="site-button-wall site-own-button">
          <a href={ownButton.href} download="nickels-button.svg" aria-label="Download nickels site button" aria-describedby="own-button-tooltip"
            onClick={event => {
              if (!dialog.current || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
                || !matchMedia("(max-width: 600px), (hover: none) and (pointer: coarse)").matches) return;
              event.preventDefault();
              trigger.current = event.currentTarget;
              setDestination(ownButton);
              dialog.current.showModal();
            }}>
            <img src={ownButton.href} alt="nickels" width={88} height={31} loading="lazy" />
            <span className="site-button-url" role="tooltip" id="own-button-tooltip">click to download</span>
          </a>
        </div>
        <div className="site-link-embed">
          <pre tabIndex={0} aria-label="HTML code to link to nickels"><code>{embedCode}</code></pre>
          <button className="site-link-copy" type="button" aria-label={copyStatus} title={copyStatus} onClick={async () => {
            try {
              await navigator.clipboard.writeText(embedCode);
              setCopyStatus("Copied!");
            } catch {
              setCopyStatus("Select and copy the code above");
            }
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              {copyStatus === "Copied!" ? <path d="m5 12 4 4L19 6" /> : <><rect x="8" y="8" width="12" height="13" rx="1" /><path d="M16 8V3H4v13h4" /></>}
            </svg>
          </button>
        </div>
      </div>
      <dialog ref={dialog} className="webring-confirmation" aria-labelledby="site-button-confirmation-title"
        onClose={() => { setDestination(null); trigger.current?.focus({ preventScroll: true }); }}>
        <h2 id="site-button-confirmation-title">{destination?.download ? "Click to download?" : `Redirect to ${destination?.name}?`}</h2>
        <div className="webring-confirmation-actions">
          <button type="button" autoFocus onClick={() => dialog.current?.close()}>No</button>
          <button type="button" onClick={() => {
            if (destination?.download) {
              const link = document.createElement("a");
              link.href = destination.href;
              link.download = "nickels-button.svg";
              document.body.appendChild(link);
              link.click();
              link.remove();
            } else if (destination) window.open(destination.href, "_blank", "noopener,noreferrer");
            dialog.current?.close();
          }}>Yes</button>
        </div>
      </dialog>
    </section>
  );
}
