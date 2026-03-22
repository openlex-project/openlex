# Deployment

OpenLex is deployed on Vercel and fetches content from private GitHub repos.

## Prerequisites

- [Vercel](https://vercel.com) account
- [GitHub](https://github.com) organization with content repos
- GitHub Personal Access Token (PAT) with `repo` scope

## Configuration

### site.yaml (Site Identity)

Edit `site.yaml` in the project root to configure name, tagline, branding, and content categories. See [site-yaml.md](site-yaml.md).

### Environment Variables (Vercel)

| Variable | Description | Example |
|---|---|---|
| `GITHUB_PAT` | GitHub PAT with access to content repos | `ghp_...` |
| `CONTENT_REPOS` | Comma-separated list of content repos | `org/oc-dsgvo,org/openlex-laws` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js session encryption | `openssl rand -base64 32` |
| `KV_REST_API_URL` | Upstash Redis URL (bookmarks, history, users) | `https://...upstash.io` |
| `KV_REST_API_TOKEN` | Upstash Redis token | |

#### OAuth Providers

Configure one or more OAuth providers by setting their env vars. Only providers with both `_ID` and `_SECRET` set will appear on the login page.

| Provider | Variables |
|---|---|
| GitHub | `OAUTH_GITHUB_ID`, `OAUTH_GITHUB_SECRET` |
| Google | `OAUTH_GOOGLE_ID`, `OAUTH_GOOGLE_SECRET` |
| Apple | `OAUTH_APPLE_ID`, `OAUTH_APPLE_SECRET` |
| Microsoft/Azure AD | `OAUTH_AZURE_ID`, `OAUTH_AZURE_SECRET`, `OAUTH_AZURE_TENANT` (optional, default: `common`) |
| GitLab | `OAUTH_GITLAB_ID`, `OAUTH_GITLAB_SECRET` |
| Keycloak | `OAUTH_KEYCLOAK_ID`, `OAUTH_KEYCLOAK_SECRET`, `OAUTH_KEYCLOAK_ISSUER` |
| Okta | `OAUTH_OKTA_ID`, `OAUTH_OKTA_SECRET`, `OAUTH_OKTA_ISSUER` |
| Auth0 | `OAUTH_AUTH0_ID`, `OAUTH_AUTH0_SECRET`, `OAUTH_AUTH0_ISSUER` |
| AWS Cognito | `OAUTH_COGNITO_ID`, `OAUTH_COGNITO_SECRET`, `OAUTH_COGNITO_ISSUER` |

#### Custom OIDC (SSO)

For custom identity providers, use numbered OIDC slots (up to 5):

```
OAUTH_OIDC_1_ID=client-id
OAUTH_OIDC_1_SECRET=client-secret
OAUTH_OIDC_1_ISSUER=https://idp.example.com/realms/main
OAUTH_OIDC_1_NAME=Company SSO
```

The `_NAME` is shown on the login button. The `_ISSUER` must support OpenID Connect Discovery (`.well-known/openid-configuration`).

## Setting Up a Content Repo

### Commentary / Book

1. Create a new private GitHub repo
2. Add `meta.yaml` in the root (see [meta-yaml.md](meta-yaml.md))
3. Add `toc.yaml` in the root (see [toc-yaml.md](toc-yaml.md))
4. Place Markdown files in `content/` (see [content-guide.md](content-guide.md))
5. Optional: add `jura.csl` + `references.yaml` for citations (see [references-yaml.md](references-yaml.md))
6. Optional: set `category` in `meta.yaml` for homepage grouping
7. Add repo name to `CONTENT_REPOS` on Vercel

### Journal

1. Create a new private GitHub repo
2. Add `meta.yaml` with `type: "journal"` (see [meta-yaml.md](meta-yaml.md))
3. Create year/issue directories with `issue.yaml` and article markdown files
4. Optional: set `category` in `meta.yaml` for homepage grouping
5. Add repo name to `CONTENT_REPOS` on Vercel

### Laws

1. Create a private GitHub repo (or use an existing mono-repo)
2. Add `sync.yaml` in the root (see [sync-yaml.md](sync-yaml.md))
3. Add sync scripts and GitHub Actions workflow (see [sync-yaml.md](sync-yaml.md))
4. Add repo name to `CONTENT_REPOS` on Vercel

## Internationalization

- UI strings are in `src/lib/i18n/` with one file per locale (`de.ts`, `en.ts`)
- Default locale is set in `site.yaml` (`default_locale`)
- Code-level fallback is `en`
- Server components use `t(locale, key)` from `@/lib/i18n`
- Client components use the `useT()` hook from `@/lib/i18n/useT`
- To add a locale: create `src/lib/i18n/{locale}.ts`, add to `locales` array in `index.ts`

## Build Process

```
build-search-index → next build → deploy
```

The Pagefind search index is generated *before* `next build` so the static files are available in `public/pagefind/`. `GITHUB_PAT` and `CONTENT_REPOS` must be available at build time.

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

## Revalidation

Content is cached with ISR (Incremental Static Regeneration): 5 minutes. After a push to a content repo, content is automatically refreshed on the next request after cache expiry.
