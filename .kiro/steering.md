# Steering – OpenLex

## Project Context

OpenLex is an open-access platform for legal literature (commentaries, journals, laws). Content is authored in Markdown, versioned in private GitHub repos, and served via a Next.js frontend. Target audience: legal professionals, students, academics.

- **GitHub Organization:** [openlex-project](https://github.com/openlex-project)
- **Portal Name:** OpenLex (configurable via `site.yaml`)

## Tech Stack (Binding)

- **Framework:** Next.js 16 (App Router) with TypeScript
- **Hosting:** Vercel (Hobby tier, Serverless Functions, Edge)
- **Styling:** Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`)
- **Auth:** NextAuth.js — flexible OAuth (GitHub, Google, Apple, Azure AD, GitLab, Keycloak, Okta, Auth0, Cognito, generic OIDC)
- **Database:** Upstash Redis — user preferences, bookmarks, history, ETag cache
- **Content Source:** Private GitHub/GitLab repos via PAT (server-side only, never client-side)
- **Content Format:** Markdown (Pandoc flavor) + YAML metadata
- **Testing:** Vitest
- **Package Manager:** pnpm
- **Linting:** ESLint 10 (Flat Config), no Prettier
- **Search:** Pagefind (static, build-time index, zero infrastructure)
- **Monorepo:** No — single Next.js repo. Content repos are separate on GitHub.

## Architecture Rules

- Use App Router (no Pages Router).
- Server Components by default; Client Components only where interactivity is needed (citation bar, footnote drawer, feedback).
- Route Groups: `(auth)` for login/callback, `(reader)` for reading UI — separate layouts per group.
- GitHub PAT must only be used in server-side logic (API Routes, Server Actions).
- All external data fetches are server-side; no token leakage to the client.
- Caching strategy: ISR / On-Demand Revalidation on content updates (GitHub Webhook → Vercel).

## Code Conventions

- Language in code: **English** (variables, functions, comments) — always, even when the user writes in German.
- Language in UI text: configurable via `site.yaml` `default_locale` (default: `de`), English via i18n.
- Language in documentation (`/docs/`): **English**.
- Language in commit messages: **English**.
- File names: kebab-case (`citation-bar.tsx`, `footnote-drawer.tsx`).
- Internal links: always `<Link>` from `next/link` (SPA navigation). Use `<a>` only for external links (`target="_blank"`) and anchor links (`#id`).
- Components: PascalCase (`CitationBar`, `FootnoteDrawer`).
- No `any` types; strict TypeScript configuration.
- Imports: path aliases with `@/` for `src/`.

## Deployment Conventions

- `main` = Production (auto-deploy on Vercel)
- Feature branches: `feat/description`, bugfixes: `fix/description`
- Commit messages: Conventional Commits (`feat:`, `fix:`, `docs:`)
- AI may `git commit` freely but must NOT `git push` without explicit user consent. This applies to ALL repos in the openlex-project organization, not just the main repo.
- **Vercel CLI** is installed locally for deployment status, logs, and env management.
- **GitHub CLI (`gh`)** is installed locally for repo management, secrets, and Actions.
- Env vars (secrets only — everything else in `site.yaml`):
  - `GITHUB_PAT` — GitHub Personal Access Token (content repos)
  - `GITLAB_PAT` — GitLab Personal Access Token (optional, for GitLab repos)
  - `NEXTAUTH_SECRET` — NextAuth.js session secret
  - `REDIS_REST_URL` — Upstash Redis REST URL
  - `REDIS_REST_TOKEN` — Upstash Redis REST token
  - `OAUTH_{n}_PROVIDER`, `OAUTH_{n}_ID`, `OAUTH_{n}_SECRET` — OAuth providers (n=1,2,...)
- Local development: all secrets in `.env.local` (gitignored via `.env*` pattern)
- `content_repos` belongs in `site.yaml`, NOT in env vars

## Site Configuration

- `site.yaml` in the project root configures site identity, branding, default locale, and content categories.
- See `docs/site-yaml.md` for full reference.

## Content Repo Discovery

- The portal is open source; configuration is done via `site.yaml` in the repo + env vars for secrets on Vercel.
- `content_repos` in `site.yaml` lists repos with explicit protocol prefix: `github://org/repo` or `gitlab://group/project`.
- Each content repo describes itself via a `meta.yaml` (slug, type, title, etc.).
- At `next build`, the app fetches `meta.yaml` from each repo and builds an internal registry. Repos are the single source of truth.
- Registry is cached in-memory (5min TTL) and GitHub API responses are cached via ETags in Redis (persists across deploys, conditional requests don't consume rate limit).

## Markdown Pipeline (Web Rendering)

- **Libraries:** unified / remark / rehype (industry standard for JS-based Markdown → HTML processing)
- Pandoc is NOT used for web rendering — only for PDF export.

## URL Schema

- Books/commentaries: `/book/{work}/{slug}` (current), `/book/{work}/{n}ed/{slug}` (explicit edition)
- Slug = filename without `.md` from `toc.yaml` (e.g., `art-5`, `vorbem-1-4`, `einleitung`)
- Editions map to Git branches: `main` = current edition, `{n}ed` = archived edition.
- Edition of `main` is derived: count of `*ed` branches + 1. No `edition` field in `meta.yaml`.
- Workflow: New edition → branch current `main` as `{n}ed` (freeze), continue on `main`.
- Access to `/{n}ed/` without existing branch → redirect to current edition.
- Laws: `/law/{law}/{nr}` (current), `/law/{law}/@{date}/{nr}` (historical version)
- Journals: `/journal/{journal}/{year}/{issue}/{slug}` (article), `/journal/{journal}/{year}/{page}` (citation redirect)
- Journal structure is derived from the filesystem (no `toc.yaml`): years → issues → articles with metadata in `issue.yaml`
- `unit_type` only for laws (in `sync.yaml`): `article` (Art.) or `section` (§)
- Fragments for sub-structure: `#rn-1` (commentaries), `#abs-1`, `#abs-1-s-1`, `#abs-1-lit-a` (laws)

Examples:
```
/law/dsgvo/5#abs-1
/book/oc-dsgvo/art-5#rn-3
/book/oc-urhg/art-15#rn-7
/book/schmieder-urheberrecht/kap-3
/journal/zfkir/2025/01/mustermann-ki       # Article (canonical)
/journal/zfkir/2025/42                      # Citation redirect → article
```

## Laws

- All laws in a single repo (`openlex-laws`); commentaries remain in separate repos.
- Curated selection: which laws are synced is defined in `sync.yaml`.
- Sources: GII (XML) for German federal law, EUR-Lex (API) for EU law.
- Automatic sync job commits changes to the repo.
- Versioning via Git tags: on law amendment, tag as `law/urhg/2024-11-15`. The web app resolves `@{date}` to the most recent tag before the requested date and fetches the file at that ref via GitHub API.

### Sync Job (GitHub Actions)

- Weekly cron via GitHub Actions in the `openlex-laws` repo.
- `sync.yaml` controls which laws are synced from which source.
- **GII (German federal law):** Fetch XML from `gesetze-im-internet.de/{slug}/xml.zip`. Parse amendment date from `<standangabe>` → `<standkommentar>`.
- **EUR-Lex (EU law):** API call with CELEX number, fetch consolidated version.
- XML/HTML → Markdown conversion via Python scripts (`scripts/sync_gii.py`, `scripts/sync_eurlex.py`).
- Diff against existing files. On changes: commit + Git tag (`sync-YYYY-MM-DD`).
- Error handling: on unreachability, silent retry on next run.

### Repo Structure

```
openlex-laws/
  sync.yaml              # Central config: laws, sources, metadata
  requirements.txt       # Python dependencies
  scripts/
    sync_gii.py          # German federal law sync
    sync_eurlex.py       # EU law sync
  .github/workflows/
    sync.yml             # Weekly cron + manual dispatch
  dsgvo/
    1.md ... 99.md
  bgb/
    1.md ... 2493.md
  stgb/
    1.md ... 518.md
```

`sync.yaml` contains all metadata per law (slug, source, title, title_short, unit_type, license, category). No separate `meta.yaml` per law — the sync job generates the directory structure from `sync.yaml`.

### Law Files
- Pure Markdown without frontmatter — just the legal text.
- All metadata is derived: number from filename, title from `sync.yaml`, prefix (§/Art.) from `unit_type`.

## Content Format (Pandoc Markdown)

Content is authored in Pandoc-flavor Markdown. The parser must support the following constructs.

## File Structure (Content Repos)

- Each file starts with a `#` heading (top level). Files are assembled in filename order.
- `#` = file level, `##`–`#####` = structure within (auto-numbered).

### Filename Schemas

| Type | Schema | Examples |
|---|---|---|
| Commentary | `{nr}.md` or `{nr}-XX.md` | `5.md`, `312d.md`, `312d-01.md` |
| Textbook | `XX-YY.md` | `10-01.md`, `30-05.md` |
| Chapter title | `XX-00.md` | `10-00.md` |
| Review questions | `XX-review.md` | `10-review.md` |
| Preface, notes | `00-preface.md`, `01-notes.md` | |
| Indices | `99-indices.md` | |
| Subject index | `99-index.md` | |
| Glossary | `99-glossary.md` | |

### Unnumbered / Unlisted

- `{.unnumbered}` — no auto-numbering, but visible in TOC (e.g., bibliography, subject index).
- `{.unnumbered .unlisted}` — no number, not in TOC (special cases only).

### Auto-Generated Indices

- **Bibliography** — from citeproc, in TOC.
- **Case law index** — from references of type `legal_case`, in TOC.
- **Subject index** — from `[]{.idx}` entries, in TOC.
- **List of figures/tables** — from captions, in TOC.
- **Glossary** — definition lists in `::: glossary` div.

### Heading Anchors & Cross-References
- `## Heading {#anchor-id}` — stable IDs for headings
- `[Link text](#anchor-id){.xref}` — internal cross-references

### Author Attribution
- `::: author` / `:::` — marks the author of a section with name and ORCID.
- Applies to all headings below until a new `::: author` block sets a different author (inheritance).
```markdown
::: author
name: Fabian Schmieder
orcid: 0000-0000-0000-0000
:::
```

### Footnotes & Citations
- `^[Footnote text]` — inline footnotes
- `@citation_key` — Pandoc citeproc references (e.g., `@Hoeren_Pinelli_KIR_2026_5, 7.`)
- Bibliography in YAML format, CSL for citation style

### Index Entries
- `[]{.idx entry="Term"}` — index entry
- `[]{.idx entry="Parent!Child"}` — nested index entry

### Custom Divs (Fenced Divs)
- Pandoc Fenced Divs (`::: name` / `:::`) are supported as a generic feature.
- **Web rendering:** Each content repo provides a `divs.yaml` mapping div names to base components + variant. No custom CSS per repo — styling is centralized.
- **PDF export:** Repos provide their own Lua filters for the Pandoc pipeline.

#### Base Components for Divs

| Component | Variants | Purpose |
|---|---|---|
| `Callout` | `note`, `warning`, `review`, `law` | Highlighted content boxes |

Example `divs.yaml` in content repo:
```yaml
note:
  component: "Callout"
  variant: "note"
law:
  component: "Callout"
  variant: "law"
review:
  component: "Callout"
  variant: "review"
```

New variants are added centrally as needed.

### Margin Numbers
- Explicit start markers with auto-numbering.
- `[]{.rn}` at the beginning of a paragraph marks the start of a new margin number.
- Everything until the next `[]{.rn}` marker belongs to the same Rn. (including subsequent paragraphs, lists, tables).
- Numbering is automatic and sequential per article/paragraph — no manual numbers.
- Each Rn. gets a stable, deterministic ID as anchor link (`#rn-1`, `#rn-2`, ...).

## Citation Bar

- CSL-based: each content repo provides a CSL file (e.g., `jura.csl`) for the citation style.
- The citation bar dynamically generates the correct citation for the current position (author, work, article, Rn.).
- Same CSL logic as in footnotes, applied to the current position.

## Accessibility

- WCAG 2.2 AA as minimum standard.
- Semantic HTML, ARIA attributes, keyboard navigation, sufficient contrast.
- Accessible dropdown menus via shared `useDropdownMenu` hook (role=menu, Escape, arrow keys, focus management).
- Minimum target size 24×24px for interactive elements.

## Internationalization (i18n)

- Multilingual from the start. Default locale configurable via `site.yaml`.
- UI strings in `src/lib/i18n/` with one file per locale (`de.ts`, `en.ts`).
- Code-level fallback locale: `en`.
- Translations live in the same repo. Root `content/` = default language (from `meta.yaml` `lang`). Translations in `content/{locale}/` subfolders.
- `meta.yaml` lists available languages: `lang: "de"`, `translations: ["en"]`.
- URL prefix for translations: `/en/oc-dsgvo/art-5`, `/fr/dsgvo/5`.
- No prefix = default locale (canonical URL). `/de/...` → redirect to `/...`.

## KV Data Model (Vercel KV)

| Key | Type | Description |
|---|---|---|
| `user:settings:[ID]` | JSON | Privacy options (history duration, status) |
| `user:bookmarks:[ID]` | Hash | Bookmarks with paths and titles |
| `user:history:[ID]` | List | Visited URLs with timestamps (pruning logic) |
| `etag:gh:*` | JSON | GitHub API ETag cache (persists across deploys) |

## Versions

- **Next.js:** 16
- **Node.js:** 22 LTS

## Content Repo Schema

### Book Repo (Commentaries, Textbooks)

```
oc-dsgvo/
  meta.yaml              # Required: self-description
  toc.yaml               # Required: table of contents (SSOT for order)
  jura.csl               # Required: citation style
  references.yaml        # Required: bibliography
  pandoc.yaml            # Pandoc config (template, filters, engine)
  divs.yaml              # Optional: custom div mapping
  Makefile               # make pdf
  pandoc/
    templates/
      openlex-book.tex
      openlex.sty
    filters/
      rn.lua             # Margin numbers
      directives.lua     # Fenced Divs → LaTeX
      xref.lua           # Cross-references
      index.lua          # Subject index
      glossary.lua       # Glossary
      split-bib.lua      # Bibliography / case law split
      table.lua          # Tables
      nbsp.lua           # Non-breaking spaces
    fonts/
      DeGruyterSans-*.otf
      DeGruyterSerif-*.otf
  content/
    preface.md
    art-5.md
    ...
  .github/workflows/
    build-pdf.yml
```

Textbook variant:
```
schmieder-urheberrecht/
  meta.yaml
  jura.csl
  references.yaml
  content/
    00-preface.md
    10-00.md             # Chapter title
    10-01.md             # Section
    10-review.md
    99-indices.md
    99-index.md
    ...
```

`meta.yaml` (required fields):
```yaml
slug: "oc-dsgvo"
type: "book"                    # book | journal
title: "OpenCommentary DSGVO"
title_short: "OC-DSGVO"        # Optional: short title for citations
category: "commentaries"        # Optional: homepage category (defaults to type)
isbn: "978-3-11-123456-7"      # Optional: ISBN
doi: "10.1515/9783111234567"    # Optional: DOI
lang: "de"
license: "CC-BY-SA-4.0"
numbering: "commentary"         # commentary | textbook | decimal | none
csl: "jura.csl"
bibliography: "references.yaml"
comments_on: "dsgvo"            # Optional: slug of the commented law
translations: ["en"]            # Optional: available translations
editors:
  - name: "Max Mustermann"
    orcid: "0000-0000-0000-0000"
backmatter:                     # Optional: auto-generated indices
  bibliography: split           # split | merged | false
  index: auto                   # true | false | auto
  glossary: auto
  list-of-tables: auto
  list-of-figures: auto
```

`toc.yaml` (table of contents):
```yaml
contents:
  - file: preface.md
    title: Preface
  - file: vorbem-1-4.md
    title: "Preliminary remarks on Art. 1–4"
    provisions: [1, 2, 3, 4]
  - file: art-5.md
    title: "Art. 5 – Principles"
    provisions: [5]
```

### Law Collection Repo

```
openlex-laws/
  sync.yaml              # Central config: laws, sources, metadata
  requirements.txt
  scripts/
    sync_gii.py
    sync_eurlex.py
  .github/workflows/
    sync.yml
  dsgvo/
    1.md ... 99.md
  bgb/
    1.md ... 2493.md
```

### Journal Repo

```
zfkir/
  meta.yaml              # type: "journal", doi_prefix, issn
  jura.csl               # Optional: citation style
  references.yaml        # Optional: bibliography
  2026/
    01/                  # Issue 1
      issue.yaml          # Article list with metadata
      mustermann-ki.md   # Pure Markdown, no frontmatter
      schmidt-algorithmen.md
```

**No `toc.yaml`, no frontmatter** — metadata in per-issue `issue.yaml`:
```yaml
articles:
  - file: mustermann-ki-haftung.md
    title: "Liability for AI-generated content"
    authors:
      - name: "Prof. Dr. Max Mustermann"
        orcid: "0000-0001-2345-6789"
    section: "Essays"
    pages: "1-12"
    numbering: "commentary"
```

- `authors`: array with name + optional ORCID
- `section`: groups articles in the issue table of contents
- `pages`: enables citation redirect: `/journal/zfkir/2026/42` → article containing page 42
- `numbering`: per article (commentary, textbook, decimal, none)
- `doi_prefix` in journal meta.yaml → article DOI: `{prefix}.{year}.{firstPage}`

## Domain Glossary

| German Term | Meaning | English in Code |
|---|---|---|
| Randnummer (Rn.) | Smallest citable unit of a commentary | `marginNumber` / `mn` |
| Fundstelle | Exact citation reference (author, work, §, Rn.) | `citation` |
| Kommentar | Legal commentary on a statute | `commentary` |
| Auflage | Edition of a work | `edition` |
| Gesetzesstand | Temporal version of a statute | `legalVersion` |

## Directory Structure (Target)

```
src/
  app/
    (auth)/          # Login, callback routes
    (reader)/        # Reading UI: commentaries, articles, laws
      category/      # Category listing pages
    api/             # API routes (feedback → GitHub Issues, KV access)
    dashboard/       # Bookmarks, history
  components/
    citation-bar.tsx
    footnote-drawer.tsx
    margin-number.tsx
    license-context.tsx
  lib/
    github.ts        # GitHub API client (server-side)
    markdown.ts      # Pandoc Markdown → HTML pipeline
    registry.ts      # Content registry (books, journals, laws)
    site.ts          # Site config loader (site.yaml)
    i18n/            # Per-locale translation files
      index.ts
      de.ts
      en.ts
    kv.ts            # Vercel KV helpers
    auth.ts          # NextAuth configuration
```

## Key Invariants

1. **Stable URLs:** Once assigned, slugs for paragraphs/articles never change.
2. **Stable margin number IDs:** Each Rn. gets a deterministic ID serving as anchor link.
3. **Citability:** Each Rn. must be able to produce a machine-readable, correct citation at any time.
4. **Privacy by default:** History is opt-in configurable; deletion is immediately effective.
5. **GDPR compliance:** Minimal data storage; no tracking beyond KV data.

## Numbering (Book Repos)

- `toc.yaml` is auto-generated from Markdown headings at `next build`.
- Headings are auto-numbered. Authors write no numbers — only the title.
- Default numbering schema (legal):
  - `##` → A., B., C., ...
  - `###` → I., II., III., ...
  - `####` → 1., 2., 3., ...
  - `#####` → a), b), c), ...
