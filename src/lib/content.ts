import { getProvider } from "./git-provider";

/** Result of a localized content fetch. `locale` indicates which language was actually served. */
export interface LocalizedContent { content: string; locale: string }

/**
 * Fetch book content with locale fallback.
 * Tries content/{locale}/{file} first, falls back to content/{file} (default language).
 */
export async function getBookContent(repoUrl: string, fileSlug: string, ref = "main", locale?: string): Promise<LocalizedContent | null> {
  const { provider: p, repo } = getProvider(repoUrl);
  if (locale) {
    const translated = await p.fetchFile(repo, `content/${locale}/${fileSlug}.md`, ref);
    if (translated) return { content: translated, locale };
  }
  const content = await p.fetchFile(repo, `content/${fileSlug}.md`, ref);
  return content ? { content, locale: "default" } : null;
}

/**
 * Fetch law content with locale fallback.
 * Tries {slug}/{locale}/{nr}.md first, falls back to {slug}/{nr}.md.
 */
export async function getLawContent(repoUrl: string, slug: string, nr: string, ref?: string, locale?: string): Promise<LocalizedContent | null> {
  const { provider: p, repo } = getProvider(repoUrl);
  if (locale) {
    const translated = await p.fetchFile(repo, `${slug}/${locale}/${nr}.md`, ref);
    if (translated) return { content: translated, locale };
  }
  const content = await p.fetchFile(repo, `${slug}/${nr}.md`, ref);
  return content ? { content, locale: "default" } : null;
}

export async function getLawProvisions(repoUrl: string, slug: string): Promise<number[]> {
  const { provider: p, repo } = getProvider(repoUrl);
  const files = await p.listFiles(repo, slug);
  return files.filter((f) => f.endsWith(".md")).map((f) => parseInt(f.replace(".md", ""), 10)).filter((n) => !isNaN(n)).sort((a, b) => a - b);
}

/**
 * Fetch journal article content with locale fallback.
 */
export async function getJournalArticleContent(repoUrl: string, year: string, issue: string, slug: string, locale?: string): Promise<LocalizedContent | null> {
  const { provider: p, repo } = getProvider(repoUrl);
  if (locale) {
    const translated = await p.fetchFile(repo, `${year}/${issue}/${locale}/${slug}.md`);
    if (translated) return { content: translated, locale };
  }
  const content = await p.fetchFile(repo, `${year}/${issue}/${slug}.md`);
  return content ? { content, locale: "default" } : null;
}
