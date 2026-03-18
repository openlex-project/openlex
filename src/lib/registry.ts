import { parse } from "yaml";
import { fetchFile, listFiles } from "./github";

export interface BookMeta {
  slug: string;
  type: "book" | "journal";
  title: string;
  abbreviation: string;
  unit_type: "article" | "section" | "chapter";
  lang: string;
  license: string;
  numbering: string;
  comments_on?: string;
  csl?: string;
  bibliography?: string;
  editors: { name: string; orcid: string }[];
}

export interface LawMeta {
  slug: string;
  title: string;
  abbreviation: string;
  unit_type: "article" | "section" | "chapter";
  lang: string;
  repo: string;
}

interface SyncYaml {
  laws: Record<string, {
    title: string;
    abbreviation: string;
    unit_type: string;
    lang: string;
  }>;
}

export interface ContentRegistry {
  books: Map<string, BookMeta & { repo: string }>;
  laws: Map<string, LawMeta>;
}

function getContentRepos(): string[] {
  return (process.env.CONTENT_REPOS ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}

export async function buildRegistry(): Promise<ContentRegistry> {
  const books = new Map<string, BookMeta & { repo: string }>();
  const laws = new Map<string, LawMeta>();

  for (const repo of getContentRepos()) {
    // Try book repo (has meta.yaml)
    const metaRaw = await fetchFile(repo, "meta.yaml");
    if (metaRaw) {
      const meta = parse(metaRaw) as BookMeta;
      books.set(meta.slug, { ...meta, repo });
      continue;
    }

    // Try law repo (has sync.yaml)
    const syncRaw = await fetchFile(repo, "sync.yaml");
    if (syncRaw) {
      const sync = parse(syncRaw) as SyncYaml;
      for (const [slug, law] of Object.entries(sync.laws)) {
        laws.set(slug, {
          slug,
          title: law.title,
          abbreviation: law.abbreviation,
          unit_type: law.unit_type as LawMeta["unit_type"],
          lang: law.lang,
          repo,
        });
      }
    }
  }

  return { books, laws };
}

export async function getBookContent(
  repo: string,
  slug: string,
  nr: string,
): Promise<string | null> {
  // Single file
  const single = await fetchFile(repo, `content/${nr}.md`);
  if (single) return single;

  // Split files: {nr}-01.md, {nr}-02.md, ...
  const files = await listFiles(repo, "content");
  const parts = files
    .filter((f) => f.startsWith(`${nr}-`) && f.endsWith(".md"))
    .sort();
  if (parts.length === 0) return null;

  const contents = await Promise.all(
    parts.map((f) => fetchFile(repo, `content/${f}`)),
  );
  return contents.filter(Boolean).join("\n\n");
}

export async function getLawContent(
  repo: string,
  slug: string,
  nr: string,
): Promise<string | null> {
  return fetchFile(repo, `${slug}/${nr}.md`);
}
