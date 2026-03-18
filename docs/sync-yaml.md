# sync.yaml

The `sync.yaml` file is located in the root directory of a law repo (e.g., `openlex-laws`) and defines all contained laws.

## Schema

```yaml
laws:
  dsgvo:
    title: "Datenschutz-Grundverordnung"
    title_short: "DSGVO"
    unit_type: "article"
    lang: "de"
    source: "gii"
    gii_slug: "dsgvo"

  urhg:
    title: "Gesetz über Urheberrecht und verwandte Schutzrechte"
    title_short: "UrhG"
    unit_type: "section"
    lang: "de"
    source: "gii"
    gii_slug: "urhg"
```

## Fields per Law

| Field | Type | Required | Description |
|---|---|---|---|
| (Key) | string | ✓ | Slug of the law (= directory name in repo) |
| `title` | string | ✓ | Full title |
| `title_short` | string | | Short title / abbreviation (e.g., "DSGVO") |
| `unit_type` | `article` \| `section` | ✓ | Unit type: `article` → "Art.", `section` → "§" |
| `lang` | string | ✓ | Language (ISO 639-1) |
| `source` | string | | Source for sync (e.g., `gii` for gesetze-im-internet.de) |
| `gii_slug` | string | | Slug on gesetze-im-internet.de |

## Directory Structure

Each law has its own directory in the repo, named after the slug:

```
openlex-laws/
  sync.yaml
  dsgvo/
    1.md
    2.md
    5.md
    ...
  urhg/
    1.md
    15.md
    ...
```

Markdown files contain plain legal text without frontmatter.

## Notes

- `title_short` is preferred in navigation and cross-links.
- `unit_type` determines the prefix on the law page: "Art. 5 DSGVO" vs. "§ 15 UrhG".
- A law repo can contain multiple laws (mono-repo).
