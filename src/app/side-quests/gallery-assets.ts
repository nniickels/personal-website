import photos from "../../generated/media/photos.json";
import postcards from "../../generated/media/postcard-photos.json";
import natural from "../../generated/media/natural-things.json";
import scrapbook from "../../generated/media/scrapbook.json";
import type { ImageAsset } from "../responsive-image";
export const imageAssets: Record<string, ImageAsset> = { ...photos, ...postcards, ...natural, ...scrapbook };
