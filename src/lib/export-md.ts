/** Strip YAML frontmatter and return clean markdown. */
export function exportMarkdown(raw: string): string {
  return raw.replace(/^---\n[\s\S]*?\n---\n*/, "").trim();
}
