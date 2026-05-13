# Architecture

Cat Break Reminder is a small Electron app with three layers.

## Main Process

`src/main.js` and `src/main/`

- owns app lifecycle, tray/menu bar, IPC, and Electron windows
- creates the normal settings window and the full-screen transparent break window
- stores settings and active usage state on disk

Main helpers:

- `src/main/cat-assets.js`: validates, copies, and exposes imported cat media
- `src/main/usage-store.js`: saves and restores active usage seconds with stale-entry handling

## Core Modules

`src/core/`

- `active-usage-clock.js`: counts active computer usage toward the 25-minute break threshold
- `settings.js`: clamps settings, validates imported asset paths, and classifies media as image/video
- `constants.js`: shared defaults and supported file extensions
- `gif.js`: parses GIF frame timing for asset validation tests

These modules do not depend on Electron and are covered by Node unit tests.

## Renderer

`src/renderer.js` and `src/styles.css`

- renders the settings UI
- renders the transparent break overlay
- displays the walking material first
- switches to resting material after the walking video ends, or after 3 seconds for image/GIF material

The overlay follows the Cat Gatekeeper pattern: the walking media is shown at
`height: 100vh; width: auto` and moved from `translateX(100vw)` to
`translateX(0)`.

## Validation

Use:

```bash
npm run verify
```

This regenerates default GIF assets, runs syntax checks, and runs unit tests.
