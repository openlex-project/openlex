# Steering – OpenLex

## Projektkontext

OpenLex ist eine Open-Access-Plattform für juristische Fachliteratur (Kommentare, Zeitschriften, Gesetze). Inhalte werden in Markdown verfasst, in privaten GitHub-Repos versioniert und über ein Next.js-Frontend ausgeliefert. Zielgruppe: Jurist:innen, Studierende, Wissenschaft.

- **GitHub-Organisation:** [openlex-project](https://github.com/openlex-project)
- **Portal-Name:** OpenLex

## Tech-Stack (verbindlich)

- **Framework:** Next.js 16 (App Router) mit TypeScript
- **Hosting:** Vercel (Hobby-Tarif, Serverless Functions, Edge)
- **Styling:** Tailwind CSS v4 (CSS-first Config, kein `tailwind.config.js`)
- **Auth:** NextAuth.js – ausschließlich Social Login (GitHub, Google, Apple)
- **Datenbank:** Upstash Redis (via Vercel Marketplace) – nur für Nutzerpräferenzen, Lesezeichen, Verlauf
- **Content-Source:** Private GitHub-Repos via PAT (serverseitig, niemals Client-seitig)
- **Content-Format:** Markdown (Pandoc-Flavor) + YAML-Frontmatter
- **Testing:** Vitest
- **Paketmanager:** pnpm
- **Linting:** ESLint 10 (Flat Config), kein Prettier
- **Suche:** Typesense (open-source, facettiert, typo-tolerant)
- **Monorepo:** Nein – Single Next.js Repo. Content-Repos sind separat auf GitHub.

## Architektur-Regeln

- App Router verwenden (kein Pages Router).
- Server Components als Default; Client Components nur wo interaktiv nötig (Zitier-Bar, Fußnoten-Drawer, Feedback-Markierung).
- Route Groups: `(auth)` für Login/Callback, `(reader)` für Lese-UI – eigene Layouts pro Gruppe.
- GitHub PAT darf ausschließlich in Server-Side-Logik (API Routes, Server Actions) verwendet werden.
- Alle externen Daten-Fetches serverseitig; kein Leaken von Tokens an den Client.
- Caching-Strategie: ISR / On-Demand Revalidation bei Content-Updates (GitHub Webhook → Vercel).

## Code-Konventionen

- Sprache im Code: **Englisch** (Variablen, Funktionen, Kommentare).
- Sprache in UI-Texten und Docs: **Deutsch**.
- Dateinamen: kebab-case (`citation-bar.tsx`, `footnote-drawer.tsx`).
- Komponenten: PascalCase (`CitationBar`, `FootnoteDrawer`).
- Keine `any`-Types; strikte TypeScript-Konfiguration.
- Imports: Pfad-Aliase mit `@/` für `src/`.

## Deployment-Konventionen

- `main` = Production (auto-deploy auf Vercel)
- `develop` = Preview-Deployments
- Feature Branches: `feat/beschreibung`, Bugfixes: `fix/beschreibung`
- Commit-Messages: Conventional Commits (`feat:`, `fix:`, `docs:`)
- Env-Vars: `GITHUB_PAT`, `CONTENT_REPOS` (kommaseparierte Repo-Pfade), `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## Content-Repo-Discovery

- Portal ist open source; die Konfiguration erfolgt vollständig über Env Vars auf Vercel.
- `CONTENT_REPOS` enthält nur die GitHub-Repo-Pfade (z.B. `"openlex-project/oc-dsgvo,openlex-project/oc-urhg,openlex-project/openlex-laws"`).
- Jedes Content-Repo beschreibt sich selbst über eine `meta.yaml` (Slug, Typ, Titel, Abkürzung, `unit_type`, etc.).
- Bei `next build` fetcht die App die `meta.yaml` aus jedem Repo und baut eine interne Registry. Repos sind Single Source of Truth.

## Markdown-Pipeline (Web-Rendering)

- **Libraries:** unified / remark / rehype (Industriestandard für JS-basierte Markdown→HTML-Verarbeitung)
- Pandoc wird NICHT für Web-Rendering verwendet – nur für PDF-Export.

## URL-Schema

- URL-Schema für Kommentare/Bücher: `/book/{werk}/{nr}#rn-{n}` (aktuell), `/book/{werk}/{n}ed/{nr}#rn-{n}` (explizite Auflage)
- Editionen mappen auf Git-Branches: `main` = aktuelle Auflage, `{n}ed` = archivierte Auflage.
- Edition von `main` wird abgeleitet: Anzahl `*ed`-Branches + 1. Kein `edition`-Feld in `meta.yaml`.
- Workflow: Neue Auflage → aktuellen `main` als `{n}ed` branchen (einfrieren), `main` weiterarbeiten.
- Zugriff auf `/{n}ed/` ohne existierenden Branch → Redirect auf aktuelle Auflage.
- URL-Schema für Gesetze: `/law/{gesetz}/{nr}` (aktuell), `/law/{gesetz}/@{datum}/{nr}` (historische Fassung)
- URL-Schema für Zeitschriften: `/journal/{zeitschrift}/{jahr}/{seite}`
- Nur die Nummer in der URL – ob Art., § oder Kapitel bestimmt `meta.yaml` (`unit_type: "article"`, `"section"`, `"chapter"`)
- Fragmente für Untergliederung: `#rn-1` (Kommentare), `#abs-1`, `#abs-1-s-1`, `#abs-1-lit-a` (Gesetze)

Beispiele:
```
/law/dsgvo/5#abs-1
/book/oc-dsgvo/5#rn-3
/book/oc-urhg/15#rn-7
/book/schmieder-urheberrecht/3
/journal/zfkir/2025/42
```

## Gesetze

- Alle Gesetze in einem einzigen Repo (`openlex-laws`), Kommentare bleiben je ein eigenes Repo.
- Kuratierte Auswahl: Welche Gesetze synchronisiert werden, wird in `sync.yaml` festgelegt.
- Quellen: GII (XML) für deutsches Bundesrecht, eur-lex (API) für EU-Recht.
- Automatischer Sync-Job committet Änderungen ins Repo.
- Versionierung über Git-Tags: Bei Gesetzesänderung wird getaggt (`law/urhg/2024-11-15`). Die Web-App löst `@{datum}` auf den jüngsten Tag vor dem angefragten Datum auf und fetcht die Datei an diesem Ref via GitHub API.

### Sync-Job (GitHub Actions)

- Wöchentlicher Cron via GitHub Actions im `openlex-laws` Repo.
- `sync.yaml` steuert, welche Gesetze aus welcher Quelle synchronisiert werden.
- **GII (deutsches Bundesrecht):** XML von `gesetze-im-internet.de/{slug}/xml.zip` fetchen. Änderungsdatum aus `<standangabe>` → `<standkommentar>` parsen (Format: `"Zuletzt geändert durch Art. X G v. DD.MM.YYYY"`).
- **eur-lex (EU-Recht):** API-Call mit CELEX-Nummer, konsolidierte Fassung abrufen.
- XML → Markdown-Konvertierung via Python-Script (bessere XML-Libraries).
- Diff gegen bestehende Dateien. Bei Änderungen: Commit + Git-Tag (`law/{gesetz}/{YYYY-MM-DD}`, Datum aus `standkommentar`).
- Fehlerbehandlung: Bei Nicht-Erreichbarkeit stiller Retry beim nächsten Lauf.

### Repo-Struktur

```
openlex-laws/
  sync.yaml              # Zentrale Config: welche Gesetze, Quelle, Metadaten
  dsgvo/
    5.md
    ...
  urhg/
    15.md
    ...
```

`sync.yaml` enthält alle Metadaten pro Gesetz (slug, source, title, abbreviation, unit_type). Keine separate `meta.yaml` pro Gesetz – der Sync-Job generiert die Ordnerstruktur aus `sync.yaml`.

### Gesetzesdateien
- Pures Markdown ohne Frontmatter – nur der nackte Gesetzestext.
- Alle Metadaten sind abgeleitet: Nummer aus Dateiname, Titel aus `toc.yaml`, Präfix (§/Art.) aus `unit_type` in `sync.yaml`.

### Gliederung (toc.yaml)
- Pro Gesetz generiert der Sync-Job eine `toc.yaml` aus der XML-Struktur (`<gliederungseinheit>`).
- Bildet die Hierarchie ab: Teil → Abschnitt → Unterabschnitt → §§/Artikel.
- Wird für Sidebar-Navigation, Breadcrumbs und Inhaltsverzeichnis genutzt.
- URLs bleiben flach (`/law/urhg/15`), keine Gliederungsebenen in der URL.

## Content-Format (Pandoc-Markdown)

Inhalte werden in Pandoc-Flavor Markdown verfasst. Der Parser muss folgende Konstrukte unterstützen.

## Dateistruktur (Content-Repos)

- Jede Datei beginnt mit einem `#`-Heading (oberste Ebene). Dateien werden in Dateinamen-Reihenfolge zusammengesetzt.
- `#` = Datei-Ebene, `##`–`#####` = Gliederung innerhalb (auto-nummeriert).

### Dateinamen-Schemata

| Typ | Schema | Beispiele |
|---|---|---|
| Commentary | `{nr}.md` oder `{nr}-XX.md` | `5.md`, `312d.md`, `312d-01.md`, `312d-02.md` |
| Textbook | `XX-YY.md` | `10-01.md`, `30-05.md` |
| Kapitel-Titel | `XX-00.md` | `10-00.md` |
| Wiederholungsfragen | `XX-wiederholungsfragen.md` | `10-wiederholungsfragen.md` |
| Vorwort, Hinweise | `00-vorwort.md`, `01-hinweise.md` | |
| Verzeichnisse | `99-verzeichnisse.md` | |
| Stichwortverzeichnis | `99-index.md` | |
| Glossar | `99-glossar.md` | |

### Unnumbered / Unlisted

- `{.unnumbered}` – keine Auto-Nummerierung, aber im TOC sichtbar (z.B. Literaturverzeichnis, Stichwortverzeichnis, Abbildungsverzeichnis).
- `{.unnumbered .unlisted}` – keine Nummer, nicht im TOC (nur für Sonderfälle).

### Auto-generierte Verzeichnisse

- **Literaturverzeichnis** – aus citeproc/Bibliographie, im TOC.
- **Rechtsprechungsverzeichnis** – aus Referenzen vom Typ `legal_case`, im TOC.
- **Stichwortverzeichnis** – aus `[]{.idx}`-Einträgen, im TOC.
- **Abbildungs-/Tabellenverzeichnis** – aus Captions, im TOC.
- **Glossar** – Definition Lists in `::: glossary`-Div.

### Heading-Anker & Querverweise
- `## Überschrift {#anker-id}` – stabile IDs für Headings
- `[Linktext](#anker-id){.xref}` – interne Querverweise

### Autorenangabe
- `::: author` / `:::` – Kennzeichnung des Autors eines Abschnitts mit Name und ORCID.
- Gilt für alle darunter liegenden Headings, bis ein neuer `::: author`-Block einen anderen Autor setzt (Vererbungsprinzip).
```markdown
::: author
name: Fabian Schmieder
orcid: 0000-0000-0000-0000
:::
```

### Fußnoten & Literatur
- `^[Fußnotentext]` – Inline-Fußnoten
- `@citation_key` – Pandoc-citeproc-Referenzen (z.B. `@Hoeren_Pinelli_KIR_2026_5, 7.`)
- Bibliographie in YAML-Format, CSL für Zitationsstil

### Indexeinträge
- `[]{.idx entry="Begriff"}` – Indexeintrag
- `[]{.idx entry="Oberbegriff!Unterbegriff"}` – verschachtelter Indexeintrag

### Custom Divs (Fenced Divs)
- Pandoc Fenced Divs (`::: name` / `:::`) werden als generisches Feature unterstützt. LexOpen definiert keine festen Div-Typen.
- **Web-Rendering:** Jedes Content-Repo liefert eine `divs.yaml`, die Div-Namen auf LexOpen-Basis-Komponenten + Variante mappt. Kein Custom CSS pro Repo – Styling liegt zentral in LexOpen.
- **PDF-Export:** Repos liefern eigene Lua-Filter für die Pandoc-Pipeline.

#### Basis-Komponenten für Divs

| Komponente | Varianten | Zweck |
|---|---|---|
| `Callout` | `note`, `warning`, `review`, `law` | Hervorgehobene Inhaltsboxen |

Beispiel `divs.yaml` im Content-Repo:
```yaml
note:
  component: "Callout"
  variant: "note"
law:
  component: "Callout"
  variant: "law"
review:
  component: "Callout"
  variant: "review"
```

Neue Varianten werden bei Bedarf zentral in LexOpen ergänzt.

### Randnummern
- Explizite Start-Marker mit Auto-Nummerierung.
- `[]{.rn}` am Anfang eines Absatzes markiert den Beginn einer neuen Randnummer.
- Alles bis zum nächsten `[]{.rn}`-Marker gehört zur selben Rn. (auch Folgeabsätze, Listen, Tabellen).
- Nummerierung ist automatisch und sequentiell pro Artikel/Paragraph – keine manuellen Nummern.
- Jede Rn. erhält eine stabile, deterministische ID als Anker-Link (`#rn-1`, `#rn-2`, ...).

## Zitier-Bar

- CSL-basiert: Jedes Content-Repo liefert eine CSL-Datei (z.B. `jura.csl`) für den Zitationsstil.
- Die Zitier-Bar generiert dynamisch das korrekte Zitat der aktuellen Stelle (Autor, Werk, Art., Rn.).
- Dieselbe CSL-Logik wie in den Fußnoten, nur auf die aktuelle Position bezogen.

## Barrierefreiheit

- WCAG 2.1 AA als Mindeststandard.
- Semantisches HTML, ARIA-Attribute, Tastaturnavigation, ausreichende Kontraste.

## Internationalisierung (i18n)

- Mehrsprachig von Anfang an. Deutsch als Primärsprache.
- Übersetzungen leben im selben Repo unter Sprachordnern (`content/de/`, `content/en/`).
- `meta.yaml` listet verfügbare Sprachen: `lang: "de"`, `translations: ["en"]`.
- URL-Prefix für Übersetzungen: `/en/book/oc-dsgvo/5#rn-3`, `/fr/law/dsgvo/5#abs-1`.
- Kein Prefix = Deutsch (kanonische URL). `/de/...` → Redirect auf `/...`.
- Übersetzung via KI – konkreter Mechanismus wird später definiert.

## KV-Datenmodell (Vercel KV)

| Key | Typ | Beschreibung |
|---|---|---|
| `user:settings:[ID]` | JSON | Privacy-Optionen (History-Dauer, Status) |
| `user:bookmarks:[ID]` | List | Objekte mit URLs und Titeln |
| `user:history:[ID]` | List | Besuchte URLs mit Zeitstempel (Pruning-Logik) |

## Versionen

- **Next.js:** 15
- **Node.js:** 22 LTS

## Content-Repo-Schema

### Book-Repo (Kommentare, Lehrbücher)

```
oc-dsgvo/
  meta.yaml              # Pflicht: Selbstbeschreibung
  jura.csl               # Pflicht: Zitationsstil
  references.yaml        # Pflicht: Bibliographie
  divs.yaml              # Optional: Custom-Div-Mapping
  content/
    5.md                 # Art. 5
    6.md                 # Art. 6
    312d.md              # § 312d (bei BGB-Kommentar)
    ...
```

Textbook-Variante:
```
schmieder-urheberrecht/
  meta.yaml
  jura.csl
  references.yaml
  content/
    00-vorwort.md
    10-00.md             # Kapitel-Titel
    10-01.md             # Abschnitt
    10-wiederholungsfragen.md
    99-verzeichnisse.md
    99-index.md
    ...
```

`meta.yaml` (Pflichtfelder):
```yaml
slug: "oc-dsgvo"
type: "book"                    # book | journal
title: "OpenCommentary DSGVO"
abbreviation: "OC-DSGVO"
unit_type: "article"            # article | section | chapter
lang: "de"
license: "CC-BY-SA-4.0"
numbering: "commentary"         # commentary | textbook | decimal | none
csl: "jura.csl"
bibliography: "references.yaml"
comments_on: "dsgvo"            # Optional: Slug des kommentierten Gesetzes
translations: ["en"]            # Optional: verfügbare Übersetzungen
editors:
  - name: "Max Mustermann"
    orcid: "0000-0000-0000-0000"
```

### Law-Collection-Repo

```
openlex-laws/
  sync.yaml              # Zentrale Config: Gesetze, Quellen, Metadaten
  dsgvo/
    5.md
    ...
  urhg/
    15.md
    ...
```

### Journal-Repo

```
zfkir/
  meta.yaml              # type: "journal"
  jura.csl
  references.yaml
  2025/
    01/                  # Heft 1
      meta.yaml          # Heft-Metadaten
      mustermann-ki.md   # Einzelbeitrag
      ...
```

## Domänen-Glossar

| Begriff | Bedeutung | Englisch im Code |
|---|---|---|
| Randnummer (Rn.) | Kleinste zitierfähige Einheit eines Kommentars | `marginNumber` / `mn` |
| Fundstelle | Exakte Zitatangabe (Autor, Werk, §, Rn.) | `citation` |
| Kommentar | Juristisches Erläuterungswerk zu einem Gesetz | `commentary` |
| Auflage | Edition eines Werks | `edition` |
| Gesetzesstand | Zeitliche Fassung eines Gesetzes | `legalVersion` |

## Verzeichnisstruktur (Ziel)

```
src/
  app/
    (auth)/          # Login, Callback-Routes
    (reader)/        # Lese-UI: Kommentare, Artikel
    api/             # API-Routes (Feedback → GitHub Issues, KV-Zugriff)
    dashboard/       # Lesezeichen, Verlauf
  components/
    citation-bar.tsx
    footnote-drawer.tsx
    margin-number.tsx
  lib/
    github.ts        # GitHub-API-Client (serverseitig)
    markdown.ts      # Pandoc-Markdown → HTML-Pipeline
    kv.ts            # Vercel KV Helpers
    auth.ts          # NextAuth-Konfiguration
  types/
    content.ts       # Typen für Kommentar, Rn., Metadaten
```

## Schlüssel-Invarianten

1. **Stabile URLs:** Einmal vergebene Slugs für Paragraphen/Artikel ändern sich nie.
2. **Stabile Randnummern-IDs:** Jede Rn. bekommt eine deterministische ID, die als Anker-Link dient.
3. **Zitierfähigkeit:** Jede Rn. muss jederzeit ein maschinenlesbares, korrektes Zitat erzeugen können.
4. **Privacy by Default:** Verlauf ist opt-in-konfigurierbar; Löschung sofort technisch wirksam.
5. **DSGVO-Konformität:** Minimale Datenspeicherung; kein Tracking über KV-Daten hinaus.

## Gliederung (Book-Repos)

- `toc.yaml` wird bei `next build` automatisch aus den Markdown-Headings generiert.
- Überschriften werden automatisch nummeriert. Der Autor schreibt keine Nummern – nur den Titel.
- Default-Nummerierungsschema (juristisch):
  - `##` → A., B., C., ...
  - `###` → I., II., III., ...
  - `####` → 1., 2., 3., ...
  - `#####` → a), b), c), ...