- Schema can be overridden per work via `meta.yaml`: `numbering: "commentary"`.
- Manual numbering via Pandoc attribute: `## Special Section {number="X."}` overrides auto-numbering for that heading.
- Reset behavior per level configurable in `meta.yaml`:

```yaml
numbering: "textbook"
numbering_reset:
  "##": false     # Chapters are NOT reset on new part (#)
  "###": true     # Sections reset on new chapter (##) (default)
  "####": true
  "#####": true
```

- Default: each level resets on new parent (`true`). `false` = continuous across parents.

### Numbering Format

Each level is defined via a format string controlling label, counter type, and brackets/dots:

```yaml
numbering_format:
  "#":     "Part {1}:"     # → Part 1:, Part 2:
  "##":    "§ {1}"          # → § 1, § 2
  "###":   "{A}."           # → A., B., C.
  "####":  "{I}."           # → I., II., III.
  "#####": "{1}."           # → 1., 2., 3.
```

Available counter types:
- `{1}` → 1, 2, 3, ... (arabic)
- `{A}` → A, B, C, ... (uppercase)
- `{a}` → a, b, c, ... (lowercase)
- `{I}` → I, II, III, ... (roman uppercase)
- `{i}` → i, ii, iii, ... (roman lowercase)

Arbitrary text and brackets around the counter:
- `"({a})"` → (a), (b), (c)
- `"{A})"` → A), B), C)
- `"Part {1}:"` → Part 1:, Part 2:
- `"{1}."` → 1., 2., 3.

