# references.yaml (CSL References)

The `references.yaml` contains bibliographic references in CSL-JSON format (as YAML). It is stored alongside a CSL style file (e.g., `jura.csl`) in the content repo.

## Configuration in meta.yaml

```yaml
csl: "jura.csl"
bibliography: "references.yaml"
```

## Format

Each entry is a CSL-JSON object. Full specification: [CSL-JSON Schema](https://citeproc-js.readthedocs.io/en/latest/csl-json/markup.html).

## Example

```yaml
- id: mustermann2024
  type: book
  title: "Datenschutzrecht: Grundlagen und Praxis"
  title-short: "Datenschutzrecht"
  author:
    - family: Mustermann
      given: Max
  issued:
    date-parts:
      - [2024]
  publisher: "Juristische Verlagsgesellschaft"
  publisher-place: Berlin

- id: musterfrau2023
  type: article-journal
  title: "Die Grundsätze des Art. 5 DSGVO im Lichte der neueren Rechtsprechung"
  title-short: "Grundsätze Art. 5 DSGVO"
  author:
    - family: Musterfrau
      given: Erika
  container-title: "Zeitschrift für Datenschutz"
  container-title-short: "ZfD"
  issued:
    date-parts:
      - [2023]
  page: "42"
  volume: "13"
```

## Common CSL Types

| Type | Description |
|---|---|
| `book` | Monograph |
| `article-journal` | Journal article |
| `chapter` | Book chapter / Festschrift contribution |
| `legal_case` | Court decision |
| `legislation` | Statute / regulation |
| `thesis` | Dissertation / habilitation |

## Usage in Markdown

```markdown
^[See @mustermann2024, S. 42 ff.]
```

The `@citation_key` is replaced with the formatted citation. A bibliography is automatically generated at the end of the document.

## CSL Style File

The CSL file determines the citation format. For legal literature, a legal CSL style (e.g., `jura.csl`) is recommended. CSL files can be obtained from the [Zotero Style Repository](https://www.zotero.org/styles) or created manually.
