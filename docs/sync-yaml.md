# sync.yaml

The `sync.yaml` file is located in the root directory of a law repo (e.g., `openlex-laws`) and defines all contained laws.

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
| `title` | string | ✓ | Full title |
| `title_short` | string | | Short title / abbreviation (e.g., "DSGVO") |
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
2. Add it as a repository secret `VERCEL_DEPLOY_HOOK` in the openlex-laws repo settings

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
openlex-laws/
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