Predefined schemas:

| Schema | `##` | `###` | `####` | `#####` |
|---|---|---|---|---|
| `commentary` (default) | A., B. | I., II. | 1., 2. | a), b) |
| `textbook` | § 1, § 2 | A., B. | I., II. | 1., 2. |
| `decimal` | 1., 2. | 1.1, 1.2 | 1.1.1 | 1.1.1.1 |
| `none` | no numbering ||||

- `#` is reserved for the top-level structure (part / article commentary).
- Used for sidebar navigation, breadcrumbs, and table of contents.

## Search

- Full-text search across all content (laws, commentaries, books, journals).
- Faceted search: filter by work, type (commentary/law).
- Technology: Pagefind (static, build-time index, client-side, zero infrastructure).
- Indexing script (`scripts/build-search-index.ts`) runs before `next build`.
- Search index is regenerated on every build.
- Search is available to non-logged-in users.

## Landing Page

- No login required to read — all content is publicly accessible.
- Homepage shows:
  - Prominent search bar (full-text across entire catalog)
  - Category cards (16:9) linking to `/category/[key]` listing pages
  - Categories defined in `site.yaml`, items grouped by `category` field in metadata

## License

- Default license: CC-BY-SA-4.0 (configurable per work via `meta.yaml` `license` field, per law via `sync.yaml`).
- Footer shows the license of the currently viewed content (via React context).
- Each page carries the license of its respective work.

