# Content Guide for Authors

This document describes the Markdown syntax and conventions for content on OpenLex.

## File Format

All content is written in **Pandoc-flavor Markdown** and stored in the `content/` directory of the respective content repo. The filename (without `.md`) becomes the URL slug: `content/art-5.md` → `/book/{werk}/art-5`.

## Margin Numbers

Margin numbers are set with `[]{.rn}`. They are automatically numbered sequentially.

```markdown
[]{.rn} This is the first paragraph with margin number 1.

[]{.rn} This is the second paragraph with margin number 2.
```

## Footnotes (Inline)

Inline footnotes with `^[text]`:

```markdown
This is a sentence with a footnote.^[See Mustermann, Datenschutzrecht, p. 42.]
```

## Citations (CSL)

References are resolved with `@citation_key`. Keys must be defined in the repo's `references.yaml`.

```markdown
^[See @mustermann2024, S. 42 ff.]
^[@musterfrau2023, S. 45.]
```

Locators (page references) are separated from the key by a comma. A bibliography is automatically generated at the end of the document.

## Author Block

The author block is placed as a fenced div at the beginning of the document:

```markdown
::: author
Max Mustermann
0000-0001-2345-6789
:::
```

Line 1: Name, Line 2: ORCID (optional). Only supported after `#` and `##` headings. No inheritance — each chapter/section needs its own block.

## Fenced Divs (Directives)

Pandoc-style fenced divs for structured blocks:

```markdown
::: note
This is a note.
:::

::: example
This is an example.
:::

::: warning
This is a warning.
:::
```

## Heading Numbering

Numbering is controlled via the `numbering` field in `meta.yaml`. Available schemas:

| Schema | Description |
|---|---|
| `commentary` | A. / I. / 1. / a) |
| `textbook` | § 1 / A. / I. / 1. |
| `decimal` | 1. / 1.1 / 1.1.1 |
| `none` | No numbering |

### Manual Numbering

```markdown
## Heading {number="III."}
```

### Unnumbered Headings

```markdown
## Introduction {.unnumbered}
```

## Cross-References

Internal cross-references with page numbers in print, regular links online:

```markdown
[Linktext](#header-id){.xref}
```

In print output, this renders as: → Linktext, § 24 A., S. 21 (with actual section and page references). In the online version, it renders as a regular link with an arrow prefix.

For inline-style (bold) cross-references:

```markdown
[Linktext](#header-id){.xref-inline}
```

## Index Entries

Mark terms for the index (Stichwortverzeichnis):

```markdown
[Text]{.idx}
[Text]{.idx entry="Main!Sub"}
[Text]{.idx see="Other Term"}
[Text]{.idx sort="Aesthetik"}
```

| Attribute | Effect |
|---|---|
| (none) | Index entry equals the visible text |
| `entry` | Custom index entry (supports `!` for sub-entries) |
| `see` | "see" reference to another term |
| `sort` | Custom sort key (useful for umlauts) |

The index is auto-generated in both print and online output when `{.idx}` entries exist.

## Glossary

Define glossary entries with a fenced div containing a definition list:

```markdown
::: {.glossary-entries}
Term One
:   Definition of term one.

Term Two
:   Definition of term two.
:::
```

Reference glossary terms inline:

```markdown
The [Term One]{.gls} is important here.
```

The glossary is auto-generated in both print and online output when entries exist.

## Backmatter (Auto-Generated)

The following sections are generated automatically by both the online and print pipelines when corresponding entries exist in the content. No separate backmatter files are needed.

| Section | Trigger | Controlled by |
|---|---|---|
| Literaturverzeichnis | `@citation_key` references | `meta.yaml` → `backmatter.bibliography` |
| Rechtsprechungsverzeichnis | References with `type: legal_case` | `meta.yaml` → `backmatter.bibliography: split` |
| Stichwortverzeichnis | `[]{.idx}` spans | `meta.yaml` → `backmatter.index` |
| Glossar | `[]{.gls}` spans + `::: {.glossary-entries}` | `meta.yaml` → `backmatter.glossary` |
| Tabellenverzeichnis | Tables with captions | `meta.yaml` → `backmatter.list-of-tables` |
| Abbildungsverzeichnis | Images with captions | `meta.yaml` → `backmatter.list-of-figures` |

See [meta.yaml](meta-yaml.md) for configuration options.

## Pandoc Attributes

Pandoc attributes in curly braces are automatically stripped and not rendered:

```markdown
## Heading {#custom-id .class key="value"}
```