- Schema kann per `meta.yaml` pro Werk überschrieben werden: `numbering: "commentary"`.
- Manuelle Nummerierung möglich via Pandoc-Attribut: `## Besonderer Abschnitt {number="X."}` überschreibt die Auto-Nummerierung für dieses Heading.
- Reset-Verhalten pro Ebene konfigurierbar in `meta.yaml`:

```yaml
numbering: "textbook"
numbering_reset:
  "##": false     # Kapitel werden NICHT bei neuem Teil (#) zurückgesetzt
  "###": true     # Abschnitte werden bei neuem Kapitel (##) zurückgesetzt (default)
  "####": true
  "#####": true
```

- Default: Jede Ebene wird bei neuem Parent zurückgesetzt (`true`). `false` = fortlaufend über Parents hinweg.

### Nummerierungsformat

Jede Ebene wird über ein Format-String definiert, der Label, Zählertyp und Klammern/Punkte steuert:

```yaml
numbering_format:
  "#":     "Teil {1}:"      # → Teil 1:, Teil 2:
  "##":    "§ {1}"           # → § 1, § 2
  "###":   "{A}."            # → A., B., C.
  "####":  "{I}."            # → I., II., III.
  "#####": "{1}."            # → 1., 2., 3.
```

Verfügbare Zählertypen:
- `{1}` → 1, 2, 3, ... (arabisch)
- `{A}` → A, B, C, ... (Großbuchstaben)
- `{a}` → a, b, c, ... (Kleinbuchstaben)
- `{I}` → I, II, III, ... (römisch groß)
- `{i}` → i, ii, iii, ... (römisch klein)

