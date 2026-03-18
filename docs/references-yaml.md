# references.yaml (CSL-Referenzen)

Die `references.yaml` enthält bibliographische Referenzen im CSL-JSON-Format (als YAML). Sie wird zusammen mit einer CSL-Datei (z.B. `jura.csl`) im Content-Repo abgelegt.

## Konfiguration in meta.yaml

```yaml
csl: "jura.csl"
bibliography: "references.yaml"
```

## Format

Jeder Eintrag ist ein CSL-JSON-Objekt. Die vollständige Spezifikation: [CSL-JSON Schema](https://citeproc-js.readthedocs.io/en/latest/csl-json/markup.html).

## Beispiel

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

## Häufige CSL-Typen

| Typ | Beschreibung |
|---|---|
| `book` | Monographie |
| `article-journal` | Zeitschriftenaufsatz |
| `chapter` | Buchbeitrag / Festschrift |
| `legal_case` | Gerichtsentscheidung |
| `legislation` | Gesetz / Verordnung |
| `thesis` | Dissertation / Habilitation |

## Verwendung im Markdown

```markdown
^[Vgl. @mustermann2024, S. 42 ff.]
```

Der `@citation_key` wird durch die formatierte Zitation ersetzt. Am Dokumentende wird automatisch ein Literaturverzeichnis generiert.

## CSL-Datei

Die CSL-Datei bestimmt das Zitationsformat. Für juristische Literatur empfiehlt sich ein juristisches CSL (z.B. `jura.csl`). CSL-Dateien können aus dem [Zotero Style Repository](https://www.zotero.org/styles) bezogen oder selbst erstellt werden.
