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

In the online version, footnote markers show a hover tooltip with the footnote text. Clicking scrolls to the footnote section at the bottom.

## Citations (CSL)

References are resolved with `@citation_key`. Keys must be defined in the repo's `references.yaml`.

```markdown
^[See @mustermann2024, S. 42 ff.]
^[@musterfrau2023, S. 45.]
```

Locators (page references) are separated from the key by a comma. Citations with a `URL` field (e.g. `legal_case` entries) are rendered as clickable links in the online version. See [references.yaml](references-yaml.md) for details.

No per-article bibliography is generated — all citations are collected into a single Literaturverzeichnis (and Rechtsprechungsverzeichnis for `legal_case` entries) accessible via the sidebar.

## Author Block

Authors are assigned in `toc.yaml` (see [toc.yaml](toc-yaml.md)). Children inherit the parent's author. A `::: author` block in the content file overrides the toc.yaml assignment:

```markdown
::: author
Max Mustermann
:::

::: author
name: Erika Musterfrau
orcid: 0000-0000-0000-0001
:::
```

## Fenced Divs (Directives)

Pandoc-style fenced divs for structured blocks:

```markdown
::: note
This is a note (law text box in print).
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

### Unnumbered Headings

```markdown
## Introduction {.unnumbered}
```

## Cross-References

```markdown
[Linktext](#header-id){.xref}
```

In print: → Linktext, § 24 A., S. 21. Online: regular link with arrow prefix.

## Index Entries

```markdown
[Text]{.idx}
[Text]{.idx entry="Main!Sub"}
[Text]{.idx see="Other Term"}
[Text]{.idx sort="Aesthetik"}
```

## Glossary

```markdown
::: {.glossary-entries}
Term One
:   Definition of term one.
:::

The [Term One]{.gls} is important here.
```

## Online Navigation

The sidebar shows the full table of contents from `toc.yaml`. For the active chapter, `##` and `###` headings appear as anchor links for in-page navigation. Children entries are shown indented under their parent.

Backmatter sections (Literaturverzeichnis, Rechtsprechungsverzeichnis, Autorenverzeichnis) appear at the bottom of the sidebar when content exists. They are accessible as direct URLs: `/book/{werk}/literaturverzeichnis`.

## Translations

Content repos are single-language by default. The primary language is declared in `meta.yaml` (`lang: "de"`).

To add translations, place translated files in `content/{locale}/` subfolders mirroring the root structure:

```
content/
  art-5.md              # de (default, from meta.yaml lang)
  art-6.md
  en/
    art-5.md            # English translation of art-5
    art-6.md
```

Declare available translations in `meta.yaml`:

```yaml
lang: "de"
translations: ["en"]
```

- Root `content/` = default language (no subfolder needed)
- `content/{locale}/` = translations
- Only translated files need to exist — missing translations fall back to the default language
- URLs: `/oc-dsgvo/art-5` (default), `/en/oc-dsgvo/art-5` (English)
