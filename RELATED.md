# Related Content / Kommentierungen

## Konzept

Auf Gesetzesseiten werden verknüpfte Kommentierungen angezeigt.
Datenquelle: `provisions[]` in toc.yaml + `comments_on` in meta.yaml (existiert bereits).

## site.yaml

```yaml
commentary_display: badge   # "badge" (default) | "sidebar"
```

- `badge` — Kompakte Card unter der Überschrift (gut für wenig Content)
- `sidebar` — Rechte Sidebar à la Beck (sticky, ab xl-Breakpoint; fällt auf kleineren Screens auf Badge zurück)
- Nicht gesetzt → `badge`

## UX

### Badge (default)

```
§ 5 DSGVO Grundsätze  🔖 📤 ⬇️
┌─ Kommentierungen ──────────────────┐
│ 📖 Online-Kommentar DSGVO → Art. 5 │
│ 📖 Weiterer Kommentar → Art. 5     │
└────────────────────────────────────┘

Gesetzestext...
```

- Unter `<h1>`, vor dem Gesetzestext
- Nur sichtbar wenn Matches existieren
- Skaliert: 1 Kommentar = 1 Zeile, n Kommentare = n Zeilen

### Sidebar (Phase 2)

```
┌──────────────────────┬──────────────────┐
│ § 5 Grundsätze  🔖   │ Kommentierungen  │
│                      │                  │
│ Gesetzestext...      │ 📖 OC-DSGVO      │
│                      │ 📖 Kommentar B   │
│                      │ 📖 Kommentar C   │
└──────────────────────┴──────────────────┘
```

- Sticky rechte Spalte ab `xl` (1280px+)
- Unter `xl`: automatisch Badge-Fallback
- Gleiche Datenquelle, nur Layout-Wechsel

## Dateien

- `src/components/commentary-links.tsx` — Badge + Sidebar Variante, liest `commentary_display` aus site.yaml
- Eingebunden in `law.tsx` (ersetzt die bestehenden inline Commentary-Links in der prev/next-Nav)
