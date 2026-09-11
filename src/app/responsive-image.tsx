import type { ImgHTMLAttributes } from "react";

export type ImageAsset = {
  width: number;
  height: number;
  sources: readonly { src: string; width: number }[];
};

export function ResponsiveImage({ asset, expanded = false, sizes, ...props }:
  Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & { asset: ImageAsset; expanded?: boolean }) {
  const candidates = expanded ? asset.sources : asset.sources.filter((source) => source.width <= 480);
  const sources = candidates.length ? candidates : asset.sources;
  const fallback = sources.find((source) => source.width >= 320) ?? sources[sources.length - 1];
  return <img {...props} src={fallback.src}
    srcSet={sources.map((source) => `${source.src} ${source.width}w`).join(", ")}
    sizes={sizes} width={asset.width} height={asset.height} decoding="async" />;
}
