"use client";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

const ImageGallery = lazy(() => import("./image-gallery"));

export function DeferredGallery(props: {
  photos: readonly { src: string; alt: string }[];
  ariaLabel: string;
  desktopColumns?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const details = host.current?.closest("details");
    if (!details) { setOpened(true); return; }
    const activate = () => { if (details.open) setOpened(true); };
    activate();
    details.addEventListener("toggle", activate);
    return () => details.removeEventListener("toggle", activate);
  }, []);
  return <div ref={host}>
    {opened && <Suspense fallback={<p role="status">Loading photos…</p>}>
      <ImageGallery {...props} />
    </Suspense>}
  </div>;
}
