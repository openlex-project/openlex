# OpenLex

Configurable open-access publishing platform for legal literature — commentaries, textbooks, journals, laws.

Content is authored in Pandoc-flavor Markdown, managed in private GitHub/GitLab repos, and rendered via a Next.js frontend.

**Live:** [openlex.vercel.app](https://openlex.vercel.app)

## Features

- Markdown-based content with margin numbers, footnotes, CSL citations
- Automatic bibliography (citeproc-js)
- Configurable numbering system
- Cross-links between laws and commentaries
- Bidirectional related content (any content type ↔ any content type)
- Social sharing (Copy, Email, X, LinkedIn, WhatsApp)
- Markdown + DOCX export
- Full-text search (Pagefind, client-side)
- Dark mode (system preference)
- Flexible OAuth login (GitHub, Google, Apple, Azure AD, GitLab, Keycloak, Okta, Auth0, Cognito, generic OIDC)
- Bookmarks, reading history, user profile with GDPR data export/deletion
- Feedback system (GitHub Issues)
- Branch-based editions
- i18n (de/en)
- OpenGraph social cards with dynamic OG images
- Configurable site identity, branding, footer, and content categories via `site.yaml`
- Configurable analytics (Vercel, Plausible, Matomo, Umami, GoatCounter)
- Template system: built-in, remote (GitHub), or local templates with CSS + component variants
- Data-driven homepage layout (hero, featured, categories, recent sections)
- Law sync from gesetze-im-internet.de (GII) and EUR-Lex

## Configuration

Edit `site.yaml` in the project root to rebrand the platform:

```yaml
name: "OpenLex"
default_locale: "de"

branding:
  tagline:
    de: "Open-Access-Plattform für juristische Fachliteratur"
    en: "Open-access platform for legal literature"
  brand_hue: 265
  footer:
    - text: "© OpenLex"
    - license:
    - slug: impressum
      label: { de: "Impressum", en: "Imprint" }

content_repos:
  - github://openlex-project/openlex-demo-commentary
  - github://openlex-project/openlex-demo-law
  # - gitlab://uni-berlin/kommentar-stgb

categories:
  - key: book
    label: { de: "Kommentare & Bücher", en: "Commentaries & Books" }
  - key: journal
    label: { de: "Zeitschriften", en: "Journals" }
  - key: law
    label: { de: "Gesetze", en: "Laws" }
```

See [site-yaml.md](docs/site-yaml.md) for full reference.

## Documentation

- [site.yaml](docs/site-yaml.md) – Site identity, branding, categories, footer
- [Templates](docs/templates.md) – Template system, CSS overrides, component variants
- [meta.yaml](docs/meta-yaml.md) – Metadata for books/journals
- [toc.yaml](docs/toc-yaml.md) – Table of contents (books)
- [sync.yaml](docs/sync-yaml.md) – Law configuration and sync
- [Content Guide](docs/content-guide.md) – Markdown syntax for authors
- [references.yaml](docs/references-yaml.md) – CSL references
- [Deployment](docs/deployment.md) – Vercel, env vars, setup

## Quickstart

```bash
pnpm install
pnpm dev
```

Content repos are configured in `site.yaml` under `content_repos` (GitHub and GitLab supported). For private repos, create `.env.local` with `GITHUB_PAT` and/or `GITLAB_PAT`. See [Deployment](docs/deployment.md).

## License

AGPL-3.0
