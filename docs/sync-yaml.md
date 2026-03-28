# sync.yaml

The `sync.yaml` file is located in the root directory of a law repo (e.g., `openlex-demo-law`) and defines all contained laws.

## Schema

```yaml
laws:
  dsgvo:
    title: "Datenschutz-Grundverordnung"
    title_short: "DSGVO"
    unit_type: "article"
    lang: "de"
    license: "Gemeinfrei"
    category: "eu-law"
    source: "eurlex"
    celex: "32016R0679"

  bgb:
    title: "Bürgerliches Gesetzbuch"
    title_short: "BGB"
    unit_type: "section"
    lang: "de"
    license: "Gemeinfrei"
    source: "gii"
    gii_slug: "bgb"
```

## Fields per Law

| Field | Type | Required | Description |
|---|---|---|---|
| (Key) | string | ✓ | Slug of the law (= directory name in repo) |
| `title` | string | i18n | ✓ | Full title (string or { de: "...", en: "..." }) |
| `title_short` | string | i18n | | Short title (string or { de: "DSGVO", en: "GDPR" }) |
| `unit_type` | `article` \| `section` | ✓ | Unit type: `article` → "Art.", `section` → "§" |
| `lang` | string | ✓ | Language (ISO 639-1) |
| `license` | string | | License identifier (e.g., "Gemeinfrei", "CC-BY-SA-4.0") |
| `category` | string | | Category key for homepage grouping (defaults to `law`) |
| `feedback` | boolean | | Enable feedback (GitHub/GitLab Issues). Default: `false`. |
| `source` | `gii` \| `eurlex` | | Source for sync |
| `gii_slug` | string | | Slug on gesetze-im-internet.de (when `source: gii`) |
| `celex` | string | | CELEX number (when `source: eurlex`) |

## Sync Scripts

The repo includes two sync scripts in `scripts/`:

- `sync_gii.py` — Fetches German federal laws from gesetze-im-internet.de (XML zip → Markdown)
- `sync_eurlex.py` — Fetches EU regulations from EUR-Lex (HTML → Markdown)

Both read `sync.yaml` and only process laws matching their source type.

### GitHub Actions

`.github/workflows/sync.yml` runs both scripts daily (4am UTC) and on manual dispatch. Changes are committed and tagged with the date (`sync-YYYY-MM-DD`). After a successful sync with changes, the workflow triggers a Vercel Deploy Hook to rebuild the site.

To set up the deploy hook:

1. Create a [Vercel Deploy Hook](https://vercel.com/docs/deploy-hooks) for the OpenLex project
2. Add it as a repository secret `VERCEL_DEPLOY_HOOK` in the openlex-demo-law repo settings

```yaml
# .github/workflows/sync.yml (excerpt)
- name: Trigger deploy
  if: success()
  run: |
    if [ -n "${{ secrets.VERCEL_DEPLOY_HOOK }}" ]; then
      curl -s -X POST "${{ secrets.VERCEL_DEPLOY_HOOK }}"
    fi
```

### Dependencies

```
pip install -r requirements.txt  # pyyaml, beautifulsoup4
```

## Directory Structure

Each law has its own directory in the repo, named after the slug:

```
openlex-demo-law/
  sync.yaml
  requirements.txt
  scripts/
    sync_gii.py
    sync_eurlex.py
  .github/workflows/
    sync.yml
  dsgvo/
    1.md
    2.md
    ...
  bgb/
    1.md
    2.md
    ...
```

Markdown files contain plain legal text without frontmatter.

## Notes

- `title_short` is preferred in navigation and cross-links.
- `unit_type` determines the prefix on the law page: "Art. 5 DSGVO" vs. "§ 15 UrhG".
- `license` is shown in the page footer. Laws are typically public domain ("Gemeinfrei").
- `category` groups laws on the homepage. If omitted, defaults to `law`.
- A law repo can contain multiple laws (mono-repo).

## Supplements

Supplements are additional content synced alongside provisions (articles/sections). Defined under `supplements` per law:

```yaml
supplements:
  recitals:
    label: { de: "Erwägungsgründe", en: "Recitals" }
    title_short: { de: "EG", en: "Rec." }
    source: eurlex
    prefix: "rec"
    mapping:
      5: [39, 74]
  annexes:
    label: { de: "Anhänge", en: "Annexes" }
    title_short: { de: "Anhang", en: "Annex" }
    source: eurlex
    prefix: "annex"
```

| Field | Description |
|---|---|
| `label` | Section heading in the TOC sidebar |
| `title_short` | Prefix for individual items (e.g., "Rec. 1", "Annex III") |
| `prefix` | Filename prefix: `rec-1.md`, `annex-3.md` |
| `mapping` | Optional: maps provision numbers to supplement numbers (recitals only) |

Supplements are written as flat files alongside provisions and appear in the auto-generated `toc.yaml`. Annexes use their actual titles from the source document instead of `title_short`.
