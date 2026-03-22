# TODO

## Accessibility (WCAG 2.1 AA)

- [ ] Color contrast audit (tertiary text on light/dark surfaces)
- [x] Search results: keyboard navigation (arrow keys, Enter to select, Esc to close)
- [x] Search results: `role="listbox"` / `role="option"`, `aria-activedescendant`
- [x] Feedback modal: `role="dialog"`, `aria-modal`, focus trap, return focus on close
- [x] Sidebar: `aria-expanded` on toggle buttons
- [x] Footnote tooltips: keyboard accessible (focusable, Esc to dismiss)
- [x] Margin numbers (`<span class="rn">`): `aria-hidden="true"` (decorative)
- [x] Directives: add `role="note"` on containers
- [x] Search input: visible label or `aria-label` in current locale

## i18n — Hardcoded German Strings

- [x] SearchBox: "Suche… ⌘K", "Volltextsuche", "Suche…", "Keine Ergebnisse für"
- [x] UserButton: "Anmelden", "Abmelden"
- [x] FeedbackButton: "Feedback geben", "Fehler", "Ergänzung", "Frage", "Ihr Kommentar…", "Abbrechen", "Senden", "Gesendet"
- [x] JournalSidebar: "Sidebar schließen", "Sidebar öffnen", "Navigation öffnen"
- [x] Journal article page: "S." (page abbreviation)

## Features

- [ ] Law TOC/sidebar — parts/chapters from GII XML `<gliederungseinheit>`
- [ ] Historical law versions — `@{date}` resolution via Git tags
- [ ] Citation bar — dynamic CSL citation for current position
- [ ] Backmatter plugins — remark-index, remark-glossary, split bibliography
- [ ] Schema.org metadata — `Article`, `LegalCommentary`, `Legislation` types in `<head>`
- [ ] `<link rel="license">` in `<head>` per content page
- [ ] License badge component (visual CC badge etc.)

## Infrastructure

- [ ] GitHub webhook → on-demand ISR (replace 5-min polling)
- [ ] Dashboard — bookmarks, reading history (Vercel KV)
- [ ] Edition logic — branch-based editions (`/book/{work}/2ed/...`)

## Phase 11: PDF Export + Polish

- [ ] Pandoc-based PDF export pipeline
- [ ] Performance optimization (bundle size, image loading)