## Law ↔ Commentary Cross-Links

- Automatic detection: when a commentary (e.g., `oc-dsgvo`) and a law (e.g., `dsgvo`) share the same slug reference, they are linked.
- On law pages (`/law/dsgvo/5`): link to available commentaries (`/book/oc-dsgvo/5`).
- On commentary pages (`/book/oc-dsgvo/5`): link to the commented legal text (`/law/dsgvo/5`).
- Mapping via `comments_on` field in the book repo's `meta.yaml`:
  ```yaml
  comments_on: "dsgvo"    # Slug of the commented law
  ```

## Feedback System

- User must be logged in (no anonymous feedback).
- User selects text → feedback form with:
  - Selected text (automatic)
  - Citation: URL + Rn./paragraph (automatic)
  - Category: error, suggestion, question
  - Free-text comment
- API route creates GitHub Issue in the private content repo via PAT.
- Automatic labels: `feedback`, article/paragraph (`art-5`, `s-15`), Rn. (`rn-42`), category.
- User attribution via hidden identifier in issue body: `<!-- openlex-user: {user-id} -->`.
- **Dashboard integration:** Own feedback issues shown in profile (status: open/closed/commented). Server-side query via PAT, filtered to own issues.
- **Feedback channel:** Author comments and status changes on the issue are visible in the user's dashboard.

