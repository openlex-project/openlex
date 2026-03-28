# Architecture

## App Structure

- Use App Router (no Pages Router).
- Server Components by default; Client Components only where interactivity is needed.
- Route Groups: `(auth)` for login/callback, `(reader)` for reading UI — separate layouts per group.
- GitHub PAT must only be used in server-side logic (API Routes, Server Actions).
- All external data fetches are server-side; no token leakage to the client.
- Caching strategy: ISR / On-Demand Revalidation on content updates (GitHub Webhook → Vercel).

## Site Configuration

- `site.yaml` in the project root configures site identity, branding, default locale, and content categories.
- See `docs/site-yaml.md` for full reference.

## Content Repo Discovery

- `content_repos` in `site.yaml` lists repos with explicit protocol prefix: `github://org/repo` or `gitlab://group/project`.
- Each content repo describes itself via a `meta.yaml` (slug, type, title, etc.).
- At `next build`, the app fetches `meta.yaml` from each repo and builds an internal registry. Repos are the single source of truth.
- Registry is cached in-memory (5min TTL) and GitHub API responses are cached via ETags in Redis (persists across deploys, conditional requests don't consume rate limit).

## Markdown Pipeline (Web Rendering)

- **Libraries:** unified / remark / rehype (industry standard for JS-based Markdown → HTML processing)
- Pandoc is NOT used for web rendering — only for PDF export.

## Internationalization (i18n)

- Multilingual from the start. Default locale configurable via `site.yaml`.
- UI strings in `src/lib/i18n/` with one file per locale (`de.ts`, `en.ts`).
- Code-level fallback locale: always `en`. `default_locale` in `site.yaml` defaults to `en` if not set.
- Translations live in the same repo. Root `content/` = default language. Translations in `content/{locale}/` subfolders.
- URL prefix for translations: `/en/oc-dsgvo/art-5`, `/fr/dsgvo/5`. No prefix = default locale.

## KV Data Model (Upstash Redis)

| Key | Type | Description |
|---|---|---|
| `user:settings:[ID]` | JSON | Privacy options (history duration, status) |
| `user:bookmarks:[ID]` | Hash | Bookmarks with paths and titles |
| `user:history:[ID]` | List | Visited URLs with timestamps (pruning logic) |
| `etag:gh:*` | JSON | GitHub API ETag cache (persists across deploys) |

## Search

- Full-text search across all content (laws, commentaries, books, journals).
- Faceted search: filter by work, type (commentary/law).
- Technology: Pagefind (static, build-time index, client-side, zero infrastructure).
- Search is available to non-logged-in users.

## Accessibility

- WCAG 2.2 AA as minimum standard.
- Semantic HTML, ARIA attributes, keyboard navigation, sufficient contrast.
- Accessible dropdown menus via shared `useDropdownMenu` hook.
- Minimum target size 24×24px for interactive elements.

## Feedback System

- User must be logged in. API route creates GitHub Issue in the content repo via PAT.
- Automatic labels: `feedback`, article/paragraph, Rn., category.
- User attribution via GDPR-safe hash in issue body.
- Dashboard integration: own feedback issues shown in profile.

## Law ↔ Commentary Cross-Links

- Mapping via `comments_on` field in the book repo's `meta.yaml`.
- Bidirectional: law pages link to commentaries, commentary pages link to laws.
- `provisions[]` in `toc.yaml` maps commentary entries to law articles.

## Key Invariants

1. **Stable URLs:** Once assigned, slugs never change.
2. **Stable margin number IDs:** Each Rn. gets a deterministic anchor ID.
3. **Citability:** Each Rn. must produce a correct citation at any time.
4. **Privacy by default:** History is opt-in; deletion is immediately effective.
5. **GDPR compliance:** Minimal data storage; no tracking beyond KV data.

## Directory Structure

```
src/
  app/
    (auth)/          # Login, callback routes
    (reader)/        # Reading UI: commentaries, articles, laws
      category/      # Category listing pages
    api/             # API routes (feedback, export, health)
  components/        # Shared UI components
  lib/
    github.ts        # GitHub API client (server-side)
    markdown.ts      # Markdown → HTML pipeline
    registry.ts      # Content registry (books, journals, laws)
    site.ts          # Site config loader (site.yaml)
    i18n-utils.ts    # normalizeI18n, resolveI18n, resolveDisplay
    i18n/            # Per-locale translation files
    redis.ts         # Redis with graceful degradation
    auth.ts          # NextAuth configuration
```
