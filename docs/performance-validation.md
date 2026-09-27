# Rendering performance validation

The rendering changes remove delayed gallery/simulation setup and reduce repeated animation, React, and drawing work. They retain the scientific models, controls, seeded star geometry, responsive layouts, and reduced-motion behavior. No runtime dependency was added.

## What changed

- Render galleries and simulations in the initial HTML; load viewer code on intent and preload the selected image on activation.
- Reuse cached SVG star artwork and native animation effects; preserve animation phase through theme, visibility, and responsive changes.
- Update simulation drawings without rendering the full React tree each frame. Preserve elapsed-time playback, pending pointer samples, and ownership of an active drag.
- Move Stellar's small decorative glow to a worker with the original CSS animation as fallback.
- Use native section scrolling, share identical generated images, and cache fingerprinted assets. Correct compressed analytics responses in the local Node preview.

## Regression checks

Run `npm test`, `npm run typecheck`, and `npm run test:browser` with Node 24. The [Validate workflow](../.github/workflows/validate.yml) runs these on Ubuntu with Chromium and WebKit. Browser checks use one worker, mock external services, and retain traces on failure; they require no deployment secrets and do not deploy the site.

Coverage includes model values and geometry, playback clocks, high-refresh scheduling, theme and reduced-motion transitions, offscreen pause/resume, worker fallback and cleanup, native sliders and drag cancellation, secondary-touch ownership, gallery loading and focus, and responsive overflow.

Local verification on September 27, 2026: production build, TypeScript, all 23 Node checks, and 89 Chromium browser checks passed. Eleven browser cases were intentionally skipped because they apply to a different device profile. Three independent source reviews found no actionable regression in the changed rendering, simulation, or interaction paths.

The local macOS WebKit runtime times out creating a blank page before any application code runs. The same failure occurs in an isolated test without a site server. Linux CI supplies an independent WebKit regression check; its result should be checked on the PR before merging.

## Measured improvements and limits

Earlier matched local production comparisons found approximately 80% less graphics-thread work during Main-page scroll captures, gallery/viewer decoded readiness around 13–17 ms instead of 311–318 ms, and 69–79% less playback JavaScript for Black Hole and Stellar. These are specific workloads measured on one Mac; they are not whole-page speed multipliers, physical-phone measurements, or universal frame-rate guarantees.

Small rasterization differences remain possible with cached SVG artwork, composited transforms, and the glow's canvas backing. Native section scrolling intentionally uses browser-controlled easing. Resize measurements had mixed phone CPU results. The intermittent first-use graphics stall was not reliably reproduced or proven fixed; the long blank-text interval did not recur in the final local scroll trials, but still needs confirmation on the affected device.

The merge checks establish rendering and interaction regressions within their tested scenarios. They do not establish that every reported hitch is gone. If a hitch recurs, capture the affected device, viewport, theme, and exact action before changing another rendering path.
