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

Line 1: Name, Line 2: ORCID (optional). The name is rendered as a link to orcid.org.

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

## Pandoc Attributes

Pandoc attributes in curly braces are automatically stripped and not rendered:

```markdown
## Heading {#custom-id .class key="value"}
```
