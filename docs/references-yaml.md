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
  author:
    - family: Mustermann
      given: Max
  issued:
    date-parts: [[2024]]
  publisher: "Juristische Verlagsgesellschaft"

- id: musterfrau2023
  type: article-journal
  title: "Die Grundsätze des Art. 5 DSGVO"
  author:
    - family: Musterfrau
      given: Erika
  container-title: "Zeitschrift für Datenschutz"
  issued:
    date-parts: [[2023]]
  page: "42"
  volume: "13"

- id: eugh-schrems-ii
  type: legal_case
  title: "Schrems II"
  authority: "EuGH"
  number: "C-311/18"
  issued:
    date-parts: [[2020, 7, 16]]
  URL: "https://curia.europa.eu/juris/liste.jsf?num=C-311/18"
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

The `@citation_key` is replaced with the formatted citation. In the online version, footnote markers show a hover tooltip with the citation text.

## URL Handling for legal_case

The `URL` field on `legal_case` entries has different behavior per pipeline:

- **Online**: The citation in footnotes is rendered as a clickable link to the URL. In the Rechtsprechungsverzeichnis, entries with URLs are also clickable (opens in new tab).
- **Print (PDF)**: URLs are stripped from `legal_case` entries before citeproc processes them (`strip-urls.lua`). No URLs appear in the printed book.

This allows linking to court databases (CURIA, juris, dejure) online while keeping the print output clean.

## Bibliography Split

References are automatically split into two sections:

- **Literaturverzeichnis**: All types except `legal_case`
- **Rechtsprechungsverzeichnis**: Only `type: legal_case`

Both appear in the online sidebar and in the print PDF backmatter. If no `legal_case` entries are cited, only the Literaturverzeichnis appears.
