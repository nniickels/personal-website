"use client";

import { useRef, useState, type MouseEvent } from "react";

export function WebringConfirmation() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [destination, setDestination] = useState("");

  function confirmLink(event: MouseEvent<HTMLDivElement>) {
    // The official widget renders its links inside an open shadow root.
    const link = event.nativeEvent.composedPath().find(
      (node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement,
    );
    if (!link || !dialog.current) return;
    const url = new URL(link.href);
    if (url.origin !== "https://webring.ca") return;
    event.preventDefault();
    setDestination(link.href);
    dialog.current.showModal();
  }

  return <>
    <div className="footer-webring" data-webring="ca" data-member="nicole-jiang"
      onClickCapture={confirmLink} />
    <dialog ref={dialog} className="webring-confirmation" aria-labelledby="webring-confirmation-title">
      <h2 id="webring-confirmation-title">
        {destination && new URL(destination).pathname !== "/"
          ? "Redirect to WeBring member?" : "Redirect to WeBring?"}
      </h2>
      <div className="webring-confirmation-actions">
        <button type="button" autoFocus onClick={() => dialog.current?.close()}>No</button>
        <button type="button" onClick={() => { window.location.assign(destination); }}>Yes</button>
      </div>
    </dialog>
  </>;
}
