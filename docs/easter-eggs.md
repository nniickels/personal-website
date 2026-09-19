# Astronomy Easter eggs

The two effects share the site shell and are available through `NightSky` on Main Quest, Side Quests, and Playground, subject to the device and motion rules below. They do not require an API, account, or additional asset downloads.

## Overview

| Feature | Trigger | Behavior |
|---------|---------|----------|
| Shooting-star wish | Click or tap within the invisible 96×96-pixel target around a visible shooting star. | Pauses the star for 1.6 seconds and shows “Make a wish ✧” for 3.2 seconds. |
| Meteor shower | Leave a supported desktop page idle for 10 seconds in dark mode. | Adds 12 foreground and 18 background meteors, dims the page content, and displays “Meteor shower!” at the bottom. Activity ends the shower. |

The meteor shower is disabled at widths of 700px or less, on devices without hover, or with a coarse primary pointer. The calligraphy logo is a standard home link with immediate navigation on every device. Moving meteors are disabled when reduced motion is requested.

## Source map

- `src/app/sky-easter-eggs.tsx`: effects, timers, device checks, meteor configurations.
- `src/app/night-sky.tsx`: seeded background stars, regular shooting-star data, and integration with the Easter egg effects.
- `src/app/site-header.tsx`: standard home link with immediate navigation.
- `src/app/portfolio.tsx` and `src/app/playground/page.tsx`: shared sky and header placement on the three routes.
- `src/app/globals.css`: click targets, glow and trail styling, layering, dimming, and animations.
- `src/app/playground/playground.css`: route-specific touchscreen starfield adjustments.
- `tests/rendered-html.test.mjs`: existing rendering and source/style checks; these do not exercise real browser interactions.

## Shooting-star wish

Each regular shooting star has an invisible 96×96-pixel button centered around its visible head. Foreground shower meteors use the same target. Distant meteors are decorative and do not intercept input.

Clicking or tapping a target pauses its motion for 1,600 ms and displays “Make a wish ✧” for 3,200 ms. Repeated clicks reset those timers. During a shower, wish messages sit above the “Meteor shower!” pill so they do not overlap it.

Targets are hidden during the invisible portion of each flight. Keyboard focus pauses a visible target; it may remain paused while keyboard focus remains on it. Light mode and reduced-motion settings hide moving stars and their targets. Regular shooting stars are also hidden in the touchscreen Playground.

## Idle meteor shower

`IDLE_DELAY` is 10,000 ms. The timer is eligible only while the document is visible, dark mode is active, reduced motion is off, and the device is supported. Playground disclosures do not affect sky eligibility or pause the background stars.

Pointer movement, pointer presses, keyboard activity, scrolling, wheel events, and touch movement reset inactivity. Input directly on a shooting-star target is exempt so it can receive a click. Visibility, theme, relevant root-class, reduced-motion, and mobile-query changes reset the shower. Becoming eligible again starts a fresh idle period.

While active, the shower repeats these staggered sequences; the counts are configured elements, not a promise that all meteors are visible simultaneously:

| Layer | Count | Head thickness | Configured trail length | Cycle duration |
|-------|-------|----------------|-------------------------|----------------|
| Foreground | 12 | 4–6px | 260–415px | 5.3–8.22 seconds |
| Background | 18 | 2–3px | 120–224px | 5.8–9.79 seconds |

Trail length is capped at 55vmin. Both layers use angles from 132° to 138°. Heads are elongated, and their light and tapered trails grow and fade during the first 22% of each cycle; the remainder is invisible. Start positions, delays, distances, and cycle durations vary to avoid a synchronized stream.

### Layers and dimming

- The ordinary sky and distant meteors sit at `z-index: 0`, behind reading content.
- Main content uses `z-index: 1`; the fixed header and footer use `20`.
- During a shower, main content and bars transition to opacity `0.34`, allowing the background meteors to show through.
- A noninteractive dark overlay at `z-index: 85` fades to opacity `0.18`.
- The foreground sky rises from `z-index: 5` to `90` during the shower. The shower and wish messages are in this layer.

“Meteor shower!” is visible at the bottom for the duration of the active shower. Ending the shower removes both meteor layers and the message, and restores normal content brightness.

## Mobile and accessibility rules

`MOBILE_QUERY` is `(max-width: 700px), (hover: none), (pointer: coarse)`. Any matching condition disables the shower. This includes narrow desktop windows and typical touch tablets as well as phones; it is a capability/layout check rather than user-agent detection.

JavaScript guards prevent activation and respond to media-query changes. Matching CSS rules also hide the shower's foreground and background meteors, dimmer, and message. Keep the JavaScript and CSS queries synchronized.

The ordinary background stars and eligible shooting-star wishes are separate from this desktop-only rule. Reduced-motion rules hide moving meteors, and status messages use `role="status"`. Timers, observers, and listeners are cleaned up when their components unmount.

The starfield uses smooth CSS easing without `steps()` frame-rate overrides. Light mode pauses background-star animation, and reduced motion disables twinkling. Across all pages, devices matching `(hover: none), (pointer: coarse)` animate only eight background stars; the other visible stars remain static. Viewports wider than 520px show 96 stars, while widths up to 520px show 64 smaller stars, including the eight that can animate. In the touchscreen Playground, twinkle durations are 2.4 times longer and regular shooting stars are hidden. These decorative adjustments are independent of experiment playback, which pauses outside its viewport margin or in a hidden tab.

## Known limitation

Moving the cursor toward an idle-shower meteor ends the shower before it can usually be caught. Only events already targeting the shooting-star button bypass the activity reset. Moving away from a caught shower meteor can also remove its wish message early. Ordinary shooting-star wishes are independent of the idle state.

## Verification

Run `npm test` for the production build, rendered-page checks, and image/cache performance checks. Run `npm run typecheck` for a separate TypeScript check; it also generates the image manifests required by a fresh checkout.

After building and installing the browsers with `npx playwright install chromium webkit`, run `npm run test:browser` for desktop and mobile regression checks, including WebKit layout checks. These cover theme controls, navigation, galleries, experiment lifecycle, and the absence of disclosure-triggered sky pausing. They stub external services and analytics. They do not automate the timed meteor shower or wish sequences below.

Passing these checks does not establish browser visual or interaction correctness. A browser release check should cover:

1. Desktop dark mode: no shower before 10 seconds, then layered meteors, dimming, and the bottom message; activity restores the page.
2. Ordinary star: click or tap within the enlarged target, confirm the pause, wish message, and resumed flight.
3. Logo: clicking or tapping navigates home immediately through the native link, including modified clicks for opening a new tab.
4. Mobile, narrow windows, and touch input: no shower; logo navigation is immediate. Resize during an active effect to confirm dismissal.
5. Light mode, reduced motion, and background tabs: no inappropriate moving or lingering effects; returning to an eligible desktop state requires a fresh idle period.
6. All three routes: page links, Playground controls, and gallery dialogs still behave normally around the effects.
