# Phase Plan

## Completed

- **Phase 7:** Search + Feedback (Pagefind, GitHub Issues) ✓
- **Phase 9:** Content model refactor + law sync + indices ✓
- **Phase 10:** Documentation (`/docs/`) ✓

## Phase 8: Edition logic + i18n

- Branch-based editions
- Full i18n (UI + content locale decoupling) ✓

## Phase 11: Print Pipeline + Polish

### 11a: Pandoc/LaTeX Print Pipeline (Content Repos)

Each book repo generates a print-ready PDF from the same `/content` files.

- `pandoc.yaml` in repo root: Pandoc config
- `pandoc/templates/`: LaTeX templates
- `pandoc/filters/`: Lua filters for LaTeX rendering
- `Makefile`: `make pdf` reads `toc.yaml` (SSOT), passes files to Pandoc
- `.github/workflows/build-pdf.yml`: TeX Live + Pandoc + yq → PDF artifact

**SSOT Principle:**

| Data | SSOT | Web uses | Print uses |
|---|---|---|---|
| File order | `toc.yaml` | Registry → Navigation | Makefile → Pandoc args |
| Metadata | `meta.yaml` | Registry → Rendering | Pandoc metadata |
| Bibliography | `references.yaml` | citeproc.ts | citeproc (Pandoc) |
| Content | `content/*.md` | GitHub API → Remark | Pandoc directly |

### 11b: Extend Online Pipeline

- `remark-index`: subject index from `{.idx}` spans
- `remark-glossary`: glossary from `{.gls}` + `::: glossary-entries`
- `citeproc.ts`: split bibliography / case law by `type`
- List of tables/figures from captions

### 11c: Polish

- Schema.org metadata
- Sitemap.xml + robots.txt
- RSS/Atom feed for journals
- Print stylesheet (`@media print`)
- Performance optimization
