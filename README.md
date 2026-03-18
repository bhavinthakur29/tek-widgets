# TekSquad Utility Hub

Dynamic single-shell app by TekSquad.

## Features

- One shell loader in `index.html`
- Category-based navbar dropdowns for `Clock`, `World Clock`, `Calendar`, `Countdown`, and `Stopwatch`
- Shared styling from one `style.css`
- Theme switching and persistence
- Calendar date notes saved in `localStorage`
- Settings drawer with working theme controls

## Structure

- `index.html`: app shell + page switcher
- `pages/clock.html`: clock page partial
- `pages/calender.html`: calendar page partial
- `pages/countdown.html`: countdown widget partial
- `pages/stopwatch.html`: stopwatch widget partial
- `pages/worldclock.html`: world clock widget partial
- `style.css`: shared styles for all pages
- `script.js`: dynamic loader + page initializers

## Run

Use a local server (Live Server or Netlify preview).  
Direct file:// open will block dynamic fetch loading.

## Credits

TekSquad
https://github.com/bhavinthakur29
