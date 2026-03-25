# Related Content

## Konzept

Generisches, bidirektionales Cross-Linking zwischen allen Content-Typen.

### Datenquellen

1. **`provisions[]` + `comments_on`** (Books) — Primäre Kommentar↔Gesetz-Beziehung. Automatisch bidirektional.
2. **`related[]`** (Books + Journals) — Generische Verweise auf beliebige Content-Pfade. Bidirektional.

### Reverse-Index

Die Registry baut beim Start einen `relatedIndex: Map<string, RelatedLink[]>`:
- Für jede Seite werden alle verlinkten Inhalte gesammelt
- Bidirektional: wenn A auf B verweist, zeigt B auch A
- Typ-Erkennung über slugMap (book, law, journal)

### Pfad-Format

```
{content-slug}/{rest}
```

Beispiele:
- `dsgvo/5` → Art. 5 DSGVO (Gesetz)
- `oc-dsgvo/art-5` → Kommentar-Abschnitt
- `zfdr/2025/1/aufsatz` → Zeitschriftenartikel

## site.yaml

```yaml
features:
  related_content_display: badge   # "badge" (default) | "sidebar"
```

- `badge` — Kompakte Card unter der Überschrift
- `sidebar` — Rechte Sidebar (Phase 2, ab xl-Breakpoint, Badge-Fallback auf kleineren Screens)

## UX

### Badge (default)

Zeigt alle Related Links unter der `<h1>` mit typ-spezifischen Icons:
- 📖 BookOpen → Kommentare/Bücher
- ⚖️ Scale → Gesetze
- 📄 FileText → Zeitschriftenartikel

Nur sichtbar wenn Links existieren.

## Dateien

- `src/lib/registry.ts` — `RelatedLink` Typ, `relatedIndex` in `ContentRegistry`
- `src/components/related-content.tsx` — Badge-Komponente
- Eingebunden in `book.tsx` und `law.tsx`
