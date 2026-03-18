# meta.yaml

The `meta.yaml` file is located in the root directory of each book/journal content repo and defines the work's metadata.

## Schema

```yaml
# Required fields
slug: "oc-dsgvo"                # URL slug, unique
type: "book"                    # book | journal
title: "OpenCommentary DSGVO"   # Full title
lang: "de"                      # Language (ISO 639-1)
license: "CC-BY-SA-4.0"        # License identifier
numbering: "commentary"         # Numbering schema (see content-guide.md)
editors:
  - name: "Max Mustermann"
    orcid: "0000-0001-2345-6789"

# Optional fields
title_short: "OC-DSGVO"        # Short title (for citations, navigation)
isbn: "978-3-11-123456-7"      # ISBN (print output + metadata)
doi: "10.1515/9783111234567"    # DOI for the entire work
comments_on: "dsgvo"            # Slug of the commented law
csl: "jura.csl"                 # Path to CSL file in repo
bibliography: "references.yaml" # Path to references file in repo
translations: ["en"]            # Available translations
backmatter:                     # Auto-generated backmatter sections
  bibliography: split           # split | merged | false
  index: auto                   # true | false | auto
  glossary: auto
  list-of-tables: auto
  list-of-figures: auto
```

## Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | ✓ | Unique URL slug of the work |
| `type` | `book` \| `journal` | ✓ | Type of work |
| `title` | string | ✓ | Full title |
| `title_short` | string | | Short title for citations and navigation |
| `isbn` | string | | ISBN (used in print output and metadata) |
| `doi` | string | | DOI for the entire work (without `https://doi.org/` prefix) |
| `lang` | string | ✓ | Language (ISO 639-1) |
| `license` | string | ✓ | License identifier |
| `numbering` | string | ✓ | `commentary` \| `textbook` \| `decimal` \| `none` |
| `comments_on` | string | | Slug of the commented law (commentaries only) |
| `csl` | string | | Path to CSL file for citation formatting |
| `bibliography` | string | | Path to `references.yaml` |
| `editors` | array | ✓ | List of editors (name + orcid) |
| `backmatter` | object | | Controls auto-generated backmatter sections |

## Backmatter

The `backmatter` object controls which auto-generated sections appear in both the online and print output. All fields are optional and default to `auto` (generate only when corresponding entries exist in the content).

```yaml
backmatter:
  bibliography: split    # "split" | "merged" | false
  index: true            # true | false | "auto"
  glossary: auto         # true | false | "auto"
  list-of-tables: auto   # true | false | "auto"
  list-of-figures: auto  # true | false | "auto"
```

| Field | Values | Default | Description |
|---|---|---|---|
| `bibliography` | `split` \| `merged` \| `false` | `split` | `split` = separate Literatur + Rechtsprechung; `merged` = single list |
| `index` | `true` \| `false` \| `auto` | `auto` | Stichwortverzeichnis from `[]{.idx}` entries |
| `glossary` | `true` \| `false` \| `auto` | `auto` | Glossar from `[]{.gls}` + `::: {.glossary-entries}` |
| `list-of-tables` | `true` \| `false` \| `auto` | `auto` | Tabellenverzeichnis from table captions |
| `list-of-figures` | `true` \| `false` \| `auto` | `auto` | Abbildungsverzeichnis from image captions |

## Notes

- `title_short` is preferred in navigation and citation suggestions. Falls back to `title`.
- `isbn` is included in the print PDF title page and in Schema.org metadata online.
- `doi` is the work-level DOI (e.g., `10.1515/9783111234567`). Chapter-level DOIs are set in `toc.yaml`. Both are rendered as `https://doi.org/{doi}` links in online and print output.
- `comments_on` links a commentary to a law. The value must match the `slug` of a law in a `sync.yaml`.
- `csl` and `bibliography` paths are relative to the repo root.
