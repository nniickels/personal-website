# Astronomy Easter eggs

The three effects share the site shell and are available through `NightSky` and `SiteHeader` on Main Quest, Side Quests, and Playground, subject to the device and motion rules below. They do not require an API, account, or additional asset downloads.

## Source map

- `src/app/sky-easter-eggs.tsx`: effects, timers, device checks, meteor configurations, and logo click handling.
- `src/app/portfolio.tsx`: regular shooting-star data and integration with the sky and header.
- `src/app/globals.css`: click targets, glow and trail styling, layering, dimming, and animations.
- `tests/rendered-html.test.mjs`: existing rendering and source/style checks; these do not exercise real browser interactions.

## Shooting-star wish

Each regular shooting star has an invisible 96×96-pixel button centered around its visible head. Foreground shower meteors use the same target. Distant meteors are decorative and do not intercept input.

Clicking or tapping a target pauses its motion for 1,600 ms and displays “Make a wish ✧” for 3,200 ms. Repeated clicks reset those timers. During a shower, wish messages sit above the “Meteor shower!” pill so they do not overlap it.

Targets are hidden during the invisible portion of each flight. Keyboard focus pauses a visible target; it may remain paused while keyboard focus remains on it. Light mode and reduced-motion settings hide moving stars and their targets. Regular shooting stars are also hidden in the touchscreen Playground.

## Idle meteor shower

`IDLE_DELAY` is 10,000 ms. The timer is eligible only while the document is visible, dark mode is active, reduced motion is off, the device is supported, and a touchscreen Playground disclosure is not open.

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

## Calligraphy constellation

On supported desktop devices, five quick logo clicks dispatch `nicole:constellation`. The reveal spells “N” with four-point stars and the caption “A little constellation for Nicole.”

- Normal desktop home navigation waits 300 ms after the most recent click. Each additional click cancels and restarts that navigation timer.
- The click count resets when the gap reaches 1,500 ms. Away from Main Quest, clicks must arrive before the 300 ms navigation timer fires to keep the sequence on the same page.
- The fifth click cancels navigation and resets the count for another sequence.
- Counts are held in component refs and do not survive navigation or reload. No session-storage click tracking is used.
- Mobile and modified clicks retain native link behavior without the delay.

The reveal lasts 4,000 ms. Each trigger increments `constellationRun`, giving the figure a new React key and restarting its CSS animation. The dismissal timer also restarts. Keep the JavaScript timeout and the `constellation-reveal` CSS duration aligned when changing this duration.

Unlike the meteors, the constellation can appear in light mode. With reduced motion enabled, it is a static reveal. Changing to a mobile configuration dismisses it.

## Mobile and accessibility rules

`MOBILE_QUERY` is `(max-width: 700px), (hover: none), (pointer: coarse)`. Any matching condition disables both the shower and constellation. This includes narrow desktop windows and typical touch tablets as well as phones; it is a capability/layout check rather than user-agent detection.

JavaScript guards prevent activation and respond to media-query changes. Matching CSS rules also hide the shower's foreground and background meteors, dimmer, message, and constellation. Keep the JavaScript and CSS queries synchronized.

The ordinary background stars and eligible shooting-star wishes are separate from this desktop-only rule. Reduced-motion rules hide moving meteors, and status messages use `role="status"`. Timers, observers, and listeners are cleaned up when their components unmount.

## Known limitation

Moving the cursor toward an idle-shower meteor ends the shower before it can usually be caught. Only events already targeting the shooting-star button bypass the activity reset. Moving away from a caught shower meteor can also remove its wish message early. Ordinary shooting-star wishes are independent of the idle state.

## Verification

Run `npm test` for the production build and existing rendered-page checks. Run `npx tsc --noEmit --incremental false` for a separate TypeScript check.

Passing these checks does not establish browser visual or interaction correctness. A browser release check should cover:

1. Desktop dark mode: no shower before 10 seconds, then layered meteors, dimming, and the bottom message; activity restores the page.
2. Ordinary star: click or tap within the enlarged target, confirm the pause, wish message, and resumed flight.
3. Logo: one click navigates after 300 ms; five rapid clicks reveal the constellation; another five restart its full four-second animation.
4. Mobile, narrow windows, and touch input: no shower or constellation; logo navigation is immediate. Resize during an active effect to confirm dismissal.
5. Light mode, reduced motion, and background tabs: no inappropriate moving or lingering effects; returning to an eligible desktop state requires a fresh idle period.
6. All three routes: page links, Playground controls, and gallery dialogs still behave normally around the effects.
