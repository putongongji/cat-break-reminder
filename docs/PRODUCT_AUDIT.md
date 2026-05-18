# Product Audit

## Fixed In This Pass

- Added a normal app menu with Show, Hide, Pause/Resume, Reset, Test Reminder, and Quit.
- Added explicit in-app Hide and Quit buttons so users do not need to hunt for the tray/menu bar item.
- Added a `Closing window keeps timer running` setting. When disabled, closing the window quits the app.
- Added a `Start in background` setting for users who want a menu-bar/tray-only workflow.
- Kept tray/menu-bar controls for background usage.
- Clarified single-instance startup logs so `npm start` does not look broken when another instance is already running.

## Still Missing For A Polished Public Release

- A real app icon instead of Electron's default icon.
- macOS code signing and notarization.
- Windows installer smoke test on an actual Windows machine.
- Auto-update flow.
- First-run onboarding for importing cat media.
- A user-visible media preview before testing the full-screen reminder.
- Keyboard shortcut preferences.

## Interaction Standard

The app should always provide two clear paths:

- Background path: close or hide the window, keep the timer running from tray/menu bar.
- Exit path: click Quit in the app window, tray/menu, or application menu.
