import { parse } from "yaml";
import { fetchFile, listFiles } from "./github";

export interface TocEntry {
  file: string;
  title: string;
  provisions?: number[];
  author?: string | { name: string; orcid: string };
  children?: TocEntry[];
}

export interface Heading {
  level: number;
  text: string;
  id: string;
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
  for (const e of toc) {
    if (e.file.replace(/\.md$/, "") === slug) return e;
    if (e.children) {
      const found = findTocEntry(e.children, slug);
      if (found) {
        // Inherit parent author if child has none
        if (!found.author && e.author) found.author = e.author;
        return found;
      }
    }
  }
  return undefined;
}

export function findTocNeighbors(toc: TocEntry[], slug: string): { prev?: TocEntry; next?: TocEntry } {
  const flat = flattenToc(toc);
  const idx = flat.findIndex((e) => e.file.replace(/\.md$/, "") === slug);
  if (idx < 0) return {};
  return { prev: flat[idx - 1], next: flat[idx + 1] };
}

/** Flatten nested toc for prev/next navigation */
function flattenToc(toc: TocEntry[]): TocEntry[] {
  const result: TocEntry[] = [];
  for (const e of toc) {
    result.push(e);
    if (e.children) result.push(...flattenToc(e.children));
  }
  return result;
}

/** Determine which backmatter sections exist for a book */
export function getBackmatterSections(meta: BookEntry): { id: string; title: string }[] {
  const sections: { id: string; title: string }[] = [];
  if (meta.bibliography) sections.push({ id: "literaturverzeichnis", title: "Literaturverzeichnis" });
  const hasAuthors = meta.toc.some(function check(e: TocEntry): boolean {
    return !!e.author || (e.children?.some(check) ?? false);
  });
  if (hasAuthors) sections.push({ id: "autorenverzeichnis", title: "Autorenverzeichnis" });
  return sections;
}
export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  for (const match of markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)) {
    const text = match[2]!.replace(/\{[^}]*\}/g, "").trim();
    const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    headings.push({ level: match[1]!.length, text, id });
  }
  return headings;
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
