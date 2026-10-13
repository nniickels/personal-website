# Places postcards

Places lives at `/side#favourite-places`, after Collections and before Gaming. It replaces the old Food gallery. The current stack has 11 entries; the counter, direct jumps, and wraparound navigation derive their total from the entries array.

## Edit or add a place

Edit `src/app/side-quests/place-postcards-data.ts`. Entries appear in array order, independently of photo filenames. Copy an existing entry to add a place, or remove its entire object to delete it; there are no numbered placeholder cards to maintain.

| Field | Purpose |
|-------|---------|
| `photo` | Original image path, such as `/postcard-photos/lucie.jpg`. The file lives under `public/postcard-photos/`. |
| `photoPosition` | CSS crop focal point, such as `53% 68%`. The first percentage is horizontal and the second vertical. |
| `alt` | Description of the photograph for assistive technology. |
| `title` | Place name on both sides. |
| `caption` | Short description beneath the photo. |
| `note` | Review on the back, followed by the “— nic” signature. |
| `order` | Standout recommendation displayed under “Don’t miss”; it need not list a complete order. |
| `address` | Street address on the first address line. |
| `country` | Country on the second address line. |
| `stamp` | Category from the table below. |

| Category | Stamp illustration | Stamp text |
|----------|--------------------|------------|
| `food` | Fork and spoon | good food |
| `nature` | Tree | outdoors |
| `tea` | Teacup | tea & treats |
| `bar` | Cocktail glass | cheers |
| `museum` | Exhibition building | exhibits |

The `museum` category also covers gardens and other exhibitions. Google Maps is linked in the section introduction, rather than on individual postcard backs; the site does not fetch Google Maps reviews.

## Photos and cropping

Keep high-resolution originals in `public/postcard-photos/`. Run `npm run privacy:strip-gallery-metadata` after adding JPEGs, then `npm run images:build`. Starting development or building production also runs image generation automatically. When replacing images during an active development session, run image generation explicitly so the manifest references the new files.

Cards use `object-fit: cover` with each entry's `photoPosition`. Start at `50% 50%`; increasing the vertical percentage shows a lower part of a tall photograph, and increasing the horizontal percentage shows further right in a wide photograph. Check both desktop and mobile: the mobile frame is taller, so it crops landscape photos differently. Focal points adjust the displayed crop without modifying the original image.

`scripts/build-images.mjs` creates metadata-free WebP candidates at widths of 160, 320, 480, 960, 1440, 1920, and the original width, without enlarging an image. Generated files live in `public/media/`, with the manifest in `src/generated/media/postcard-photos.json`. Both directories are ignored by Git and regenerated during builds. Commit the originals and source changes, rather than generated files. The old `public/food-photos/` assets are no longer used.

## Navigation and performance

The previous and next arrows cycle through the stack in either direction. “Turn over” reveals the review; “Photo side” returns to the front. Both use the same inline SVG arrow on every device, avoiding platform-dependent emoji rendering.

The counter normally displays plain text. Click or tap its current number to edit it; Enter or leaving the field jumps to a valid number, and Escape cancels. Invalid values leave the current card selected. Navigation and direct jumps return the selected card to its photo side.

Only the three visible layers and the previous card are mounted. Visible photos use native lazy loading; the previous photo is prepared for backward navigation. Responsive image sizes account for the extra scaling caused by mobile cover crops. Versioned WebP files retain the immutable cache headers in `public/_headers`. There are no autoplay timers or additional animation dependencies; shuffles use CSS transforms, and reduced motion removes the flip transition and shortens the shuffle.

## Source and checks

- `src/app/side-quests/place-postcards.tsx`: stack, flipping, and counter interactions.
- `src/app/side-quests/place-postcards-data.ts`: entries and crop focal points.
- `src/app/side-quests/postcard-stamp.tsx`: illustrated category stamps.
- `src/app/icons.tsx`: shared SVG turn arrow.
- `src/app/globals.css`: card layouts, animation, and mobile styling.
- `tests/performance.test.mjs`: bounded rendered stack and optimized image checks.
- `tests/browser/places-performance.spec.ts`: desktop/mobile media loading, navigation, flips, direct jumps, and reduced-motion wraparound.

Run `npm test` and `npm run typecheck` for build and source validation. After building, run `npx playwright test tests/browser/places-performance.spec.ts --project=desktop --project=mobile` for postcard interactions. See [local development](local-development.md) for browser installation and preview-server lifecycle rules.
