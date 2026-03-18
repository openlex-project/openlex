# toc.yaml

Die `toc.yaml` liegt im Root-Verzeichnis eines Book/Journal-Content-Repos und definiert die Struktur und Reihenfolge der Inhalte.

## Schema

```yaml
contents:
  - file: vorwort.md
    title: Vorwort

  - file: einleitung.md
    title: Einleitung in die DSGVO

  - file: vorbem-1-4.md
    title: "Vorbemerkungen zu Art. 1–4"
    provisions: [1, 2, 3, 4]

  - file: art-5.md
    title: "Art. 5 – Grundsätze für die Verarbeitung"
    provisions: [5]

  - file: exkurs-accountability.md
    title: "Exkurs: Accountability-Prinzip"
```

## Felder pro Eintrag

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `file` | string | ✓ | Dateiname relativ zu `content/` |
| `title` | string | ✓ | Anzeige-Titel (für Navigation, Breadcrumbs) |
| `provisions` | number[] | | Zugeordnete Norm-Nummern (für Cross-Links) |

## Verhalten

- Die Reihenfolge in `contents` bestimmt die Reihenfolge im Inhaltsverzeichnis.
- Der URL-Slug wird aus dem Dateinamen abgeleitet: `art-5.md` → `/book/{werk}/art-5`.
- `provisions` ermöglicht Cross-Links vom Gesetz zum Kommentar: Die Gesetzesseite `/law/dsgvo/5` zeigt Links zu allen Kommentar-Einträgen mit `provisions: [5]`.
- Einträge ohne `provisions` (Vorwort, Exkurse) erscheinen im Inhaltsverzeichnis, aber nicht als Cross-Link vom Gesetz.

## Ohne toc.yaml

Wenn keine `toc.yaml` vorhanden ist, werden alle `.md`-Dateien aus `content/` alphabetisch sortiert als Einträge verwendet. In diesem Fall sind keine `provisions`-Zuordnungen und keine Cross-Links möglich.
