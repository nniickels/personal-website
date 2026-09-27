import { useCallback, useEffect, useRef, useState } from "react";
import type { ImageAsset } from "./responsive-image";

// Resolve interaction-only components before rendering, without Suspense's reveal delay.
export function usePreloadedComponent<T>(load: () => Promise<{ default: T }>) {
  const [Component, setComponent] = useState<T | null>(null);
  const pending = useRef<Promise<boolean> | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const preload = useCallback(() => {
    pending.current ??= load().then(({ default: component }) => {
      if (mounted.current) setComponent(() => component);
      return true;
    }, (error: unknown) => {
      pending.current = null;
      console.error("Unable to load interactive content.", error);
      return false;
    });
    return pending.current;
  }, [load]);
  return [Component, preload] as const;
}

export function preloadImage(asset: ImageAsset, sizes: string) {
  const image = new Image();
  image.decoding = "async";
  image.sizes = sizes;
  image.srcset = asset.sources.map((source) => `${source.src} ${source.width}w`).join(", ");
  image.src = (asset.sources.find((source) => source.width >= 320) ?? asset.sources[asset.sources.length - 1]).src;
  void image.decode().catch(() => {}); // The visible image retains native loading/error behavior.
}
