import { parse } from "yaml";
import { fetchFile, listFiles } from "./github";

export interface TocEntry {
  file: string;
  title: string;
  provisions?: number[];
  author?: string | { name: string; orcid: string };
}

export interface BookMeta {
  slug: string;
  type: "book" | "journal";
  title: string;
  title_short?: string;
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
  title_short?: string;
  unit_type: "article" | "section";
  lang: string;
  repo: string;
}

interface SyncYaml {
  laws: Record<string, {
    title: string;
    title_short?: string;
    unit_type: string;
    lang: string;
  }>;
}

export interface BookEntry extends BookMeta {
  repo: string;
  toc: TocEntry[];
}

export interface ContentRegistry {
  books: Map<string, BookEntry>;
  laws: Map<string, LawMeta>;
}

function getContentRepos(): string[] {
  return (process.env.CONTENT_REPOS ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}

export async function buildRegistry(): Promise<ContentRegistry> {
  const books = new Map<string, BookEntry>();
  const laws = new Map<string, LawMeta>();

  for (const repo of getContentRepos()) {
    const metaRaw = await fetchFile(repo, "meta.yaml");
    if (metaRaw) {
      const meta = parse(metaRaw) as BookMeta;
      // Load toc.yaml or auto-generate from content/ directory
      const tocRaw = await fetchFile(repo, "toc.yaml");
      let toc: TocEntry[];
      if (tocRaw) {
        const parsed = parse(tocRaw) as { contents: TocEntry[] };
        toc = parsed.contents;
      } else {
        const files = await listFiles(repo, "content");
        toc = files
          .filter((f) => f.endsWith(".md"))
          .sort()
          .map((f) => ({ file: f, title: f.replace(/\.md$/, "") }));
      }
      books.set(meta.slug, { ...meta, repo, toc });
      continue;
    }

    const syncRaw = await fetchFile(repo, "sync.yaml");
    if (syncRaw) {
      const sync = parse(syncRaw) as SyncYaml;
      for (const [slug, law] of Object.entries(sync.laws)) {
        laws.set(slug, {
          slug,
          title: law.title,
          title_short: law.title_short,
          unit_type: law.unit_type as LawMeta["unit_type"],
          lang: law.lang,
          repo,
        });
      }
    }
  }

  return { books, laws };
}

/** Find a toc entry by slug (filename without .md) */
export function findTocEntry(toc: TocEntry[], slug: string): TocEntry | undefined {
  return toc.find((e) => e.file.replace(/\.md$/, "") === slug);
}

export function findTocNeighbors(toc: TocEntry[], slug: string): { prev?: TocEntry; next?: TocEntry } {
  const idx = toc.findIndex((e) => e.file.replace(/\.md$/, "") === slug);
  if (idx < 0) return {};
  return { prev: toc[idx - 1], next: toc[idx + 1] };
}

/** Find toc entries that cover a given provision number */
export function findByProvision(toc: TocEntry[], provision: number): TocEntry[] {
  return toc.filter((e) => e.provisions?.includes(provision));
}

export async function getBookContent(
  repo: string,
  fileSlug: string,
  ref = "main",
): Promise<string | null> {
  return fetchFile(repo, `content/${fileSlug}.md`, ref);
}

export async function getLawContent(
  repo: string,
  slug: string,
  nr: string,
): Promise<string | null> {
  return fetchFile(repo, `${slug}/${nr}.md`);
}
