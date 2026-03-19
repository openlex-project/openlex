# toc.yaml

The `toc.yaml` file is located in the root directory of a book/journal content repo and defines the structure and order of contents.

## Schema

```yaml
contents:
  - file: foreword.md
    title: Foreword

  - file: introduction.md
    title: Introduction to the GDPR
    doi: "10.1515/9783111234567-001"

  - file: prelim-1-4.md
    title: "Preliminary Remarks on Art. 1–4"
    provisions: [1, 2, 3, 4]
    doi: "10.1515/9783111234567-002"

  - file: art-5.md
    title: "Art. 5 – Principles of Processing"
    provisions: [5]
    doi: "10.1515/9783111234567-003"

  - file: excursus-accountability.md
    title: "Excursus: Accountability Principle"
```

## Fields per Entry

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | string | ✓ | Filename relative to `content/` |
| `title` | string | ✓ | Display title (for navigation, breadcrumbs) |
| `provisions` | number[] | | Assigned provision numbers (for cross-links) |
| `author` | string \| object | | Chapter author (see below) |
| `doi` | string | | Chapter-level DOI (without `https://doi.org/` prefix) |

## Author Field

The `author` field assigns an author to a chapter. Two forms:

```yaml
# Short form (name only, ORCID looked up from editors or other entries)
- file: art-1.md
  title: "Art. 1"
  author: Max Mustermann

# Long form (name + ORCID)
- file: art-2.md
  title: "Art. 2"
  author:
    name: Erika Musterfrau
    orcid: "0000-0000-0000-0001"
```

ORCID is resolved from: 1. long-form `author` entries in toc.yaml, 2. `editors` in meta.yaml. Once set for a name, it applies everywhere.

A `::: author` block in the content file overrides the toc.yaml assignment.

## Behavior

- The order in `contents` determines the table of contents order.
- The URL slug is derived from the filename: `art-5.md` → `/book/{werk}/art-5`.
- `provisions` enables cross-links from law to commentary: the law page `/law/dsgvo/5` shows links to all commentary entries with `provisions: [5]`.
- Entries without `provisions` (forewords, excursuses) appear in the table of contents but not as cross-links from the law.

## Without toc.yaml

If no `toc.yaml` is present, all `.md` files from `content/` are used as entries, sorted alphabetically. In this case, no `provisions` mappings and no cross-links are available.
