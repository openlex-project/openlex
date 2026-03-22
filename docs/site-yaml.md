# site.yaml

The `site.yaml` file is located in the project root and configures the site identity, branding, and content categories. This is the only file a deployer needs to edit to rebrand the platform.

## Schema

```yaml
name: "OpenLex"
tagline:
  de: "Open-Access-Plattform für juristische Fachliteratur"
  en: "Open-access platform for legal literature"
copyright: "OpenLex"
default_locale: "de"
brand_hue: 265
logo_text: true
template: default

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
| `name` | string | ✓ | Site name (header, metadata, footer copyright) |
| `tagline` | object | ✓ | Per-locale tagline (`{locale: text}`) |
| `copyright` | string | ✓ | Copyright holder (shown as `© {copyright}` in footer) |
| `default_locale` | string | ✓ | Default locale (`de`, `en`, etc.) |
| `brand_hue` | number | ✓ | oklch color hue (0–360) — drives the entire color palette |
| `logo_text` | boolean | | Show site name next to logo icon (default: `true`). Set `false` for icon-only header. |
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
copyright: "JuraOpen"
default_locale: "de"
brand_hue: 150

categories:
  - key: commentaries
    label: { de: "Kommentare", en: "Commentaries" }
  - key: textbooks
    label: { de: "Lehrbücher", en: "Textbooks" }
  - key: law
    label: { de: "Gesetze", en: "Laws" }
```

## Notes

- `site.yaml` is committed to the repo — it's public configuration, not secrets.
- Secrets (PAT, OAuth) stay in `.env.local` / Vercel environment variables.
- The code-level fallback locale is `en`. The `default_locale` in `site.yaml` overrides it.
