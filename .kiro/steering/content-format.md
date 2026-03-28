# Content Format (Pandoc Markdown)

Content is authored in Pandoc-flavor Markdown.

## File Structure

- Each file starts with a `#` heading (top level).
- `#` = file level, `##`–`#####` = structure within (auto-numbered).

### Filename Schemas

| Type | Schema | Examples |
|---|---|---|
| Commentary | `{nr}.md` or `{nr}-XX.md` | `5.md`, `312d.md` |
| Textbook | `XX-YY.md` | `10-01.md`, `30-05.md` |
| Chapter title | `XX-00.md` | `10-00.md` |

### Unnumbered / Unlisted

- `{.unnumbered}` — no auto-numbering, but visible in TOC.
- `{.unnumbered .unlisted}` — no number, not in TOC.

## Margin Numbers

- `[]{.rn}` at the beginning of a paragraph marks a new margin number.
- Numbering is automatic and sequential per article/paragraph.
- Each Rn. gets a stable anchor: `#rn-1`, `#rn-2`, ...

## Heading Anchors & Cross-References

- `## Heading {#anchor-id}` — stable IDs for headings
- `[Link text](#anchor-id){.xref}` — internal cross-references

## Author Attribution

- `::: author` / `:::` — marks the author of a section with name and ORCID.
- Applies to all headings below until a new `::: author` block.

## Footnotes & Citations

- `^[Footnote text]` — inline footnotes
- `@citation_key` — Pandoc citeproc references
- Bibliography in YAML format, CSL for citation style

## Index Entries

- `[]{.idx entry="Term"}` — index entry
- `[]{.idx entry="Parent!Child"}` — nested index entry

## Custom Divs (Fenced Divs)

- `::: name` / `:::` — mapped via `divs.yaml` in content repo to base components + variant.
- Base components: `Callout` (variants: `note`, `warning`, `review`, `law`).

## Citation Bar

- CSL-based: each content repo provides a CSL file for the citation style.
- Dynamically generates the correct citation for the current position.

## Numbering

- Headings are auto-numbered. Authors write no numbers — only the title.
- Predefined schemas: `commentary`, `textbook`, `decimal`, `none`.
- Schema overridable per work via `meta.yaml`: `numbering: "commentary"`.
- Manual override: `## Section {number="X."}`.
- Reset behavior per level configurable via `numbering_reset`.

### Numbering Format

Counter types: `{1}` (arabic), `{A}` (uppercase), `{a}` (lowercase), `{I}` (roman upper), `{i}` (roman lower).

| Schema | `##` | `###` | `####` | `#####` |
|---|---|---|---|---|
| `commentary` (default) | A., B. | I., II. | 1., 2. | a), b) |
| `textbook` | § 1, § 2 | A., B. | I., II. | 1., 2. |
| `decimal` | 1., 2. | 1.1, 1.2 | 1.1.1 | 1.1.1.1 |
| `none` | no numbering ||||

## Domain Glossary

| German Term | Meaning | English in Code |
|---|---|---|
| Randnummer (Rn.) | Smallest citable unit | `marginNumber` / `mn` |
| Fundstelle | Citation reference | `citation` |
| Kommentar | Legal commentary | `commentary` |
| Auflage | Edition | `edition` |
| Gesetzesstand | Temporal version | `legalVersion` |
