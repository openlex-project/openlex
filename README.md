# OpenLex

Open-Access-Plattform für juristische Fachliteratur – Kommentare, Lehrbücher, Zeitschriften, Gesetze.

Inhalte werden in Pandoc-Flavor Markdown verfasst, in privaten GitHub-Repos verwaltet und über ein Next.js-Frontend auf Vercel gerendert.

**Live:** [openlex.vercel.app](https://openlex.vercel.app)

## Features

- Markdown-basierte Inhalte mit Randnummern, Fußnoten, CSL-Zitationen
- Automatisches Literaturverzeichnis (citeproc-js)
- Konfigurierbares Nummerierungssystem
- Cross-Links zwischen Gesetzen und Kommentaren
- Volltextsuche (Pagefind, client-seitig)
- Dark Mode (System-Präferenz)
- GitHub/Google OAuth Login
- Feedback-System (GitHub Issues)
- Branch-basierte Editionen
- i18n (de/en)

## Dokumentation

- [Content-Guide](docs/content-guide.md) – Markdown-Syntax für Autoren
- [meta.yaml](docs/meta-yaml.md) – Metadaten für Bücher/Kommentare
- [toc.yaml](docs/toc-yaml.md) – Inhaltsverzeichnis
- [sync.yaml](docs/sync-yaml.md) – Gesetze-Konfiguration
- [references.yaml](docs/references-yaml.md) – CSL-Referenzen
- [Deployment](docs/deployment.md) – Vercel, Env-Vars, Setup

## Quickstart

```bash
pnpm install
pnpm dev
```

Für den Zugriff auf Content-Repos: `.env.local` mit `GITHUB_PAT` und `CONTENT_REPOS` anlegen. Details siehe [Deployment](docs/deployment.md).

## Lizenz

MIT
