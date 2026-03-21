# toc.yaml

The `toc.yaml` file is located in the root directory of a book/journal content repo and defines the structure and order of contents. It is the single source of truth (SSOT) for both the online and print pipelines.

## Schema

```yaml
contents:
  - file: vorwort.md
    title: Vorwort
    frontmatter: true

  - file: vorbem-1-4.md
    title: "Vorbemerkungen zu Art. 1–4"
    author:
      name: Max Mustermann
      affiliation: "Hochschule Musterstadt"
      orcid: "0000-0000-0000-0000"
    provisions: [1, 2, 3, 4]

  - file: art-4.md
    title: "Art. 4 – Begriffsbestimmungen"
    author: Erika Musterfrau
    provisions: [4]
    children:
      - file: art-4-nr-1.md
        title: "Nr. 1 – Personenbezogene Daten"
      - file: art-4-nr-2.md
        title: "Nr. 2 – Verarbeitung"
      - file: art-4-nr-7.md
        title: "Nr. 7 – Verantwortlicher"

  - file: art-5.md
    title: "Art. 5 – Grundsätze"
    author: Max Mustermann
    provisions: [5]
```

## Fields per Entry

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | string | ✓ | Filename relative to `content/` |
| `title` | string | ✓ | Display title (navigation, sidebar, TOC) |
| `provisions` | number[] | | Assigned provision numbers (for cross-links) |
| `author` | string \| object | | Chapter author (see below) |
| `frontmatter` | boolean | | If `true`, placed before TOC in print (e.g. Vorwort) |
| `children` | TocEntry[] | | Sub-entries for multi-file chapters |

## Author Field

Two forms:

```yaml
# Short form (name only, ORCID resolved from editors or other entries)
- file: art-1.md
  author: Max Mustermann

# Long form (name + affiliation + ORCID)
- file: art-2.md
  author:
    name: Erika Musterfrau
    affiliation: "Universität Musterstadt"
    orcid: "0000-0000-0000-0001"
```

`affiliation` is optional. ORCID is resolved from: 1. long-form entries in toc.yaml, 2. `editors` in meta.yaml.

A `::: author` block in the content file overrides the toc.yaml assignment.

## Children (Multi-File Chapters)

Large chapters can be split into separate files using `children`. Children inherit the parent's `author` if they don't define their own.

```yaml
- file: art-4.md
  title: "Art. 4 – Begriffsbestimmungen"
  author: Erika Musterfrau
  children:
    - file: art-4-nr-1.md
      title: "Nr. 1 – Personenbezogene Daten"
    - file: art-4-nr-7.md
      title: "Nr. 7 – Verantwortlicher"
      author: Max Mustermann  # overrides parent
```

In the online version, children appear indented in the sidebar. In print, all files are concatenated in order. Prev/next navigation traverses the flat sequence including children.

## Frontmatter

Entries with `frontmatter: true` are placed before the table of contents in the print PDF (e.g. Vorwort). They get a manual heading without TOC entry. In the online version, they are regular pages.

## Behavior

- The order in `contents` determines the table of contents and navigation order.
- The URL slug is derived from the filename: `art-5.md` → `/book/{werk}/art-5`.
- `provisions` enables cross-links from law to commentary.
- The Makefile extracts all files recursively: `yq '.. | select(has("file")) | .file' toc.yaml`.

## Without toc.yaml

If no `toc.yaml` is present, all `.md` files from `content/` are used, sorted alphabetically. No provisions mappings, no cross-links, no children.
