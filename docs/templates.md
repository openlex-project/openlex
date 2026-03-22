# Templates

OpenLex supports a template system for customizing the visual appearance and layout of your instance. Templates control CSS styling, component variants, and homepage layout.

## Quick Start

Set the `template` field in `site.yaml`:

```yaml
template: default     # built-in (default if omitted)
template: academic    # built-in academic style
```

## Template Sources

### Built-in Templates

| Template | Header | Cards | Content | Description |
|---|---|---|---|---|
| `default` | glass | elevated | narrow | Current design, no changes |
| `academic` | solid | flat | wide | Serif fonts, wider content, subdued cards |

### Remote Templates (GitHub)

Reference a GitHub repository:

```yaml
template: openlex-project/template-academic
template: openlex-project/template-academic@v2.1   # pinned version
template: my-org/my-template@main                   # custom repo
```

Remote templates are fetched at build time via the GitHub API (same mechanism as content). They support CSS overrides and variant configuration — no custom components (for security).

### Local Templates

Point to a local directory:

```yaml
template: ./templates/my-custom
```

Local templates support everything including custom React components.

## Template Structure

A template is a directory (or GitHub repo) with:

```
template.yaml     # variant configuration (optional)
styles.css        # CSS overrides (optional)
preview.png       # screenshot for gallery (optional)
```

### template.yaml

```yaml
name: "My Template"

variants:
  header: glass       # glass | solid | minimal
  card: elevated      # elevated | flat | bordered
  content: narrow     # narrow | wide | full

home:
  - type: hero
  - type: featured
    items: [oc-dsgvo, dsgvo]
  - type: categories
  - type: recent
    limit: 5
```

All fields are optional. Unspecified variants fall back to defaults (glass, elevated, narrow).

### styles.css

Standard CSS that overrides the base styles:

```css
:root {
  --font-body: "Literata", "Georgia", serif;
  --font-heading: "Inter", system-ui, sans-serif;
  --content-max-width: 72ch;
}

body { font-family: var(--font-body); }
h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); }

.prose { font-size: 1.05rem; line-height: 1.85; }
.card { box-shadow: none; border-radius: 0.375rem; }
.glass-header { backdrop-filter: none; background: var(--surface); }
```

You can override any CSS variable or class from the base styles.

## Variant Reference

### Header

| Variant | Behavior |
|---|---|
| `glass` | Translucent blur header (default) |
| `solid` | Opaque header, no blur |
| `minimal` | Solid header, search box hidden |

### Card

| Variant | Behavior |
|---|---|
| `elevated` | Shadow + rounded corners (default) |
| `flat` | No shadow, subtle border |
| `bordered` | Prominent border, no shadow |

### Content Width

| Variant | Behavior |
|---|---|
| `narrow` | Standard prose width (default) |
| `wide` | 72ch max-width |
| `full` | No max-width constraint |

## Homepage Sections

The homepage layout is controlled by the `home` field in `template.yaml` or `site.yaml`:

```yaml
home:
  - type: hero                    # logo + title + tagline
  - type: featured                # selected works by slug
    items: [oc-dsgvo, dsgvo]
  - type: categories              # category grid
  - type: recent                  # recently added content
    limit: 5
```

If `home` is omitted, the homepage shows hero + categories (current default).

## Creating a Template

1. Create a GitHub repo with `template.yaml` and/or `styles.css`
2. Test locally: set `template: ./path/to/repo` in `site.yaml`
3. Push to GitHub
4. Others use it: `template: your-org/your-template`

## Local Templates with Custom Components

For structural changes beyond CSS and variants, use a local template with React components:

```
templates/my-custom/
  template.yaml
  styles.css
  header.tsx        # custom header component
  card.tsx          # custom card component
```

Custom components receive typed props defined in `@/lib/template`. This requires a rebuild (`next build`).
