# Cat Break Reminder

A small macOS and Windows desktop app that reminds you to rest every 25 minutes.
When the timer ends, a full-screen overlay appears and an orange cat walks from the
screen edge toward the center, then lies down for the break.

## Features

- 25-minute default work timer
- Full-screen, always-on-top break overlay
- Transparent-background animated GIF orange cat
- 60fps average GIF timing using a 2cs/2cs/1cs frame-delay pattern
- Pause, resume, reset, and test reminder controls
- Configurable work interval and break duration
- Import your own walking and resting cat image/animation assets
- Optional launch-at-login
- Optional multi-display overlay
- Configurable close behavior: hide to background or quit
- In-app Hide and Quit controls
- Tray/menu-bar controls for background use

## Run Locally

```bash
npm install
npm start
```

## Build Installers

```bash
npm run dist
```

Outputs are written to `dist/`.

## Regenerate GIF Assets

```bash
npm run generate-assets
```

This writes:

- `src/assets/orange-cat-walk-60fps.gif`
- `src/assets/orange-cat-rest-60fps.gif`

GIF frame delays use centiseconds, so exact 16.67ms frame timing is not
representable. The generated GIFs alternate `20ms`, `20ms`, and `10ms` delays,
which averages to 60 frames per second over each loop.

## Custom Cat Assets

For the best material spec, see [docs/ASSET_GUIDE.md](docs/ASSET_GUIDE.md).

Open the app settings and choose separate files for:

- `Walking cat`: shown while the cat moves from the screen edge to the center
- `Resting cat`: shown after the cat reaches the center

Supported formats are GIF, APNG, WebP, PNG, JPG, JPEG, WebM, MP4, M4V, OGV,
and OGG. For the cleanest result, use transparent WebM/APNG/WebP/GIF material
with the cat animated in place.
The app copies selected files into its own app data folder, so the reminder keeps
working even if the original file is moved.

The break overlay follows the Cat Gatekeeper interaction pattern: the walking
material is displayed at `height: 100vh; width: auto`, slides in from the right
edge with `translateX(100vw) -> translateX(0)` over 3 seconds, then switches to
the resting material.

## Notes

- The app stays in the tray/menu bar when the main window is closed.
- Use `Quit` in the app, tray/menu bar, or application menu to fully stop it.
- Press `Esc` or click `Skip` to dismiss the break overlay early.
- Settings are stored in Electron's app data folder for the current OS user.
