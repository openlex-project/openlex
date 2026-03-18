# sync.yaml

Die `sync.yaml` liegt im Root-Verzeichnis eines Gesetze-Repos (z.B. `openlex-laws`) und definiert alle enthaltenen Gesetze.

## Schema

```yaml
laws:
  dsgvo:
    title: "Datenschutz-Grundverordnung"
    title_short: "DSGVO"
    unit_type: "article"
    lang: "de"
    source: "gii"
    gii_slug: "dsgvo"

  urhg:
    title: "Gesetz über Urheberrecht und verwandte Schutzrechte"
    title_short: "UrhG"
    unit_type: "section"
    lang: "de"
    source: "gii"
    gii_slug: "urhg"
```

## Felder pro Gesetz

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| (Key) | string | ✓ | Slug des Gesetzes (= Verzeichnisname im Repo) |
| `title` | string | ✓ | Vollständiger Titel |
| `title_short` | string | | Kurztitel / Abkürzung (z.B. „DSGVO") |
| `unit_type` | `article` \| `section` | ✓ | Gliederungseinheit: `article` → „Art.", `section` → „§" |
| `lang` | string | ✓ | Sprache (ISO 639-1) |
| `source` | string | | Quelle für Sync (z.B. `gii` für gesetze-im-internet.de) |
| `gii_slug` | string | | Slug auf gesetze-im-internet.de |

## Verzeichnisstruktur

Jedes Gesetz hat ein eigenes Verzeichnis im Repo, benannt nach dem Slug:

```
openlex-laws/
  sync.yaml
  dsgvo/
    1.md
    2.md
    5.md
    ...
  urhg/
    1.md
    15.md
    ...
```

Die Markdown-Dateien enthalten den reinen Gesetzestext ohne Frontmatter.

## Hinweise

- `title_short` wird in der Navigation und bei Cross-Links bevorzugt angezeigt.
- `unit_type` bestimmt das Präfix auf der Gesetzesseite: „Art. 5 DSGVO" vs. „§ 15 UrhG".
- Ein Gesetze-Repo kann mehrere Gesetze enthalten (Mono-Repo).
