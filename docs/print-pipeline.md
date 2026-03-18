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
  pandoc.yaml           # Pandoc defaults (template, filters, engine)
  pandoc/
    templates/
      openlex-book.tex  # LaTeX book template
      openlex.sty       # Style package
    filters/
      rn.lua            # []{.rn} → \rn{N} margin numbers
      directives.lua    # ::: note/author/example → LaTeX environments
      xref.lua          # [Text](#id){.xref} → \ref + \pageref
      index.lua         # [Text]{.idx} → \index{}
      glossary.lua      # ::: {.glossary-entries} + [Term]{.gls}
      split-bib.lua     # Split bibliography: Literatur + Rechtsprechung
      table.lua         # Tables → supertabular format
      nbsp.lua          # § 2 → §~2, Rn. 14 → Rn.~14
    fonts/
      DeGruyterSans-*.otf
      DeGruyterSerif-*.otf
  Makefile
  .github/workflows/
    build-pdf.yml
```

## SSOT Principle

`toc.yaml` is the single source of truth for content order. The `pandoc.yaml` contains only rendering configuration (template, filters, engine) — no `input-files`. The Makefile derives the file list from `toc.yaml` at build time:

```makefile
CONTENT_FILES := $(shell yq -r '.[].file' toc.yaml | sed 's|^|content/|;s|$$|.md|')

pdf:
	pandoc -d pandoc.yaml $(CONTENT_FILES) -o output/book.pdf
```

## pandoc.yaml

Located in the repo root. Contains all Pandoc configuration except input files:

```yaml
# Engine
pdf-engine: latexmk
pdf-engine-opts:
  - "-xelatex"
  - "-shell-escape"

# Template
template: pandoc/templates/openlex-book.tex
top-level-division: chapter
number-sections: true
listings: true

# Filters (order matters)
filters:
  - pandoc/filters/glossary.lua
  - pandoc/filters/xref.lua
  - pandoc/filters/index.lua
  - pandoc/filters/rn.lua
  - pandoc/filters/directives.lua
  - pandoc-crossref
  - citeproc
  - pandoc/filters/table.lua
  - pandoc/filters/nbsp.lua
  - pandoc/filters/split-bib.lua

# Bibliography
csl: jura.csl
bibliography: references.yaml

# Resource paths
resource-path:
  - .
  - ./content
  - ./pandoc/fonts
  - ./pandoc/templates
```

## Lua Filters

### Adapted for OpenLex

| Filter | Source | Changes |
|---|---|---|
| `rn.lua` | `randnummern.lua` | Counts explicit `[]{.rn}` spans instead of every paragraph |
| `directives.lua` | `latex-div.lua` | Maps `::: note` → law-text box, `::: author` → author block, `::: example` / `::: warning` |
| `table.lua` | `dgruyter-table.lua` | Renamed, De Gruyter references removed |

### Reused As-Is

| Filter | Purpose |
|---|---|
| `xref.lua` | `[Text](#id){.xref}` → `→ Text, § 24 A., S. 21` with `\ref` + `\pageref` |
| `index.lua` | `[Text]{.idx}` → `\index{Text}` with umlaut sort keys |
| `glossary.lua` | `::: {.glossary-entries}` + `[Term]{.gls}` → glossary |
| `split-bib.lua` | Splits refs div into Literatur + Rechtsprechung by `type: legal_case` |
| `nbsp.lua` | Non-breaking spaces: `§ 2` → `§~2`, `Rn. 14` → `Rn.~14` |

## Fonts

De Gruyter Sans and Serif fonts (OFL-licensed, open source) are stored in `pandoc/fonts/`. Source: <https://gitlab.com/degruyter-public/font/de-gruyter-sans_serif>

## Building Locally

Prerequisites: Pandoc ≥ 3.1, TeX Live (full or custom scheme with XeLaTeX), yq.

```bash
make pdf
# Output: output/book.pdf
```

## GitHub Actions

The `.github/workflows/build-pdf.yml` workflow:

1. Installs TeX Live + Pandoc + yq
2. Runs `make pdf`
3. Uploads `output/book.pdf` as artifact

Triggered on push to `main` and on manual dispatch.

## Backmatter Generation

Controlled by `meta.yaml` → `backmatter` (see [meta.yaml](meta-yaml.md)). The Lua filters and build script handle:

- **Bibliography split**: `split-bib.lua` separates Literatur from Rechtsprechung
- **Index**: `index.lua` collects `\index{}` entries, LaTeX generates Stichwortverzeichnis via `makeindex`
- **Glossary**: `glossary.lua` renders the glossary chapter
- **LOT/LOF**: LaTeX `\listoftables` / `\listoffigures` when captions exist
