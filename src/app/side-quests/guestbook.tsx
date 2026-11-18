"use client";

import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, FormEvent, MouseEvent, PointerEvent } from "react";
import { allowsGuestbookPlacement, guestbookAllowedZones, guestbookNameLimit, guestbookMessageLimit, guestbookWebsiteLimit, parseGuestbookWebsite, guestbookPickerStickers, guestbookStickersPerPage, guestbookMobileStickersPerPage, guestbookStickerWidth, guestbookPlacementOccupied, guestbookStickers, guestbookStickerImage } from "../../guestbook-model";
import type { GuestbookEntry, GuestbookStickerId } from "../../guestbook-model";
import GuestbookSticker from "./guestbook-art";
import "./guestbook.css";

const zoneLabels = { sky: "in the sky", land: "in the grass", lake: "in the pond", tree: "on the tree", snow: "in the snow" } as const;

function showHoverLabel(label: HTMLElement, box: DOMRect) {
  label.showPopover?.();
  const size = label.getBoundingClientRect();
  label.style.left = Math.max(8, Math.min(window.innerWidth - size.width - 8, box.left + box.width / 2 - size.width / 2)) + "px";
  label.style.top = Math.max(8, Math.min(window.innerHeight - size.height - 8, box.top > size.height + 12 ? box.top - size.height - 6 : box.bottom + 6)) + "px";
}
function showEntryLabel(button: HTMLElement) {
  const label = button.querySelector<HTMLElement>(".guestbook-entry-label");
  if (label) showHoverLabel(label, button.getBoundingClientRect());
}
function hideEntryLabel(button: HTMLElement) {
  const label = button.querySelector<HTMLElement>(".guestbook-entry-label");
  if (label?.matches(":popover-open")) label.hidePopover();
}

const stickerDateFormat = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" });
function stickerLabel(entry: GuestbookEntry) {
  return `${entry.name} · ${stickerDateFormat.format(new Date(entry.placedAt))}`;
}

const historyDateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true });
const StickerHistory = memo(function StickerHistory({ entries, expanded, confirmWebsite }: { entries: readonly GuestbookEntry[]; expanded: boolean; confirmWebsite: (event: MouseEvent<HTMLElement>, entry: GuestbookEntry) => void }) {
  const log = useRef<HTMLDivElement>(null);
  const atTop = useRef(true);
  const newestFirst = [...entries].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  useEffect(() => {
    if (!expanded && atTop.current && log.current) log.current.scrollTop = 0;
  }, [entries, expanded]);
  return <section className="guestbook-history" aria-label="History">
    <h3>History</h3>
    <div className="guestbook-history-log" ref={log} tabIndex={0} role="region" aria-label="History entries"
      onScroll={event => { const view = event.currentTarget; atTop.current = view.scrollTop < 16; }}>
      <table aria-label="Sticker placements: date, name, message, sticker, and placement number">
        <colgroup><col className="history-date-column" /><col className="history-name-column" /><col /><col className="history-sticker-column" /><col className="history-number-column" /></colgroup>
        <thead><tr><th scope="col">date</th><th scope="col">name</th><th scope="col">message</th><th scope="col">sticker</th><th scope="col" className="guestbook-history-number">#</th></tr></thead>
        <tbody>{newestFirst.map((entry, index) => <tr key={entry.id}>
          <td><time dateTime={entry.placedAt}>{historyDateFormat.format(new Date(entry.placedAt)).replace(",", "")}</time></td>
          <td className="guestbook-history-name">{entry.website ? <a className="guestbook-website-name" href={entry.website} title={entry.website} target="_blank" rel="ugc nofollow noopener noreferrer"
            onClick={event => confirmWebsite(event, entry)}>{entry.name}</a> : entry.name}</td>
          <td className="guestbook-history-message">{entry.message}</td>
          <td className="guestbook-history-sticker">{guestbookStickers.find(sticker => sticker.id === entry.sticker)?.label || "Sticker"}</td>
          <td className="guestbook-history-number" aria-label={"Placement " + (newestFirst.length - index)}>{newestFirst.length - index}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
});

export default function Guestbook() {
  const section = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const websiteDialog = useRef<HTMLDialogElement>(null);
  const websiteTrigger = useRef<HTMLElement | null>(null);
  const [websiteDestination, setWebsiteDestination] = useState<GuestbookEntry | null>(null);
  const scenery = useRef<HTMLImageElement>(null);
  const pickerTooltip = useRef<HTMLSpanElement>(null);
  const picker = useRef<HTMLElement>(null);
  const [pickerLabel, setPickerLabel] = useState<{ sticker: GuestbookStickerId; text: string; x: number; top: number; bottom: number } | null>(null);
  const landscapePointer = useRef<{ x: number; y: number; at: number } | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(guestbookStickersPerPage);
  const pointerDrag = useRef<{ sticker: GuestbookStickerId; pointerId: number; x: number; y: number; active: boolean } | null>(null);
  const skipPickerClick = useRef(false);
  const [dragging, setDragging] = useState<{ sticker: GuestbookStickerId; x: number; y: number } | null>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [popup, setPopup] = useState("");
  const inspectedEntry = useRef<string | null>(null);
  const requestId = useRef<string | null>(null);
  const preloadedStickers = useRef(new Map<string, HTMLImageElement>());
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [stickerId, setStickerId] = useState<GuestbookStickerId>("lilypad");
  const [name, setName] = useState("");
  const [visitorMessage, setVisitorMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const id = useId();
  const pageCount = Math.ceil(guestbookPickerStickers.length / pageSize);
  const visibleStickers = expanded ? guestbookPickerStickers : guestbookPickerStickers.slice(page * pageSize, (page + 1) * pageSize);
  const valid = position && allowsGuestbookPlacement(stickerId, position.x, position.y);
  const occupied = position && guestbookPlacementOccupied(entries, position.x, position.y);

  useEffect(() => {
    const phone = window.matchMedia("(max-width: 600px)");
    function resizePages() {
      const size = phone.matches ? guestbookMobileStickersPerPage : guestbookStickersPerPage;
      setPageSize(size);
      setPage(current => Math.min(current, Math.ceil(guestbookPickerStickers.length / size) - 1));
    }
    resizePages();
    phone.addEventListener("change", resizePages);
    return () => phone.removeEventListener("change", resizePages);
  }, []);

  useEffect(() => {
    const sheet = picker.current;
    function keepDragging(event: TouchEvent) {
      if (pointerDrag.current?.active) event.preventDefault();
    }
    sheet?.addEventListener("touchmove", keepDragging, { passive: false });
    return () => sheet?.removeEventListener("touchmove", keepDragging);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = false;
    let pending = false;
    let lastRefresh = 0;
    let interval: number | undefined;
    async function refresh() {
      if (document.hidden || pending) return;
      pending = true;
      try {
        const response = await fetch("/api/guestbook", { signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "The guestbook could not be loaded.");
        setEntries((current) => [...new Map<string, GuestbookEntry>(
          [...current, ...data.entries].map((entry: GuestbookEntry) => [entry.id, entry]),
        ).values()]);
        setLoaded(true);
        setLoadError("");
        lastRefresh = Date.now();
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "The guestbook could not be loaded.");
      } finally {
        pending = false;
      }
    }
    // Fetch once when Side hydrates; proximity only controls refresh polling.
    void refresh();
    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      clearInterval(interval);
      if (active) {
        if (Date.now() - lastRefresh >= 20_000) void refresh();
        interval = window.setInterval(refresh, 20_000);
      }
    }, { rootMargin: "250px" });
    if (section.current) observer.observe(section.current);
    const onVisibility = () => { if (active || !lastRefresh) void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      controller.abort();
      observer.disconnect();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    const sheet = expanded ? guestbookPickerStickers
      : guestbookPickerStickers.slice(page * pageSize, (page + 1) * pageSize);
    // Deduplicate shared artwork across signatures and the current picker page.
    for (const sticker of [...entries.map(entry => entry.sticker), ...sheet.map(item => item.id)]) {
      const source = guestbookStickerImage(sticker);
      if (preloadedStickers.current.has(source)) continue;
      const image = new Image();
      image.decoding = "async";
      image.src = source;
      preloadedStickers.current.set(source, image);
      void image.decode().catch(() => { /* The displayed image can retry normally. */ });
    }
  }, [entries, page, pageSize, expanded]);

  useEffect(() => {
    function syncFullscreen() {
      setExpanded(document.fullscreenElement === section.current);
    }
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && !dialog.current?.open && !websiteDialog.current?.open && !document.fullscreenElement) setExpanded(false);
    }
    document.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", escape);
    };
  }, [expanded]);

  useEffect(() => {
    const tooltip = pickerTooltip.current;
    if (!tooltip) return;
    if (!pickerLabel) { if (tooltip.matches(":popover-open")) tooltip.hidePopover(); return; }
    tooltip.showPopover?.();
    const box = tooltip.getBoundingClientRect();
    tooltip.style.left = Math.max(8, Math.min(window.innerWidth - box.width - 8, pickerLabel.x - box.width / 2)) + "px";
    tooltip.style.top = (pickerLabel.top > box.height + 12 ? pickerLabel.top - box.height - 6 : pickerLabel.bottom + 6) + "px";
  }, [pickerLabel]);

  useEffect(() => {
    function dismissLabels() {
      setPickerLabel(null);
      section.current?.querySelectorAll<HTMLElement>(".guestbook-entry-label:popover-open").forEach(label => label.hidePopover());
      inspectedEntry.current = null;
    }
    window.addEventListener("scroll", dismissLabels, true);
    return () => window.removeEventListener("scroll", dismissLabels, true);
  }, []);

  const confirmWebsite = useCallback((event: MouseEvent<HTMLElement>, entry: GuestbookEntry) => {
    event.stopPropagation();
    if (!websiteDialog.current || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      || !window.matchMedia("(max-width: 600px), (hover: none) and (pointer: coarse)").matches) return;
    event.preventDefault();
    hideEntryLabel(event.currentTarget);
    websiteTrigger.current = event.currentTarget;
    setWebsiteDestination(entry);
    websiteDialog.current.showModal();
  }, []);

  function showPickerLabel(target: HTMLButtonElement, sticker: GuestbookStickerId, text: string) {
    const box = target.getBoundingClientRect();
    setPickerLabel({ sticker, text, x: box.left + box.width / 2, top: box.top, bottom: box.bottom });
  }

  async function toggleFullscreen() {
    setPickerLabel(null);
    if (expanded) {
      if (document.fullscreenElement === section.current) await document.exitFullscreen();
      setExpanded(false);
    } else {
      setExpanded(true);
      // Keep an expanded view on browsers without the Fullscreen API.
      try { await section.current?.requestFullscreen?.(); } catch { /* Expanded view remains available. */ }
    }
  }

  function stickerStyle(sticker: GuestbookStickerId, x: number, y: number): CSSProperties {
    return { left: x * 100 + "%", top: y * 100 + "%", width: guestbookStickerWidth(sticker) + "%" };
  }

  function landscapePoint(clientX: number, clientY: number) {
    const box = scenery.current?.getBoundingClientRect();
    if (!box || clientX < box.left || clientX >= box.right || clientY < box.top || clientY >= box.bottom) return null;
    return { x: (clientX - box.left) / box.width, y: (clientY - box.top) / box.height };
  }
  const dragPoint = dragging && landscapePoint(dragging.x, dragging.y);
  const livePoint = dragPoint || (!dragging && hoverPoint);
  const liveSticker = dragging?.sticker || stickerId;

  function selectSticker(sticker: GuestbookStickerId) {
    setStickerId(sticker);
    setPage(Math.floor(guestbookPickerStickers.findIndex(item => item.id === sticker) / pageSize));
    setMessage("");
  }

  function placePreview(event: MouseEvent<HTMLDivElement>) {
    const pointer = landscapePointer.current;
    landscapePointer.current = null;
    if (event.detail > 0 && pointer && performance.now() - pointer.at < 500) openPlacement(stickerId, pointer.x, pointer.y);
    else openPlacement(stickerId, event.clientX, event.clientY);
  }

  function openPlacement(sticker: GuestbookStickerId, clientX: number, clientY: number) {
    if (saving || !scenery.current) return;
    selectSticker(sticker);
    inspectedEntry.current = null;
    const box = scenery.current.getBoundingClientRect();
    const next = { x: (clientX - box.left) / box.width, y: (clientY - box.top) / box.height };
    requestId.current = null;
    setMessage("");
    if (!loaded || loadError) {
      setPosition(null);
      setPopup(loadError || "The guestbook is still loading. Try again in a moment.");
    } else if (!allowsGuestbookPlacement(sticker, next.x, next.y)) {
      setPosition(null);
      setPopup("Can't place here. Choose a spot " + guestbookAllowedZones(sticker).map(zone => zoneLabels[zone]).join(" or ") + ".");
    } else if (guestbookPlacementOccupied(entries, next.x, next.y)) {
      setPosition(null);
      setPopup("Move a little to the side. Stickers can overlap.");
    } else {
      setPopup("");
      setName("");
      setVisitorMessage("");
      setWebsite("");
      setPosition(next);
    }
    dialog.current?.showModal();
  }

  function beginDrag(event: PointerEvent<HTMLButtonElement>, sticker: GuestbookStickerId) {
    setPickerLabel(null);
    if (saving || !event.isPrimary || event.button !== 0) return;
    skipPickerClick.current = false;
    pointerDrag.current = { sticker, pointerId: event.pointerId, x: event.clientX, y: event.clientY, active: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const drag = pointerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.active) {
      if (Math.hypot(dx, dy) < 6) return;
      // Scroll along the picker; drag toward the landscape.
      if (event.pointerType === "touch") {
        const stacked = window.matchMedia("(max-width: 600px)").matches;
        if (stacked && !expanded ? Math.abs(dx) > Math.abs(dy) : Math.abs(dy) > Math.abs(dx)) return;
      }
      drag.active = true;
    }
    setPickerLabel(null);
    setDragging({ sticker: drag.sticker, x: event.clientX, y: event.clientY });
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    const drag = pointerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    pointerDrag.current = null;
    setDragging(null);
    if (!drag.active) return;
    skipPickerClick.current = true;
    const box = scenery.current?.getBoundingClientRect();
    if (box && event.clientX >= box.left && event.clientX < box.right && event.clientY >= box.top && event.clientY < box.bottom) {
      openPlacement(drag.sticker, event.clientX, event.clientY);
    }
  }

  function cancelDrag() {
    pointerDrag.current = null;
    setDragging(null);
  }

  function closeDialog() {
    if (saving) return;
    dialog.current?.close();
    setPosition(null);
    setPopup("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!position || !valid || occupied || saving || !loaded) return;
    if (parseGuestbookWebsite(website) === null) {
      setMessage("Enter a valid http or https website, or leave it blank.");
      return;
    }
    setSaving(true);
    setMessage("");
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestId.current, sticker: stickerId, name, message: visitorMessage, website, ...position }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your sticker could not be saved.");
      setEntries((current) => [...current.filter((entry) => entry.id !== data.entry.id), data.entry]);
      dialog.current?.close();
      setPosition(null);
      requestId.current = null;
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your sticker could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`section guestbook-section${expanded ? " is-expanded" : ""}`} id="guestbook" ref={section}>
      <div className="guestbook-heading">
        <h2>Guestbook</h2>

      </div>
      <p className="guestbook-description">You made it to the end! Grab a sticker and place it on the landscape for everyone to see.</p>
      <div className="guestbook-workspace">
        <div className="guestbook-picture-frame">
        <div className="guestbook-landscape" role="group" aria-label="Guestbook landscape. Blue sky, a snowy mountain, grass, trees, and a pond."
          aria-describedby={id + "-help"} onPointerUp={event => { landscapePointer.current = { x: event.clientX, y: event.clientY, at: performance.now() }; }} onClick={placePreview}
          onPointerMove={event => { if (event.pointerType !== "touch") setHoverPoint(landscapePoint(event.clientX, event.clientY)); }}
          onPointerLeave={() => setHoverPoint(null)}
          style={{ cursor: "none" }}>
          <img ref={scenery} src="/guestbook/landscape.png" width="1024" height="576" alt="" draggable="false" decoding="async" className="guestbook-scenery" aria-hidden="true" />
          {entries.map((entry) => {
            const item = guestbookStickers.find((sticker) => sticker.id === entry.sticker);
            if (!item) return null;
            const label = stickerLabel(entry);
            const Placed = entry.website ? "a" : "button";
            return <Placed type={entry.website ? undefined : "button"} href={entry.website} target={entry.website ? "_blank" : undefined}
              rel={entry.website ? "ugc nofollow noopener noreferrer" : undefined} title={entry.website}
              key={entry.id} className="guestbook-placed"
              style={stickerStyle(entry.sticker, entry.x, entry.y)}
              aria-label={item.label + " · " + label}
              onPointerEnter={event => showEntryLabel(event.currentTarget)} onPointerLeave={event => hideEntryLabel(event.currentTarget)}
              onFocus={event => showEntryLabel(event.currentTarget)} onBlur={event => hideEntryLabel(event.currentTarget)} onClick={(event) => {
                if (entry.website) { confirmWebsite(event, entry); return; }
                if (event.detail === 0) { event.stopPropagation(); return; }
                // On touch, the first tap shows the label; a second can place
                // through this sticker. Mouse clicks can overlap immediately.
                if (window.matchMedia("(hover: none)").matches && inspectedEntry.current !== entry.id) {
                  inspectedEntry.current = entry.id;
                  event.currentTarget.focus();
                  event.stopPropagation();
                }
              }}>
              <GuestbookSticker id={entry.sticker} />
              <span className="guestbook-entry-label" popover="manual" role="tooltip">
                <span className={entry.website ? "guestbook-website-name" : undefined}>{entry.name}</span>{label.slice(entry.name.length)}
                {entry.website && <span className="guestbook-entry-url">{entry.website}</span>}
              </span>
            </Placed>;
          })}
          {!position && !popup && livePoint && <span className="guestbook-preview guestbook-live-preview"
            style={stickerStyle(liveSticker, livePoint.x, livePoint.y)} aria-hidden="true">
            <GuestbookSticker id={liveSticker} />
          </span>}
          {position && <span className="guestbook-preview"
            style={stickerStyle(stickerId, position.x, position.y)} aria-hidden="true">
            <GuestbookSticker id={stickerId} />
          </span>}
        </div>
        </div>
        <div className="guestbook-landscape-controls">
        <button type="button" className="guestbook-fullscreen" aria-label={expanded ? "Exit fullscreen" : "Fullscreen"} aria-pressed={expanded} onClick={() => void toggleFullscreen()}>
          {expanded ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m4 4 10 10M14 4 4 14" stroke="currentColor" strokeWidth="1.5" /></svg> : "Fullscreen"}
        </button>
          <span className="guestbook-count" aria-live="polite">{loaded ? entries.length : "—"} {entries.length === 1 ? "sticker" : "stickers"} placed</span>
        </div>
        <aside ref={picker} className="guestbook-picker" aria-label="Sticker collection" onContextMenu={event => event.preventDefault()}>
          <span className="guestbook-picker-title">sticker sheet</span>
          <div className="guestbook-sticker-options" onScroll={() => setPickerLabel(null)}>
            {visibleStickers.map((item) => (
              <button type="button" key={item.id} aria-label={item.label} aria-pressed={stickerId === item.id}
                aria-describedby={pickerLabel?.sticker === item.id ? id + "-sticker-tooltip" : undefined}
                onPointerEnter={event => { if (event.pointerType !== "touch") showPickerLabel(event.currentTarget, item.id, item.label); }}
                onPointerLeave={() => setPickerLabel(null)} onFocus={event => showPickerLabel(event.currentTarget, item.id, item.label)} onBlur={() => setPickerLabel(null)}
                onPointerDown={event => beginDrag(event, item.id)} onPointerMove={moveDrag} onPointerUp={endDrag}
                onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag}
                onClick={() => { if (skipPickerClick.current) { skipPickerClick.current = false; return; } selectSticker(item.id); }}>
                <GuestbookSticker id={item.id} />
              </button>
            ))}
          </div>
          {!expanded && <nav className="guestbook-pagination" aria-label="Sticker pages">
            <button type="button" aria-label="Previous sticker page" disabled={page === 0} onClick={() => setPage(current => Math.max(0, current - 1))}>‹</button>
            <span aria-live="polite">{page + 1} / {pageCount}</span>
            <button type="button" aria-label="Next sticker page" disabled={page + 1 >= pageCount} onClick={() => setPage(current => Math.min(pageCount - 1, current + 1))}>›</button>
          </nav>}
        </aside>
        <StickerHistory entries={entries} expanded={expanded} confirmWebsite={confirmWebsite} />
      </div>
      <span ref={pickerTooltip} id={id + "-sticker-tooltip"} role="tooltip" popover="manual" hidden={!pickerLabel} className="guestbook-picker-label">{pickerLabel?.text}</span>
      {dragging && !dragPoint && <span className="guestbook-drag-ghost" style={{ left: dragging.x, top: dragging.y }} aria-hidden="true">
        <GuestbookSticker id={dragging.sticker} />
      </span>}
      <p id={id + "-help"} className="data-note guestbook-status" role="status">{loadError || message}</p>
      <dialog ref={dialog} className="guestbook-dialog" aria-labelledby={id + "-dialog-title"}
        onCancel={(event) => { if (saving) event.preventDefault(); else { setPosition(null); setPopup(""); } }}>
        {popup ? <>
          <h3 id={id + "-dialog-title"}>Choose another spot</h3>
          <p role="alert">{popup}</p>
          <button type="button" className="guestbook-action" onClick={closeDialog} autoFocus>Okay</button>
        </> : <form onSubmit={save} autoComplete="off" data-1p-ignore="true" data-lpignore="true">
          <h3 id={id + "-dialog-title"}>Leave your sticker here?</h3>
          <p>This sticker will stay in the landscape for everyone.</p>
          <label htmlFor={id + "-name"}>Your name</label>
          <input id={id + "-name"} type="text" required aria-describedby={id + "-name-limit"} name="guestbook-display-name" autoComplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" value={name} disabled={saving} autoFocus
            onChange={(event) => { setName(Array.from(event.target.value).slice(0, guestbookNameLimit).join("")); requestId.current = null; }} />
          <p id={id + "-name-limit"} className="data-note">{Array.from(name).length}/{guestbookNameLimit} characters used</p>
          <label htmlFor={id + "-website"}>Your website <span className="guestbook-optional">(Optional)</span></label>
          <input id={id + "-website"} name="guestbook-website" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false}
            maxLength={guestbookWebsiteLimit} value={website} disabled={saving}
            onChange={event => { setWebsite(event.target.value); requestId.current = null; }} />
          <label htmlFor={id + "-message"}>Leave a message? <span className="guestbook-optional">(Optional)</span></label>
          <textarea id={id + "-message"} name="guestbook-message" rows={3} autoComplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" aria-describedby={id + "-message-limit"} value={visitorMessage} disabled={saving}
            onChange={event => { setVisitorMessage(Array.from(event.target.value).slice(0, guestbookMessageLimit).join("")); requestId.current = null; }} />
          <p id={id + "-message-limit"} className="data-note">{Array.from(visitorMessage).length}/{guestbookMessageLimit} characters used</p>
          {message && <p role="alert">{message}</p>}
          <div className="guestbook-dialog-actions">
            <button type="button" className="guestbook-action" disabled={saving} onClick={closeDialog}>Cancel</button>
            <button type="submit" className="guestbook-action" disabled={!name.trim() || !valid || !!occupied || saving}>{saving ? "Saving…" : "Place sticker"}</button>
          </div>
        </form>}
      </dialog>
      <dialog ref={websiteDialog} className="webring-confirmation" aria-labelledby={id + "-website-confirmation-title"}
        onClose={() => { setWebsiteDestination(null); websiteTrigger.current?.focus({ preventScroll: true }); }}>
        <h2 id={id + "-website-confirmation-title"}>Redirect to {websiteDestination?.name}’s site?</h2>
        <div className="webring-confirmation-actions">
          <button type="button" autoFocus onClick={() => websiteDialog.current?.close()}>No</button>
          <button type="button" onClick={() => {
            if (websiteDestination?.website) window.open(websiteDestination.website, "_blank", "noopener,noreferrer");
            websiteDialog.current?.close();
          }}>Yes</button>
        </div>
      </dialog>
    </section>
  );
}
