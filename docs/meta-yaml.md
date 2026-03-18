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
comments_on: "dsgvo"            # Slug of the commented law
csl: "jura.csl"                 # Path to CSL file in repo
bibliography: "references.yaml" # Path to references file in repo
translations: ["en"]            # Available translations
```

## Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | ✓ | Unique URL slug of the work |
| `type` | `book` \| `journal` | ✓ | Type of work |
| `title` | string | ✓ | Full title |
| `title_short` | string | | Short title for citations and navigation |
| `lang` | string | ✓ | Language (ISO 639-1) |
| `license` | string | ✓ | License identifier |
| `numbering` | string | ✓ | `commentary` \| `textbook` \| `decimal` \| `none` |
| `comments_on` | string | | Slug of the commented law (commentaries only) |
| `csl` | string | | Path to CSL file for citation formatting |
| `bibliography` | string | | Path to `references.yaml` |
| `editors` | array | ✓ | List of editors (name + orcid) |

## Notes

- `title_short` is preferred in navigation and citation suggestions. Falls back to `title`.
- `comments_on` links a commentary to a law. The value must match the `slug` of a law in a `sync.yaml`.
- `csl` and `bibliography` paths are relative to the repo root.
