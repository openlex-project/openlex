# meta.yaml

The `meta.yaml` file is located in the root directory of each book/journal content repo and defines the work's metadata.

## Schema

```yaml
# Required fields
slug: "oc-dsgvo"
type: "book"                        # book | journal
title: "OpenCommentary DSGVO"
lang: "de"                          # ISO 639-1
license: "CC-BY-SA-4.0"
numbering: "commentary"             # commentary | textbook | decimal | none
editors:
  - name: "Max Mustermann"
    affiliation: "Hochschule Musterstadt"
    orcid: "0000-0000-0000-0000"

# Optional fields
title_short: "OC-DSGVO"            # Short title (navigation, citations)
subtitle: "Datenschutz-Grundverordnung"
isbn: "000-0-00-000000-0"
edition: "1. Auflage"
copyrightyear: "2026"
comments_on: "dsgvo"                # Slug of the commented law
csl: "jura.csl"                     # Path to CSL file in repo
bibliography: "references.yaml"     # Path to references file in repo
```

## Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | ✓ | Unique URL slug |
| `type` | `book` \| `journal` | ✓ | Type of work |
| `title` | string | ✓ | Full title |
| `title_short` | string | | Short title for navigation |
| `subtitle` | string | | Subtitle (print title page) |
| `isbn` | string | | ISBN (print impressum) |
| `issn` | string | | ISSN (journals only) |
| `edition` | string | | Edition string (print title page) |
| `copyrightyear` | string | | Copyright year (print impressum, defaults to current year) |
| `lang` | string | ✓ | Language (ISO 639-1) |
| `license` | string | ✓ | License identifier |
| `numbering` | string | books only | Numbering schema |
| `comments_on` | string | | Slug of the commented law |
| `csl` | string | | Path to CSL file |
| `bibliography` | string | | Path to `references.yaml` |
| `editors` | array | ✓ | List of editors |

## Editors

```yaml
editors:
  - name: "Max Mustermann"
    affiliation: "Hochschule Musterstadt"   # optional
    orcid: "0000-0000-0000-0000"            # optional
```

Editors appear on the print title pages as "Name (Hrsg.)" and on the impressum page with affiliation. In the online version, they serve as ORCID fallback for chapter authors.

If a work has a single author (monograph/textbook), use the `author` field instead — `editors` with "(Hrsg.)" is the fallback for title pages.

## Backmatter (Auto-Detected)

Backmatter sections are generated automatically based on content:

| Section | Appears when |
|---|---|
| Literaturverzeichnis | `bibliography` field is set and `@keys` are cited |
| Rechtsprechungsverzeichnis | Cited references include `type: legal_case` |
| Autorenverzeichnis | `toc.yaml` entries have `author` fields |

No configuration needed — sections appear in both online sidebar and print PDF when content exists.

## Notes

- `title_short` is preferred in navigation. Falls back to `title`.
- `comments_on` links a commentary to a law. The value must match a law's `slug` in `sync.yaml`.
- `csl` and `bibliography` paths are relative to the repo root.

## Journal-Specific

Journals use `type: "journal"` and do **not** use `toc.yaml`. Structure is derived from the filesystem:

```
zfkir/
  meta.yaml              # type: "journal"
  2026/
    01/                  # Issue (Heft)
      mustermann-ki.md   # Article with frontmatter
```

Each article has YAML frontmatter:

```yaml
---
title: "Haftung für KI-generierte Inhalte"
author: "Prof. Dr. Max Mustermann"
rubrik: "Aufsätze"
pages: "1-12"
---
```

| Field | Required | Description |
|---|---|---|
| `title` | ✓ | Article title |
| `author` | ✓ | Author name |
| `rubrik` | ✓ | Section grouping (Aufsätze, Rechtsprechung, etc.) |
| `pages` | | Page range, enables citation redirect (`/journal/zfkir/2026/5` → article containing page 5) |

Discovery: directories matching `YYYY/` are years, subdirectories are issues, `.md` files are articles.
