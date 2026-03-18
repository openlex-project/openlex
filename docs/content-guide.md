# Content-Guide für Autoren

Dieses Dokument beschreibt die Markdown-Syntax und Konventionen für Inhalte auf OpenLex.

## Dateiformat

Alle Inhalte werden in **Pandoc-Flavor Markdown** verfasst und im Verzeichnis `content/` des jeweiligen Content-Repos abgelegt. Der Dateiname (ohne `.md`) wird zum URL-Slug: `content/art-5.md` → `/book/{werk}/art-5`.

## Randnummern

Randnummern werden mit `[]{.rn}` gesetzt. Sie werden automatisch durchnummeriert.

```markdown
[]{.rn} Dies ist der erste Absatz mit Randnummer 1.

[]{.rn} Dies ist der zweite Absatz mit Randnummer 2.
```

## Fußnoten (Inline)

Inline-Fußnoten mit `^[Text]`:

```markdown
Dies ist ein Satz mit einer Fußnote.^[Vgl. Mustermann, Datenschutzrecht, S. 42.]
```

## Zitationen (CSL)

Referenzen werden mit `@citation_key` aufgelöst. Die Keys müssen in der `references.yaml` des Repos definiert sein.

```markdown
^[Vgl. @mustermann2024, S. 42 ff.]
^[@musterfrau2023, S. 45.]
```

Locator (Seitenangaben) werden nach dem Key mit Komma getrennt angegeben. Am Ende des Dokuments wird automatisch ein Literaturverzeichnis generiert.

## Autoren-Block

Der Autoren-Block wird als Fenced Div am Anfang des Dokuments gesetzt:

```markdown
::: author
Max Mustermann
0000-0001-2345-6789
:::
```

Zeile 1: Name, Zeile 2: ORCID (optional). Der Name wird als Link zu orcid.org gerendert.

## Fenced Divs (Direktiven)

Pandoc-style Fenced Divs für strukturierte Blöcke:

```markdown
::: note
Dies ist ein Hinweis.
:::

::: example
Dies ist ein Beispiel.
:::

::: warning
Dies ist eine Warnung.
:::
```

## Überschriften-Nummerierung

Die Nummerierung wird über das `numbering`-Feld in der `meta.yaml` gesteuert. Verfügbare Schemata:

| Schema | Beschreibung |
|---|---|
| `commentary` | A. / I. / 1. / a) |
| `textbook` | § 1 / A. / I. / 1. |
| `decimal` | 1. / 1.1 / 1.1.1 |
| `none` | Keine Nummerierung |

### Manuelle Nummerierung

```markdown
## Überschrift {number="III."}
```

### Unnummerierte Überschriften

```markdown
## Einleitung {.unnumbered}
```

## Pandoc-Attribute

Pandoc-Attribute in geschweiften Klammern werden automatisch entfernt und nicht gerendert:

```markdown
## Überschrift {#custom-id .class key="value"}
```