## Workflow Notes

- Content updates: author pushes to GitHub → webhook triggers revalidation on Vercel.
- Feedback: user selects text → API route creates GitHub Issue in content repo.
- History pruning: on page visit, expired entries are removed from `user:history`.

## What Kiro Must NOT Do

- No password/email-based auth.
- No direct database connection (SQL/Postgres) — only Vercel KV.
- No Pages Router.
- No client-side GitHub API calls.
- No `tailwind.config.js` (Tailwind v4 uses CSS-first config).
- No monorepo setup (Turborepo etc.).

## Phase Plan (from Phase 7)

- **Phase 7:** Search + Feedback (Pagefind, GitHub Issues) ✓
- **Phase 8:** Edition logic + i18n
- **Phase 9:** Content model refactor + law sync + indices ✓
  - `toc.yaml` for commentaries (preliminary remarks, excursions, flexible structure)
  - `provisions[]` mapping for cross-links law → commentary
  - `meta.yaml` cleanup: `abbreviation` removed, `title_short` added, `unit_type` only for laws
  - URL change: `/book/[work]/[slug]` instead of `/book/[work]/[nr]`
  - Law sync via GitHub Actions (GII XML + EUR-Lex API)
  - Auto-generated indices
- **Phase 10:** Documentation (`/docs/`) ✓
- **Phase 11:** PDF export + polish

