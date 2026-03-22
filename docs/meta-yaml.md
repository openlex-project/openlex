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
    orcid: "0000-0000-0000-0000"

# Optional fields
title_short: "OC-DSGVO"            # Short title (navigation, citations)
category: "commentaries"            # Category key for homepage grouping
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
| `lang` | string | ✓ | Language (ISO 639-1) |
| `license` | string | ✓ | License identifier (shown in footer) |
| `category` | string | | Category key for homepage grouping (defaults to `type`) |
| `numbering` | string | books only | Numbering schema |
| `comments_on` | string | | Slug of the commented law |
| `csl` | string | | Path to CSL file |
| `bibliography` | string | | Path to `references.yaml` |
| `issn` | string | | ISSN (journals only) |
| `doi_prefix` | string | | DOI prefix (journals only) |
| `editors` | array | ✓ | List of editors |

## Category

The `category` field groups content on the homepage. If omitted, items default to their `type` value (`book` or `journal`). Categories are defined in `site.yaml` with per-locale labels and display order.

Example: A commentary might use `category: "commentaries"` while a textbook uses `category: "textbooks"`, even though both have `type: "book"`.

## Editors

```yaml
editors:
  - name: "Max Mustermann"
    orcid: "0000-0000-0000-0000"    # optional
```

## Journal-Specific

Journals use `type: "journal"` and do **not** use `toc.yaml`. Structure is defined by per-issue `issue.yaml` files:

```
zfkir/
  meta.yaml              # type: "journal", doi_prefix
  2026/
    01/
      issue.yaml          # Article list with metadata
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
category: "ai-journals"
issn: "0800-0001"
doi_prefix: "10.12345/zfkir"
editors:
  - name: "Prof. Dr. Anna Beispiel"
```

### Issue `issue.yaml`

```yaml
articles:
  - file: mustermann-ki-haftung.md
    title: "Haftung für KI-generierte Inhalte"
    authors:
      - name: "Prof. Dr. Max Mustermann"
        orcid: "0000-0001-2345-6789"
    section: "Aufsätze"
    pages: "1-12"
    numbering: "commentary"
```

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | string | ✓ | Markdown filename |
| `title` | string | ✓ | Article title |
| `authors` | array | ✓ | Authors with optional `orcid` |
| `section` | string | ✓ | Section/topic grouping (e.g., "Essays", "Case Law") |
| `pages` | string | | Page range — enables citation redirect |
| `numbering` | string | | Heading numbering schema |
| `doi` | string | | Explicit DOI override |

## Notes

- `title_short` is preferred in navigation. Falls back to `title`.
- `comments_on` links a commentary to a law. The value must match a law's slug in `sync.yaml`.
- `license` is shown in the page footer per content item.
