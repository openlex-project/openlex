# Print Pipeline (Pandoc / LaTeX)

Each content repo can generate a print-ready PDF from the same `/content` Markdown files used for the online version. The pipeline uses Pandoc with XeLaTeX and Lua filters.

## Repo Structure

```
oc-dsgvo/
  content/              # SSOT: same files for web + print
  meta.yaml             # Book metadata
  toc.yaml              # Content order (SSOT for both pipelines)
  references.yaml       # Bibliography (CSL-YAML)
  jura.csl              # Citation style
  pandoc.yaml           # Pandoc defaults
  openlex-logo.png      # Publisher logo placeholder
  Makefile
  pandoc/
    templates/
      openlex-book.tex  # LaTeX book template
      openlex.sty       # Style package (De Gruyter derived, rebranded)
    filters/
      frontmatter.lua   # Extract Vorwort before TOC
      numbering.lua     # LaTeX counter setup from meta.yaml schema
      glossary.lua      # Glossary entries
      xref.lua          # Cross-references with page numbers
      index.lua         # Index entries → \index{}
      rn.lua            # Margin numbers → \rn{N}
      directives.lua    # Author, notes, examples → LaTeX environments
      strip-urls.lua    # Remove URLs from legal_case before citeproc
      table.lua         # Tables → supertabular format
      nbsp.lua          # Non-breaking spaces (§~2, Rn.~14)
      split-bib.lua     # Split bibliography + backmatter generation
    fonts/
      DeGruyterSans-*.otf
      DeGruyterSerif-*.otf
```

## Filter Execution Order

Order matters. Defined in `pandoc.yaml`:

```yaml
filters:
  - pandoc/filters/frontmatter.lua  # 1. Extract Vorwort → template variable
  - pandoc/filters/numbering.lua    # 2. LaTeX counter setup from schema
  - pandoc/filters/glossary.lua
  - pandoc/filters/xref.lua
  - pandoc/filters/index.lua
  - pandoc/filters/rn.lua
  - pandoc/filters/directives.lua   # Author blocks, Autorenverzeichnis
  - pandoc/filters/strip-urls.lua   # Strip URLs from legal_case
  - citeproc                        # Resolve @citations
  - pandoc/filters/table.lua        # Convert tables → supertabular
  - pandoc/filters/nbsp.lua
  - pandoc/filters/split-bib.lua    # Backmatter: Lit, Rspr, LOF, LOT, Index
```

## Title Pages (Titelei)

The template uses the sty's `\maketitle` which generates De Gruyter-style title pages:

1. **Schmutztitel** (half title) — Author + Title
2. **Blank page**
3. **Haupttitel** (full title) — Author, Title, Subtitle, Edition
4. **Impressum** — ISBN, DNB info, Copyright, Typesetter, openlex.org

Title page data comes from `meta.yaml`:

| meta.yaml field | LaTeX command | Appears on |
|---|---|---|
| `title` | `\title` | Schmutztitel + Haupttitel |
| `subtitle` | `\subtitle` | Haupttitel |
| `edition` | `\edition` | Haupttitel |
| `isbn` | `\isbn` | Impressum |
| `copyrightyear` | `\copyrightyear` | Impressum |
| `editors` | `\author` + `\authorinfo` | All title pages + Impressum |

Editors are shown as "Name (Hrsg.)" on title pages. On the impressum, editors are listed with affiliation. If an explicit `author` field exists in meta.yaml, it takes precedence over editors on title pages.

## Frontmatter

Entries with `frontmatter: true` in `toc.yaml` are extracted by `frontmatter.lua` and placed before the table of contents. The heading is rendered as raw LaTeX (no `\chapter*`, no TOC entry). Typical use: Vorwort.

Result: Titelei → Vorwort (S. V, roman) → TOC → Hauptteil (S. 1ff, arabic).

## Numbering

`numbering.lua` reads the `numbering` field from `meta.yaml` and generates LaTeX `\renewcommand` via `header-includes`:

| Schema | ## | ### | #### | ##### |
|---|---|---|---|---|
| `commentary` | A. | I. | 1. | a) |
| `textbook` | § 1 | A. | I. | 1. |
| `decimal` | 1. | 1.1 | 1.1.1 | 1.1.1.1 |

The sty has fallback Lehrbuch numbering if no schema is specified.

## Backmatter

`split-bib.lua` auto-generates all backmatter sections:

- **Literaturverzeichnis**: All non-`legal_case` references
- **Rechtsprechungsverzeichnis**: Only `legal_case` references
- **Tabellenverzeichnis**: Only when tables exist (detected via RawBlock patterns)
- **Abbildungsverzeichnis**: Only when figures exist
- **Stichwortverzeichnis**: Only when `{.idx}` markers exist

## Makefile

The Makefile derives input files recursively from `toc.yaml`:

```makefile
CONTENT_FILES := $(shell yq '.. | select(has("file")) | .file' toc.yaml | sed 's|^|content/|')

pdf: output/book.pdf

output/book.pdf: $(CONTENT_FILES) pandoc.yaml toc.yaml references.yaml jura.csl
	@mkdir -p output
	pandoc -d pandoc.yaml $(CONTENT_FILES)
```

## Building Locally

Prerequisites: Pandoc ≥ 3.1, TeX Live (with XeLaTeX), yq (mikefarah).

```bash
make pdf          # → output/book.pdf
make clean        # remove output/
```

## Fonts

De Gruyter Sans and Serif fonts (OFL-licensed) in `pandoc/fonts/`. Source: <https://gitlab.com/degruyter-public/font/de-gruyter-sans_serif>
