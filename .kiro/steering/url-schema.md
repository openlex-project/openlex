# URL Schema

## Patterns

- Books/commentaries: `/{work}/{slug}` (current), `/{work}/{n}ed/{slug}` (explicit edition)
- Laws: `/{law}/{nr}` (current), `/{law}/@{date}/{nr}` (historical version)
- Journals: `/{journal}/{year}/{issue}/{slug}` (article), `/{journal}/{year}/{page}` (citation redirect)
- Categories: `/category/{key}`
- Locale prefix: `/en/...`, `/fr/...`. No prefix = default locale (canonical).

## Editions

- Editions map to Git branches: `main` = current, `{n}ed` = archived.
- Edition of `main` is derived: count of `*ed` branches + 1.
- Access to `/{n}ed/` without existing branch → redirect to current.

## Fragments

- Commentaries: `#rn-1`, `#rn-2`, ...
- Laws: `#abs-1`, `#abs-1-s-1`, `#abs-1-lit-a`

## Examples

```
/dsgvo/5#abs-1
/oc-dsgvo/art-5#rn-3
/en/ai-act/3
/zfkir/2025/01/mustermann-ki
/zfkir/2025/42                    # Citation redirect → article
```

## Laws

- `unit_type` in `sync.yaml`: `article` (Art.) or `section` (§)
- Versioning via Git tags: `law/{slug}/{date}`. Web app resolves `@{date}` to most recent tag.
- Journal structure derived from filesystem: years → issues → articles with metadata in `issue.yaml`.
