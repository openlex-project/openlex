# Social Media Sharing & Export

Beide Features sind über `site.yaml` konfigurierbar.

## site.yaml

```yaml
features:
  sharing:
    - copy        # Copy link
    - email       # mailto:
    - x           # X/Twitter
    - linkedin
    - whatsapp

  export:
    formats:
      - md          # Pandoc-style Markdown
      - docx        # Word-Dokument
    require_auth: false   # true = nur eingeloggte User können exportieren
```

Reihenfolge im Array = Reihenfolge im Dropdown. Weglassen = Feature deaktiviert.
Kein `sharing:`/`export:`-Key = Feature nicht angezeigt.
`require_auth` default: `false`. OpenLex-Instanz setzt `true`.

---

## 1. Social Media Sharing

Share-Dropdown neben dem Bookmark-Button.

### Targets
- Copy link (Clipboard API)
- Email (`mailto:`)
- X/Twitter (`https://twitter.com/intent/tweet?url=...&text=...`)
- LinkedIn (`https://www.linkedin.com/sharing/share-offsite/?url=...`)
- WhatsApp (`https://wa.me/?text=...`)

### Design
- Pure URL-Konstruktion, keine SDKs
- Dropdown-Menü, öffnet sich per Klick
- Schließt sich bei Klick außerhalb

### Datei
- `src/components/share-menu.tsx`

---

## 2. Export (Markdown / DOCX)

### Scopes
- **Book**: `page` (einzelne Seite) oder `chapter` (alle Unterseiten konkateniert)
- **Law**: `page` (einzelner Paragraph/Artikel) oder `law` (ganzes Gesetz)
- **Journal**: immer ganzer Artikel (kein Scope-Dropdown nötig)

### Formate
- **Markdown**: Pandoc-Style mit aufgelösten Zitationen (CSL → inline)
- **DOCX**: via [`docx`](https://www.npmjs.com/package/docx) (programmatische DOCX-Generierung — volle Kontrolle über Styles, Fußnoten, Randnummern)
- PDF: Zukunft (nicht in v1)

### API
```
GET /api/export?path=...&format=md|docx&scope=page|chapter
```

### Dateien
- `src/components/export-menu.tsx` — UI-Dropdown neben Share-Menü
- `src/app/api/export/route.ts` — API-Route
- `src/lib/export-md.ts` — Markdown-Export mit aufgelösten Zitationen
- `src/lib/export-docx.ts` — DOCX-Generierung via `docx` (programmatisch, native Fußnoten/Styles)

### Ablauf
1. User klickt Export → wählt Format + Scope
2. Client ruft `/api/export?path=...&format=md&scope=page` auf
3. Server holt Content aus Registry, rendert Markdown/HTML
4. Bei `md`: Zitationen inline auflösen, Frontmatter entfernen
5. Bei `docx`: Markdown AST → `docx` Paragraphen/Styles (native Fußnoten, Heading-Styles, Randnummern als Custom-Style)
6. Response als Download (`Content-Disposition: attachment`)
