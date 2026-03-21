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

Journals use `type: "journal"` and do **not** use `toc.yaml`. Structure is defined by per-issue `meta.yaml` files:

```
zfkir/
  meta.yaml              # type: "journal", doi_prefix
  2026/
    01/
      meta.yaml          # Article list with metadata
      mustermann-ki.md   # Pure markdown, no frontmatter
```

### Journal `meta.yaml`

```yaml
slug: "zfkir"
type: "journal"
title: "Zeitschrift für KI-Recht"
title_short: "ZfKIR"
lang: "de"
license: "CC-BY-SA-4.0"
issn: "0800-0001"
doi_prefix: "10.12345/zfkir"
editors:
  - name: "Prof. Dr. Anna Beispiel"
```

| Field | Type | Required | Description |
|---|---|---|---|
| `doi_prefix` | string | | DOI prefix — article DOIs derived as `{prefix}.{year}.{firstPage}` |
| `issn` | string | | ISSN |

### Issue `meta.yaml`

```yaml
articles:
  - file: mustermann-ki-haftung.md
    title: "Haftung für KI-generierte Inhalte"
    authors:
      - name: "Prof. Dr. Max Mustermann"
        orcid: "0000-0001-2345-6789"
      - name: "Dr. Anna Beispiel"
    rubrik: "Aufsätze"
    pages: "1-12"
    numbering: "commentary"
```

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | string | ✓ | Markdown filename |
| `title` | string | ✓ | Article title |
| `authors` | array | ✓ | Authors with optional `orcid` |
| `rubrik` | string | ✓ | Section grouping (Aufsätze, Rechtsprechung, etc.) |
| `pages` | string | | Page range — enables citation redirect (`/journal/zfkir/2026/5` → article) |
| `numbering` | string | | Heading numbering schema (commentary, textbook, decimal, none) |
| `doi` | string | | Explicit DOI override (otherwise derived from `doi_prefix`) |

Discovery: directories matching `YYYY/` are years, subdirectories are issues, each must contain a `meta.yaml`.
