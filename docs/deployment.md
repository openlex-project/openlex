# Deployment

OpenLex wird auf Vercel deployt und bezieht Inhalte aus privaten GitHub-Repos.

## Voraussetzungen

- [Vercel](https://vercel.com)-Account
- [GitHub](https://github.com)-Organisation mit Content-Repos
- GitHub Personal Access Token (PAT) mit `repo`-Scope

## Umgebungsvariablen (Vercel)

| Variable | Beschreibung | Beispiel |
|---|---|---|
| `GITHUB_PAT` | GitHub PAT mit Zugriff auf Content-Repos | `ghp_...` |
| `CONTENT_REPOS` | Komma-getrennte Liste der Content-Repos | `org/oc-dsgvo,org/openlex-laws` |
| `NEXTAUTH_SECRET` | Secret für NextAuth.js Session-Verschlüsselung | `openssl rand -base64 32` |
| `OAUTH_GITHUB_ID` | GitHub OAuth App Client ID | |
| `OAUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret | |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (für Lesezeichen) | `https://...upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis Token | |

## Content-Repo einrichten

### Kommentar / Buch

1. Neues privates GitHub-Repo erstellen
2. `meta.yaml` im Root anlegen (siehe [meta-yaml.md](meta-yaml.md))
3. `toc.yaml` im Root anlegen (siehe [toc-yaml.md](toc-yaml.md))
4. Markdown-Dateien in `content/` ablegen (siehe [content-guide.md](content-guide.md))
5. Optional: `jura.csl` + `references.yaml` für Zitationen (siehe [references-yaml.md](references-yaml.md))
6. Repo-Name zu `CONTENT_REPOS` auf Vercel hinzufügen

### Gesetze

1. Privates GitHub-Repo erstellen (oder bestehendes Mono-Repo nutzen)
2. `sync.yaml` im Root anlegen (siehe [sync-yaml.md](sync-yaml.md))
3. Pro Gesetz ein Verzeichnis mit Markdown-Dateien
4. Repo-Name zu `CONTENT_REPOS` auf Vercel hinzufügen

## OAuth einrichten

### GitHub

1. GitHub → Settings → Developer Settings → OAuth Apps → New
2. Homepage URL: `https://your-domain.vercel.app`
3. Callback URL: `https://your-domain.vercel.app/api/auth/callback/github`
4. Client ID → `OAUTH_GITHUB_ID`, Client Secret → `OAUTH_GITHUB_SECRET`

### Google (optional)

1. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client
2. Authorized redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`
3. Client ID → `OAUTH_GOOGLE_ID`, Client Secret → `OAUTH_GOOGLE_SECRET`

## Build-Prozess

```
next build → postbuild (Pagefind-Index generieren) → deploy
```

Der Pagefind-Suchindex wird bei jedem Build aus den Content-Repos generiert. Dafür muss `GITHUB_PAT` und `CONTENT_REPOS` auch zur Build-Zeit verfügbar sein.

## Revalidation

Inhalte werden mit ISR (Incremental Static Regeneration) gecacht: 5 Minuten. Nach einem Push ins Content-Repo wird der Content beim nächsten Request nach Ablauf des Cache automatisch aktualisiert.