### Phase 11: Print Pipeline + Polish

#### 11a: Pandoc/LaTeX Print Pipeline (Content Repos)

Each book repo generates a print-ready PDF from the same `/content` files.

**Architecture:**
- `pandoc.yaml` in repo root: Pandoc config (template, filters, engine) — no `input-files`
- `pandoc/templates/`: `openlex-book.tex` + `openlex.sty`
- `pandoc/filters/`: Lua filters for LaTeX rendering
- `pandoc/fonts/`: De Gruyter Sans/Serif (OFL-licensed, in repo)
- `Makefile`: `make pdf` reads `toc.yaml` (SSOT), passes files to Pandoc
- `.github/workflows/build-pdf.yml`: TeX Live + Pandoc + yq → `make pdf` → PDF artifact

**Lua Filter Inventory:**

| Filter | Base | Adaptation |
|---|---|---|
| `rn.lua` | `randnummern.lua` | Detects `[]{.rn}` spans instead of every paragraph |
| `directives.lua` | `latex-div.lua` | `::: note` → legal text box, `::: author` → author block |
| `table.lua` | `dgruyter-table.lua` | Renamed, De Gruyter references removed |
| `xref.lua` | 1:1 | Cross-references with `\ref` + `\pageref` |
| `index.lua` | 1:1 | `[Text]{.idx}` → `\index{}` |
| `glossary.lua` | 1:1 | Glossary entries + `[Term]{.gls}` |
| `split-bib.lua` | 1:1 | Bibliography / case law split |
| `nbsp.lua` | 1:1 | Non-breaking spaces (§~2, Rn.~14) |

**SSOT Principle:**

| Data | SSOT | Web uses | Print uses |
|---|---|---|---|
| File order | `toc.yaml` | Registry → Navigation | Makefile → Pandoc args |
| Metadata | `meta.yaml` | Registry → Rendering | Pandoc metadata |
| Bibliography | `references.yaml` | citeproc.ts | citeproc (Pandoc) |
| Citation style | `jura.csl` | citeproc.ts | citeproc (Pandoc) |
| Content | `content/*.md` | GitHub API → Remark | Pandoc directly |

**Backmatter** (controlled via `meta.yaml` → `backmatter`):
- Bibliography / case law index, subject index, glossary, list of tables/figures
- Auto-generated in both pipelines when entries exist
- `auto` = only generate when entries actually exist

#### 11b: Extend Online Pipeline

New Remark plugins for backmatter features:
- `remark-index`: collects `{.idx}` spans → subject index section
- `remark-glossary`: collects `{.gls}` + `::: {.glossary-entries}` → glossary section
- `citeproc.ts` extension: split bibliography / case law by `type`
- List of tables/figures from captions

#### 11c: Polish
- WCAG 2.1 AA accessibility audit
- Schema.org metadata
- License badge
- Performance optimization
