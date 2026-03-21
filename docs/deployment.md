# Deployment

OpenLex is deployed on Vercel and fetches content from private GitHub repos.

## Prerequisites

- [Vercel](https://vercel.com) account
- [GitHub](https://github.com) organization with content repos
- GitHub Personal Access Token (PAT) with `repo` scope

## Environment Variables (Vercel)

| Variable | Description | Example |
|---|---|---|
| `GITHUB_PAT` | GitHub PAT with access to content repos | `ghp_...` |
| `CONTENT_REPOS` | Comma-separated list of content repos | `org/oc-dsgvo,org/openlex-laws` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js session encryption | `openssl rand -base64 32` |
| `OAUTH_GITHUB_ID` | GitHub OAuth App Client ID | |
| `OAUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret | |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (for bookmarks) | `https://...upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | |

## Setting Up a Content Repo

### Commentary / Book

1. Create a new private GitHub repo
2. Add `meta.yaml` in the root (see [meta-yaml.md](meta-yaml.md))
3. Add `toc.yaml` in the root (see [toc-yaml.md](toc-yaml.md))
4. Place Markdown files in `content/` (see [content-guide.md](content-guide.md))
5. Optional: add `jura.csl` + `references.yaml` for citations (see [references-yaml.md](references-yaml.md))
6. Add repo name to `CONTENT_REPOS` on Vercel

### Laws

1. Create a private GitHub repo (or use an existing mono-repo)
2. Add `sync.yaml` in the root (see [sync-yaml.md](sync-yaml.md))
3. Create a directory per law with Markdown files
4. Add repo name to `CONTENT_REPOS` on Vercel

## OAuth Setup

### GitHub

1. GitHub → Settings → Developer Settings → OAuth Apps → New
2. Homepage URL: `https://your-domain.vercel.app`
3. Callback URL: `https://your-domain.vercel.app/api/auth/callback/github`
4. Client ID → `OAUTH_GITHUB_ID`, Client Secret → `OAUTH_GITHUB_SECRET`

### Google (optional)

1. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client
2. Authorized redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`
3. Client ID → `OAUTH_GOOGLE_ID`, Client Secret → `OAUTH_GOOGLE_SECRET`

## Build Process

```
build-search-index → next build → deploy
```

The Pagefind search index is generated *before* `next build` so the static files are available in `public/pagefind/`. `GITHUB_PAT` and `CONTENT_REPOS` must be available at build time. The index covers books, laws, and journals.

## Revalidation

Content is cached with ISR (Incremental Static Regeneration): 5 minutes. After a push to a content repo, content is automatically refreshed on the next request after cache expiry.
