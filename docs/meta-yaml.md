# meta.yaml

Die `meta.yaml` liegt im Root-Verzeichnis jedes Book/Journal-Content-Repos und definiert die Metadaten des Werks.

## Schema

```yaml
# Pflichtfelder
slug: "oc-dsgvo"                # URL-Slug, eindeutig
type: "book"                    # book | journal
title: "OpenCommentary DSGVO"   # Vollständiger Titel
lang: "de"                      # Sprache (ISO 639-1)
license: "CC-BY-SA-4.0"        # Lizenz
numbering: "commentary"         # Nummerierungsschema (siehe content-guide.md)
editors:
  - name: "Max Mustermann"
    orcid: "0000-0001-2345-6789"

# Optionale Felder
title_short: "OC-DSGVO"        # Kurztitel (für Zitiervorschlag, Navigation)
comments_on: "dsgvo"            # Slug des kommentierten Gesetzes
csl: "jura.csl"                 # Pfad zur CSL-Datei im Repo
bibliography: "references.yaml" # Pfad zur Referenz-Datei im Repo
translations: ["en"]            # Verfügbare Übersetzungen
```

## Felder

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `slug` | string | ✓ | Eindeutiger URL-Slug des Werks |
| `type` | `book` \| `journal` | ✓ | Typ des Werks |
| `title` | string | ✓ | Vollständiger Titel |
| `title_short` | string | | Kurztitel für Zitiervorschlag und Navigation |
| `lang` | string | ✓ | Sprache (ISO 639-1) |
| `license` | string | ✓ | Lizenz-Identifier |
| `numbering` | string | ✓ | `commentary` \| `textbook` \| `decimal` \| `none` |
| `comments_on` | string | | Slug des kommentierten Gesetzes (nur Kommentare) |
| `csl` | string | | Pfad zur CSL-Datei für Zitationsformatierung |
| `bibliography` | string | | Pfad zur `references.yaml` |
| `editors` | array | ✓ | Liste der Herausgeber (name + orcid) |

## Hinweise

- `title_short` wird bevorzugt in der Navigation und bei Zitiervorschlägen angezeigt. Fallback: `title`.
- `comments_on` verknüpft einen Kommentar mit einem Gesetz. Der Wert muss dem `slug` eines Gesetzes in einer `sync.yaml` entsprechen.
- `csl` und `bibliography` sind relativ zum Repo-Root.
