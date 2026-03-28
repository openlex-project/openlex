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
- **Linting:** Biome (Rust-based, lint + format)
- **Git Hooks:** Husky — pre-commit (biome lint + tsc), pre-push (next build)
- **Search:** Pagefind (static, build-time index, zero infrastructure)
- **Monorepo:** No — single Next.js repo. Content repos are separate on GitHub.
- **Versions:** Next.js 16, Node.js 22 LTS

## Code Quality

- **Enterprise code, no hacks, no workarounds.**
- Biome linting with recommended rules. Fix violations in code, never disable rules to make the linter pass.
- Only disable a rule if it is genuinely inapplicable to the codebase (e.g., `noDangerouslySetInnerHtml` for intentional Markdown rendering). Every disabled rule requires a comment explaining why.
- Husky enforces quality gates: pre-commit runs `biome lint` + `tsc --noEmit`, pre-push runs `next build`. No code reaches the remote that doesn't pass all checks.
- When the linter reports errors, fix the code. Do not whack-a-mole rules to "off" or "warn".
- When changing code or configuration, check if documentation needs updating (`/docs/`, `README.md`, steering). Docs must stay in sync with the implementation.

## Code Conventions

- Language in code: **English** (variables, functions, comments) — always, even when the user writes in German.
- Language in UI text: configurable via `site.yaml` `default_locale` (default: `de`), English via i18n.
- Language in documentation (`/docs/`): **English**.
- Language in commit messages: **English**.
- i18n in YAML: All user-facing string fields accept either a plain string (shorthand for `default_locale`) or a locale object (`{ de: "...", en: "..." }`). Use `normalizeI18n()` at parse time, `resolveI18n()` / `resolveDisplay()` at render time. Helper: `lib/i18n-utils.ts`. Note: `openlex-lawsync` has an identical copy — keep both in sync.
- File names: kebab-case (`citation-bar.tsx`, `footnote-drawer.tsx`).
- Internal links: always `<Link>` from `next/link` (SPA navigation). Use `<a>` only for external links (`target="_blank"`) and anchor links (`#id`).
- Components: PascalCase (`CitationBar`, `FootnoteDrawer`).
- No `any` types; strict TypeScript configuration.
- Imports: path aliases with `@/` for `src/`.

## Deployment Conventions

- `main` = Production (auto-deploy on Vercel)
- Feature branches: `feat/description`, bugfixes: `fix/description`
- Commit messages: Conventional Commits (`feat:`, `fix:`, `docs:`)
- AI may `git commit` freely but must NOT `git push` without explicit user consent. This applies to ALL repos in the openlex-project organization.
- **Vercel CLI** and **GitHub CLI (`gh`)** installed locally.
- Env vars (secrets only — everything else in `site.yaml`):
  - `GITHUB_PAT`, `GITLAB_PAT`, `NEXTAUTH_SECRET`, `REDIS_REST_URL`, `REDIS_REST_TOKEN`
  - `OAUTH_{n}_PROVIDER`, `OAUTH_{n}_ID`, `OAUTH_{n}_SECRET`
- Local development: all secrets in `.env.local` (gitignored)
- `content_repos` belongs in `site.yaml`, NOT in env vars

## What Kiro Must NOT Do

- No password/email-based auth.
- No direct database connection (SQL/Postgres) — only Vercel KV.
- No Pages Router.
- No client-side GitHub API calls.
- No `tailwind.config.js` (Tailwind v4 uses CSS-first config).
- No monorepo setup (Turborepo etc.).

## Related Files

- [Architecture](./architecture.md) — App Router, Registry, Caching, KV Model
- [Content Format](./content-format.md) — Markdown, Numbering, Margin Numbers, Citations
- [URL Schema](./url-schema.md) — URL patterns, Editions, Fragments
- [Content Repos](./content-repos.md) — Repo schemas, meta.yaml, toc.yaml, sync.yaml
- [Phase Plan](./phase-plan.md) — Phases 7–11, Print Pipeline
