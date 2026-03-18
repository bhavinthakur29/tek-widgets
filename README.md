# TekSquad Utility Hub

A small, single-page “shell” that dynamically loads utility widgets (clock, calendar, etc.) into the main content area.

## Features

- **Single shell layout**: `index.html` contains the header, navigation, settings panel, and footer.
- **Widget routing via fetch**: widget pages in `pages/*.html` are loaded into `#page-root`.
- **Category navigation**:
  - Desktop: category labels show flyout menus on hover/focus
  - Mobile: off-canvas navigation drawer
- **Settings panel**: theme selection panel with overlay.
- **Theme persistence**: selected theme is saved in `localStorage`.
- **Stable layout**: header and footer stay anchored while the widget area scrolls (widget size changes won’t shift the shell).
- **Calendar notes**: date notes are stored in `localStorage` (calendar widget).

## Widgets

- **Analog Clock**
- **World Clock**
- **Stopwatch**
- **Countdown**
- **Event Calendar**

## Project structure

- `index.html`: app shell and UI containers
- `pages/clock.html`: clock widget partial
- `pages/worldclock.html`: world clock widget partial
- `pages/stopwatch.html`: stopwatch widget partial
- `pages/countdown.html`: countdown widget partial
- `pages/calender.html`: calendar widget partial (note the filename spelling)
- `style.css`: shared styling (themes + layout + widgets)
- `script.js`: page loader, widget initializers, navigation + settings behavior

## Run locally

Because widgets are loaded with `fetch()`, you need a local server:

- **VS Code / Cursor Live Server**: open `index.html` and “Go Live”
- **Any static server**: serve the folder and open the served `index.html`

Opening via `file://` will block `fetch()` in most browsers.

## Credits

- **TekSquad**: `https://github.com/bhavinthakur29`
