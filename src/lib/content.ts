import { getProvider } from "./git-provider";

export async function getBookContent(repoUrl: string, fileSlug: string, ref = "main"): Promise<string | null> {
  const { provider: p, repo } = getProvider(repoUrl);
  return p.fetchFile(repo, `content/${fileSlug}.md`, ref);
}

export async function getLawContent(repoUrl: string, slug: string, nr: string, ref?: string): Promise<string | null> {
  const { provider: p, repo } = getProvider(repoUrl);
  return p.fetchFile(repo, `${slug}/${nr}.md`, ref);
}

export async function getLawProvisions(repoUrl: string, slug: string): Promise<number[]> {
  const { provider: p, repo } = getProvider(repoUrl);
  const files = await p.listFiles(repo, slug);
  return files.filter((f) => f.endsWith(".md")).map((f) => parseInt(f.replace(".md", ""), 10)).filter((n) => !isNaN(n)).sort((a, b) => a - b);
}

export async function getJournalArticleContent(repoUrl: string, year: string, issue: string, slug: string): Promise<string | null> {
  const { provider: p, repo } = getProvider(repoUrl);
  return p.fetchFile(repo, `${year}/${issue}/${slug}.md`);
}
