# Desktop and mobile differences

Layout responds to viewport dimensions, while touch-specific behavior responds to pointer and hover capabilities. The phone copy and compact navigation apply at widths up to 520px; the Playground accordion uses the separate rules below.

## Wide and compact layouts

| Feature | Wide layout | Compact layout |
|---------|-----------|----------|
| Layout and navigation | Uses wider gutters, larger type and media, and full page-link labels. | Uses compact gutters, smaller type and media, and shortened “Main”, “Side”, and “Play” navigation labels at phone widths. |
| Main Quest copy | Shows the full introduction, project descriptions, and service descriptions. | Uses a shorter introduction and hides project and service descriptions at phone widths. |
| Side Quests section index | Spreads section and subsection links across the available width. | Fits the complete index within the narrow viewport using more compact labels and spacing. |
| Side Quests copy and rankings | Shows full introductory and interest paragraphs and expanded listening rankings. | Uses a shorter introduction and interest lists; Watching and Gaming lists use two columns. Top Tracks stays expanded, while artist and album rankings use disclosures. The Food introduction is hidden, and the two gaming widgets remain side by side. |
| Side Quests lifecycle | Galleries initialize on first disclosure opening; viewers load on demand. | Same lifecycle, with smaller responsive image candidates selected for the displayed size and screen density. |
| Photo galleries | Displays wider multi-column mosaics and larger lightboxes. | Uses narrower responsive gallery columns and controls while preserving image aspect ratios. |
| Playground workspaces | Uses side-by-side experiment visuals and controls when the viewport is wide enough. | In the accordion layout, settings appear before the scene and action buttons after it. The black-hole chart follows its actions; the stellar timeline appears before its playback actions. |
| Playground explanations and results | Shows chart captions and model notes alongside the full explanations. | In the accordion layout, hides the black-hole chart caption and standalone model notes, includes concise model summaries inside Explanation, and arranges result cards in three columns. |
| Playground lifecycle | All four experiment slots remain available; each experiment loads shortly before entering view. Offscreen motion pauses. | A single-open accordion initializes only requested experiments. React Activity retains visited experiments’ state while hiding their DOM and stopping effects. Rotation preserves settings and the selected panel. |

## Cursor and touchscreen

| Feature | Cursor | Touchscreen |
|---------|--------|-------------|
| Links and controls | Hover and focus states brighten, underline, or raise interactive elements before selection. | Controls use touch-sized targets and activate without depending on hover. |
| Idle meteor shower | Available above 700px with hover and a fine primary pointer. | Disabled; the logo navigates home immediately. |
| Shooting-star wishes | Click a visible star to pause it and display a wish message. | Tap the single occasional shooting star on any page, including Playground (24-second cycle). |
| Listening music shelf | Hovering a cover starts its looping preview. Clicking expands it, and clicking the expanded cover opens Spotify. | Holding a cover starts its preview. Dragging across covers switches tracks and smoothly scrolls near the shelf edges. Tapping expands it, and tapping the expanded cover opens Spotify. |
| Pokémon card shelf | Hovering identifies a card. Clicking expands it, and clicking the expanded card opens TCG Collector. | Tapping expands a card, and tapping the expanded card opens TCG Collector. Arrow navigation keeps the selected card visible for both input methods. |
| Photo galleries | Clicking a thumbnail opens the lightbox, with hover feedback available beforehand. | Tapping a thumbnail opens the same lightbox viewer. |
| Playground experiments | Click-and-drag controls rotate or reposition experiment objects. | Touch-drag uses the same direct manipulation without requiring hover. |
| Playground playback rate | Autonomous JavaScript playback updates up to 60 times per second, backing off to 30 for Save-Data or observed frame delays. Playback pauses outside the experiment section's visibility margin or in a hidden tab. | The same playback policy. Direct dragging follows display frames; touch capability alone does not reduce the playback rate. |
| Playground decorative motion | Uses the experiment section's visibility to pause decorative animation. | Also pauses decorative CSS animations when the visual itself leaves the viewport. Reading nearby controls does not reset state or independently stop simulation playback. |
| Black Hole experiment | Includes the Variables Guide, all variable sliders, growth playback, the draggable mass-growth plot, presets, results, and 3D rotation. | Includes the same complete feature set in the mobile accordion. |
| Black Hole rendering | Retains mass-dependent layout dimensions and nine decorative animations. | Scales fixed-size geometry with transforms. Two rotating disk textures provide motion; the six orbiting streaks are hidden and the photon ring stays static. Spin direction and near-zero-spin pausing remain supported. |
| Playground loading feedback | A loading indicator appears while an experiment chunk is loading. | The same contextual indicator replaces the permanent desktop recommendation. |
| Playground disclosures | Explanation and Variables Guide reveal immediately with matching arrow animation; Advanced Settings retains animated expansion. | Black Hole defers Variables Guide and Advanced Settings content until open; its Explanation and Variables Guide are mutually exclusive. Accordion layouts disable Advanced Settings expansion transitions. The 16 animated background stars continue while reading, with twinkle durations 1.8 times longer in Playground; one shooting star appears on a 24-second cycle. |

The Playground accordion applies at widths up to 700px in portrait, or heights up to 520px in landscape with a coarse pointer. Other viewports use the full experiment layout, including larger portrait tablets. Touch-specific controls and starfield adjustments separately use `(hover: none), (pointer: coarse)`; these checks do not impose a blanket playback-rate reduction.
