# site.yaml

The `site.yaml` file is located in the project root and configures the site identity, branding, content sources, and optional features. This is the only file a deployer needs to edit to rebrand the platform.

## Schema

```yaml
# ─── Identity ───
name: "OpenLex"
default_locale: "de"
base_url: "https://openlex.example.com"

# ─── Branding ───
branding:
  tagline:
    de: "Open-Access-Plattform für juristische Fachliteratur"
    en: "Open-access platform for legal literature"
  brand_hue: 265                # oklch hue (0–360)
  footer:
    - text: "© OpenLex"
    - license
    - slug: impressum
      label: { de: "Impressum", en: "Imprint" }

# ─── Content ───
content_repos:
  - github://openlex-project/openlex-demo-commentary
  - github://openlex-project/openlex-demo-law
  # - gitlab://uni-berlin/kommentar-stgb
  # - gitlab://git.uni-berlin.de/group/project  # self-hosted

categories:
  - key: book
    label: { de: "Kommentare & Bücher", en: "Commentaries & Books" }
  - key: journal
    label: { de: "Zeitschriften", en: "Journals" }
  - key: law
    label: { de: "Gesetze", en: "Laws" }

# ─── Features (all optional — omit to disable) ───
features:
  sharing: [copy, email, x, linkedin, whatsapp]
  export:
    formats: [md, docx]
    require_auth: true
  related_content_display: badge    # badge | sidebar
  analytics:
    provider: vercel                # vercel | plausible | matomo | umami | goatcounter
  revalidate: false                 # seconds or false (deploy hooks)
```

## Root Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✓ | Site name (header, metadata) |
| `default_locale` | string | ✓ | Default locale (`de`, `en`, etc.) |
| `base_url` | string | | Production URL. Required for OG images, canonical URLs, hreflang tags. |
| `branding` | object | | Tagline, color hue, footer. See below. |
| `content_repos` | array | ✓ | Git repos. Format: `github://org/repo`, `gitlab://group/project`, `gitlab://host/group/project` |
| `categories` | array | | Content categories for homepage and listing pages |
| `features` | object | | Optional features. See below. |
| `template` | string | | Template: built-in (`default`, `academic`), GitHub (`org/repo[@ref]`), or local (`./templates/...`) |
| `home` | array | | Homepage section layout. See [templates.md](templates.md). |

## Branding

```yaml
branding:
  tagline:
    de: "Freie juristische Fachliteratur"
    en: "Free legal scholarship"
  brand_hue: 150
  footer:
    - text: "© JuraOpen"
    - license
```

| Field | Type | Description |
|---|---|---|
| `tagline` | object | Per-locale tagline (`{locale: text}`) |
| `brand_hue` | number | oklch color hue (0–360). Default: `265` (indigo). Drives the entire color palette. |
| `footer` | array | Footer items — flat list, displayed left to right, separated by `·` |

### Brand Hue

| Hue | Color |
|---|---|
| 0 | Red |
| 30 | Orange |
| 60 | Yellow |
| 120 | Green |
| 200 | Cyan |
| 265 | Indigo (default) |
| 300 | Purple |
| 340 | Pink |

### Footer

```yaml
footer:
  - text: "© 2026 OpenLex"
  - license
  - slug: impressum
    label: { de: "Impressum", en: "Imprint" }
  - href: "https://github.com/openlex-project/openlex"
    label: { de: "GitHub", en: "GitHub" }
```

| Key | Description |
|---|---|
| `text` | Plain text (e.g. copyright notice) |
| `license` | CC license badge (from current page's content license). No value needed. |
| `slug` | Local markdown page — renders `footer/{slug}.md` at `/{slug}` |
| `href` | External link, opens in a new tab |

`slug` and `href` items require a `label` object with per-locale display text.

## Features

All features are optional — omit the key to disable.

```yaml
features:
  sharing: [copy, email, x, linkedin, whatsapp]
  export:
    formats: [md, docx]
    require_auth: true
  related_content_display: badge
  analytics:
    provider: vercel
  revalidate: false
```

| Field | Type | Default | Description |
|---|---|---|---|
| `sharing` | string[] | | Social sharing targets. Order = dropdown order. Options: `copy`, `email`, `x`, `linkedin`, `whatsapp`. |
| `export` | object | | Export settings. `formats`: `md`, `docx`. `require_auth`: require login to export. |
| `related_content_display` | string | `badge` | How to show related content links on content pages: `badge` (compact card) or `sidebar` (right column). |
| `analytics` | object | | Analytics provider config. See below. |
| `revalidate` | number \| false | `3600` | ISR cache duration in seconds. `false` = deploy hooks only. |

### Analytics

```yaml
analytics:
  provider: vercel
```

| Provider | Extra fields | Description |
|---|---|---|
| `vercel` | — | Vercel Analytics + Speed Insights (dynamic import) |
| `plausible` | `domain` | Plausible Analytics (script tag) |
| `matomo` | `url`, `site_id` | Matomo (script tag) |
| `umami` | `url`, `site_id` | Umami (script tag) |
| `goatcounter` | `url` | GoatCounter (script tag) |

Examples:

```yaml
# Plausible
analytics:
  provider: plausible
  domain: "openlex.example.com"

# Matomo (self-hosted)
analytics:
  provider: matomo
  url: "https://matomo.uni-berlin.de"
  site_id: "3"

# Umami
analytics:
  provider: umami
  url: "https://umami.example.com"
  site_id: "abc-123"
```

## Categories

Categories control how content is grouped on the homepage and on `/category/[key]` listing pages.

```yaml
categories:
  - key: commentaries
    label: { de: "Kommentare", en: "Commentaries" }
  - key: textbooks
    label: { de: "Lehrbücher", en: "Textbooks" }
```

- `key` — matches the `category` value in content metadata
- `label` — per-locale display name
- Order in the array = order on the homepage
- Categories with zero items are hidden automatically
- If omitted, falls back to three default sections: books, journals, laws

## Notes

- `site.yaml` is committed to the repo — it's public configuration, not secrets.
- Secrets (PAT, OAuth, Redis) stay in `.env.local` / Vercel environment variables.
- The code-level fallback locale is `en`. The `default_locale` in `site.yaml` overrides it.
