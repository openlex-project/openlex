# site.yaml

The `site.yaml` file is located in the project root and configures the site identity, branding, and content categories. This is the only file a deployer needs to edit to rebrand the platform.

## Schema

```yaml
name: "OpenLex"
tagline:
  de: "Open-Access-Plattform für juristische Fachliteratur"
  en: "Open-access platform for legal literature"
default_locale: "de"
brand_hue: 265
logo_text: true
template: default

content_repos:
  - openlex-project/oc-dsgvo
  - openlex-project/openlex-laws

footer:
  - text: "© OpenLex"
  - license: true
  - slug: impressum
    label: { de: "Impressum", en: "Imprint" }
  - slug: datenschutz
    label: { de: "Datenschutz", en: "Privacy Policy" }

categories:
  - key: book
    label: { de: "Kommentare & Bücher", en: "Commentaries & Books" }
  - key: journal
    label: { de: "Zeitschriften", en: "Journals" }
  - key: law
    label: { de: "Gesetze", en: "Laws" }

home:
  - type: hero
  - type: categories
```

## Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✓ | Site name (header, metadata) |
| `tagline` | object | ✓ | Per-locale tagline (`{locale: text}`) |
| `default_locale` | string | ✓ | Default locale (`de`, `en`, etc.) |
| `brand_hue` | number | ✓ | oklch color hue (0–360) — drives the entire color palette |
| `content_repos` | array | ✓ | GitHub repos containing content (`org/repo`). Books, journals, and laws are auto-detected from `meta.yaml` / `sync.yaml`. |
| `logo_text` | boolean | | Show site name next to logo icon (default: `true`). Set `false` for icon-only header. |
| `footer` | array | | Footer items — flat list of `text`, `license`, `slug`, `href` entries. See below. |
| `template` | string | | Template to use: built-in name (`default`, `academic`), GitHub repo (`org/repo[@ref]`), or local path (`./templates/...`). Default: `default`. See [templates.md](templates.md). |
| `home` | array | | Homepage section layout. Overridden by template if template defines `home`. See [templates.md](templates.md). |
| `categories` | array | | Content categories for homepage and listing pages |

## Brand Hue

The `brand_hue` value sets the oklch hue for the entire color palette. All brand colors, surfaces, borders, and accents derive from this single value.

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

## Categories

Categories control how content is grouped on the homepage and on `/category/[key]` listing pages.

Each content item declares its category via the `category` field in `meta.yaml` (books/journals) or `sync.yaml` (laws). If omitted, items default to their type name (`book`, `journal`, or `law`).

```yaml
categories:
  - key: textbooks
    label: { de: "Lehrbücher", en: "Textbooks" }
  - key: commentaries
    label: { de: "Kommentare", en: "Commentaries" }
  - key: ai-journals
    label: { de: "Zeitschriften für KI", en: "AI Journals" }
  - key: laws
    label: { de: "Gesetze", en: "Laws" }
```

- `key` — matches the `category` value in content metadata
- `label` — per-locale display name
- Order in the array = order on the homepage
- Categories with zero items are hidden automatically

If `categories` is omitted entirely, the homepage falls back to three default sections: books, journals, laws.

## Rebranding Example

```yaml
name: "JuraOpen"
tagline:
  de: "Freie juristische Fachliteratur"
  en: "Free legal scholarship"
default_locale: "de"
brand_hue: 150

footer:
  - text: "© JuraOpen"

categories:
  - key: commentaries
    label: { de: "Kommentare", en: "Commentaries" }
  - key: textbooks
    label: { de: "Lehrbücher", en: "Textbooks" }
  - key: law
    label: { de: "Gesetze", en: "Laws" }
```

## Footer

The `footer` is a flat array of items, displayed left to right, separated by `·`. Order in the array = order in the footer.

```yaml
footer:
  - text: "© 2026 OpenLex"
  - license: true
  - slug: impressum
    label: { de: "Impressum", en: "Imprint" }
  - slug: datenschutz
    label: { de: "Datenschutz", en: "Privacy Policy" }
  - href: "https://github.com/openlex-project/openlex"
    label: { de: "GitHub", en: "GitHub" }
```

Each item is one of four types:

| Key | Description |
|---|---|
| `text` | Plain text, shown as-is (e.g. copyright notice) |
| `license` | CC license badge with link (from current page's content license) |
| `slug` | Local markdown page — renders `footer/{slug}.md` at `/{slug}` |
| `href` | External link, opens in a new tab |

`slug` and `href` items require a `label` object with per-locale display text.

Markdown files live in the `footer/` directory in the project root (not in content repos).

## Notes

- `site.yaml` is committed to the repo — it's public configuration, not secrets.
- Secrets (PAT, OAuth) stay in `.env.local` / Vercel environment variables.
- The code-level fallback locale is `en`. The `default_locale` in `site.yaml` overrides it.