Beliebiger Text und Klammern um den Zähler herum:
- `"({a})"` → (a), (b), (c)
- `"{A})"` → A), B), C)
- `"Teil {1}:"` → Teil 1:, Teil 2:
- `"{1}."` → 1., 2., 3.

- Vordefinierte Schemata:

| Schema | `##` | `###` | `####` | `#####` |
|---|---|---|---|---|
| `commentary` (default) | A., B. | I., II. | 1., 2. | a), b) |
| `textbook` | § 1, § 2 | A., B. | I., II. | 1., 2. |
| `decimal` | 1., 2. | 1.1, 1.2 | 1.1.1 | 1.1.1.1 |
| `none` | keine Nummerierung ||||
- `#` ist reserviert für die oberste Gliederungsebene (Teil / Artikel-Kommentierung).
- Wird für Sidebar-Navigation, Breadcrumbs und Inhaltsverzeichnis genutzt.

## Suche

- Volltext-Suche über den gesamten Content (Gesetze, Kommentare, Bücher, Zeitschriften).
- Facettierte Suche: Filtern nach Werk, Typ (law/book/journal), Autor, Gesetz.
- Typo-Toleranz und Relevanz-Ranking.
- Technologie: Typesense (open-source, Cloud-Tier verfügbar, schnell, facettiert).
- Suchindex wird bei Content-Updates (Revalidation) aktualisiert.
- Suche ist auch für nicht-eingeloggte User verfügbar.

