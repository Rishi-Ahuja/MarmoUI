# MarmoUI

A modern skin for the University of Waterloo's [Marmoset](https://marmoset.student.cs.uwaterloo.ca) submission server, packaged as a Chrome (MV3) extension.

> Unofficial tool — not affiliated with the University of Waterloo. Inspired by the original [MarmoUI](https://github.com/lishid/MarmoUI) userscript by Shida Li and Erica Xu; this is an independent rewrite.

## Features

- **Two UIs** — the redesigned UI (default) and **Legacy** (the original MarmoUI 2.0 look running on the same fixed engine). Switch from the top bar, or the selector in Legacy.
- **Three themes** — light, dark (VS Code Dark+ inspired), and vintage (classic MarmoUI). Applied before first paint, remembered across visits.
- **Due-date countdowns** — every deadline shows "Due in …" with urgent (<24 h) highlighting, DST-aware in campus time (America/Toronto).
- **Inline results on the course page** — last submission score, secret/private test totals, and release-token count per project, loaded in the background with polite request limits.
- **Streamlined submissions** — submit from a popup on the course page (or the classic submit page) with clear success/error feedback. No page can submit anything without your click.
- **Sortable tables** — click (or keyboard-activate) any column header; numeric, date, and text columns all sort correctly.
- **Quality of life** — tidied login/course/details pages, release-test confirmation, archive links as a table.

## Install (Load unpacked)

1. Download or `git clone` this repository.
2. Open `chrome://extensions` (or `brave://extensions`).
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.
5. Visit Marmoset — the new UI applies automatically.

Works on any Chromium ≥ 111 browser (Chrome, Brave, Edge).

## Architecture

No build step — the manifest loads plain files in dependency order. Each script is an IIFE attaching one module to the shared `globalThis.MarmoUI` namespace.

| File | Responsibility |
| --- | --- |
| `manifest.json` | MV3 manifest; injects `styles.css` + `src/early-theme.js` at `document_start`, everything else at `document_end` |
| `styles.css` | All styling; themes are `mui-theme-*` classes on `<html>`; every var/class is `mui-`prefixed |
| `src/early-theme.js` | Stamps the saved theme pre-paint (no theme flash) |
| `src/constants.js` | Shared config — endpoints, timing, retry policy |
| `src/utils.js` | DOM builder, logging, `safe()` error isolation, concurrency limiter, `fetchDoc()` with timeout/retry/backoff |
| `src/dates.js` | Marmoset date parsing (year inference, America/Toronto DST handling), due-in formatting. DOM-free → unit-testable |
| `src/theme.js` | Theme get/set + persistence |
| `src/tables.js` | Scoped, stable, typed column sorting + row highlighting |
| `src/submit.js` | Submission popup and `fetch(FormData)` submit flow |
| `src/loaders.js` | Per-row data pipeline (one view fetch + one detail fetch feed all three columns) |
| `src/pages.js` | Page detection + per-page enhancers |
| `src/mode.js` | UI switch (new / legacy) |
| `legacy/legacy-css.js` | The original MarmoUI 2.0 stylesheet, verbatim from GitHub |
| `legacy/legacy.js` | Legacy-mode pipeline: OG look on the fixed engine |
| `src/main.js` | Bootstrap + mode dispatch |

## License

[MIT](LICENSE) © Rishi Ahuja
