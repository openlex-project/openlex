# toc.yaml

The `toc.yaml` file is located in the root directory of a book/journal content repo and defines the structure and order of contents.

## Schema

```yaml
contents:
  - file: foreword.md
    title: Foreword

  - file: introduction.md
    title: Introduction to the GDPR

  - file: prelim-1-4.md
    title: "Preliminary Remarks on Art. 1–4"
    provisions: [1, 2, 3, 4]

  - file: art-5.md
    title: "Art. 5 – Principles of Processing"
    provisions: [5]

  - file: excursus-accountability.md
    title: "Excursus: Accountability Principle"
```

## Fields per Entry

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | string | ✓ | Filename relative to `content/` |
| `title` | string | ✓ | Display title (for navigation, breadcrumbs) |
| `provisions` | number[] | | Assigned provision numbers (for cross-links) |

## Behavior

- The order in `contents` determines the table of contents order.
- The URL slug is derived from the filename: `art-5.md` → `/book/{werk}/art-5`.
- `provisions` enables cross-links from law to commentary: the law page `/law/dsgvo/5` shows links to all commentary entries with `provisions: [5]`.
- Entries without `provisions` (forewords, excursuses) appear in the table of contents but not as cross-links from the law.

## Without toc.yaml

If no `toc.yaml` is present, all `.md` files from `content/` are used as entries, sorted alphabetically. In this case, no `provisions` mappings and no cross-links are available.