## Landing Page

- Kein Login erforderlich zum Lesen – alle Inhalte sind öffentlich zugänglich.
- Startseite zeigt:
  - Prominente Suchleiste (Volltext über gesamten Bestand)
  - Katalog aller Gesetze
  - Katalog aller Kommentare / Bücher / Zeitschriften

## Lizenz

- Standard-Lizenz: CC-BY-SA-4.0 (konfigurierbar pro Werk via `meta.yaml` `license`-Feld).
- HTML `<head>`: `<link rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/">` + Schema.org `license`-Property.
- Footer: CC-Badge mit Lizenztext und Link.
- Jede Seite trägt die Lizenz des jeweiligen Werks.

## Verlinkung Gesetz ↔ Kommentar

- Automatische Erkennung: Wenn ein Kommentar (z.B. `oc-dsgvo`) und ein Gesetz (z.B. `dsgvo`) denselben Slug-Bezug haben, werden sie verlinkt.
- Auf Gesetzesseiten (`/law/dsgvo/5`): Link zu verfügbaren Kommentaren (`/book/oc-dsgvo/5`).
- Auf Kommentarseiten (`/book/oc-dsgvo/5`): Link zum kommentierten Gesetzestext (`/law/dsgvo/5`).
- Mapping über ein `comments_on`-Feld in der `meta.yaml` des Book-Repos:
  ```yaml
  comments_on: "dsgvo"    # Slug des kommentierten Gesetzes
  ```

## Feedback-System

- Nutzer muss eingeloggt sein (kein anonymes Feedback).
- Nutzer markiert Text → Feedback-Formular mit:
  - Markierter Text (automatisch)
  - Fundstelle: URL + Rn./Abs. (automatisch)
  - Kategorie: Fehler, Ergänzung, Frage
  - Freitext-Kommentar
- API-Route erstellt GitHub Issue im privaten Content-Repo via PAT.
- Automatische Labels: `feedback`, Artikel/Paragraph (`art-5`, `s-15`), Rn. (`rn-42`), Kategorie.
- User-Zuordnung über versteckten Identifier im Issue-Body: `<!-- lexopen-user: {user-id} -->`.
- **Dashboard-Integration:** Eigene Feedback-Issues im Profil anzeigen (Status: offen/geschlossen/kommentiert). Abfrage serverseitig per PAT, gefiltert auf eigene Issues.
- **Feedback-Rückkanal:** Autor-Kommentare und Statusänderungen am Issue werden im Dashboard des Users sichtbar.

## Workflow-Hinweise

- Content-Updates: Autor pusht nach GitHub → Webhook triggert Revalidation auf Vercel.
- Feedback: Nutzer markiert Text → API-Route erstellt GitHub Issue im Content-Repo.
- History-Pruning: Bei Seitenaufruf werden abgelaufene Einträge aus `user:history` entfernt.

## Was Kiro NICHT tun soll

- Keine Passwort-/E-Mail-basierte Auth implementieren.
- Keine direkte Datenbankanbindung (SQL/Postgres) – nur Vercel KV.
- Keinen Pages Router verwenden.
- Keine Client-seitigen GitHub-API-Calls.
- Kein `tailwind.config.js` erzeugen (Tailwind v4 nutzt CSS-first Config).
- Kein Monorepo-Setup (Turborepo etc.).
