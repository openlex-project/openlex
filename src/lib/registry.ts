import { parse } from "yaml";
import { fetchFile, listFiles, listDirs } from "./github";
import { loadSiteConfig } from "./site";

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
  category?: string;
  numbering?: string;
  comments_on?: string;
  csl?: string;
  bibliography?: string;
  issn?: string;
  editors: { name: string; orcid?: string }[];
}

export interface LawMeta {
  slug: string;
  title: string;
  title_short?: string;
  unit_type: "article" | "section";
  lang: string;
  license?: string;
  category?: string;
  repo: string;
  toc: LawTocNode[];
}

export interface LawTocNode {
  label?: string;
  title: string;
  nr?: string;
  children?: LawTocNode[];
}

interface SyncYaml {
  laws: Record<string, {
    title: string;
    title_short?: string;
    unit_type: string;
    lang: string;
    license?: string;
    category?: string;
  }>;
}

export interface BookEntry extends BookMeta {
  repo: string;
  toc: TocEntry[];
}

/** Article metadata from per-issue meta.yaml */
export interface JournalArticle {
  slug: string;
  title: string;
  authors: { name: string; orcid?: string }[];
  section: string;
  pages?: string;
  numbering?: string;
  doi?: string;
}

export interface JournalIssue {
  year: string;
  issue: string;
  articles: JournalArticle[];
}

export interface JournalEntry extends BookMeta {
  repo: string;
  doi_prefix?: string;
  issues: JournalIssue[];
}

export type ContentEntry =
  | { type: "book"; entry: BookEntry }
  | { type: "law"; entry: LawMeta }
  | { type: "journal"; entry: JournalEntry };

export interface ContentRegistry {
  books: Map<string, BookEntry>;
  laws: Map<string, LawMeta>;
  journals: Map<string, JournalEntry>;
  slugMap: Map<string, ContentEntry>;
}

function getContentRepos(): string[] {
  const site = loadSiteConfig();
  if (site.content_repos?.length) return site.content_repos;
  // Fallback to env var for backward compatibility
  return (process.env.CONTENT_REPOS ?? "").split(",").map((r) => r.trim()).filter(Boolean);
}

/** Discover journal issues from per-issue meta.yaml */
async function discoverJournal(repo: string, doiPrefix?: string): Promise<JournalIssue[]> {
  const years = (await listDirs(repo, ".")).filter((d) => /^\d{4}$/.test(d)).sort().reverse();
  const issues: JournalIssue[] = [];
  for (const year of years) {
    const nums = (await listDirs(repo, year)).sort().reverse();
    for (const issueNr of nums) {
      const raw = await fetchFile(repo, `${year}/${issueNr}/issue.yaml`);
      if (!raw) continue;
      const issueMeta = parse(raw) as { articles: { file: string; title: string; authors: { name: string; orcid?: string }[]; section: string; pages?: string; numbering?: string; doi?: string }[] };
      if (!issueMeta.articles?.length) continue;
      const articles: JournalArticle[] = issueMeta.articles.map((a) => {
        const firstPage = a.pages?.split("-")[0];
        return {
          slug: a.file.replace(/\.md$/, ""),
          title: a.title,
          authors: a.authors,
          section: a.section ?? "Other",
          pages: a.pages,
          numbering: a.numbering,
          doi: a.doi ?? (doiPrefix && firstPage ? `${doiPrefix}.${year}.${firstPage}` : undefined),
        };
      });
      issues.push({ year, issue: issueNr, articles });
    }
  }
  return issues;
}

export async function buildRegistry(): Promise<ContentRegistry> {
  const books = new Map<string, BookEntry>();
  const laws = new Map<string, LawMeta>();
  const journals = new Map<string, JournalEntry>();

  for (const repo of getContentRepos()) {
    const metaRaw = await fetchFile(repo, "meta.yaml");
    if (metaRaw) {
      const meta = parse(metaRaw) as BookMeta;

      if (meta.type === "journal") {
        const jmeta = meta as BookMeta & { doi_prefix?: string };
        const issues = await discoverJournal(repo, jmeta.doi_prefix);
        journals.set(meta.slug, { ...meta, repo, doi_prefix: jmeta.doi_prefix, issues });
        continue;
      }

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
        const tocRaw = await fetchFile(repo, `${slug}/toc.yaml`);
        const toc: LawTocNode[] = tocRaw ? (parse(tocRaw) as LawTocNode[]) : [];
        laws.set(slug, {
          slug,
          title: law.title,
          title_short: law.title_short,
          unit_type: law.unit_type as LawMeta["unit_type"],
          lang: law.lang,
          license: law.license,
          category: law.category,
          repo,
          toc,
        });
      }
    }
  }

  const slugMap = new Map<string, ContentEntry>();
  const reserved = new Set(["category", "login", "search", "api", "favicon.svg", "bookmarks", "history", "profile", "feedback"]);

  for (const [slug, entry] of books) {
    if (reserved.has(slug)) throw new Error(`Slug "${slug}" is reserved`);
    if (slugMap.has(slug)) throw new Error(`Slug collision: "${slug}" used by both ${slugMap.get(slug)!.type} and book`);
    slugMap.set(slug, { type: "book", entry });
  }
  for (const [slug, entry] of laws) {
    if (reserved.has(slug)) throw new Error(`Slug "${slug}" is reserved`);
    if (slugMap.has(slug)) throw new Error(`Slug collision: "${slug}" used by both ${slugMap.get(slug)!.type} and law`);
    slugMap.set(slug, { type: "law", entry });
  }
  for (const [slug, entry] of journals) {
    if (reserved.has(slug)) throw new Error(`Slug "${slug}" is reserved`);
    if (slugMap.has(slug)) throw new Error(`Slug collision: "${slug}" used by both ${slugMap.get(slug)!.type} and journal`);
    slugMap.set(slug, { type: "journal", entry });
  }

  return { books, laws, journals, slugMap };
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
  if (meta.bibliography) {
    sections.push({ id: "literaturverzeichnis", title: "Literaturverzeichnis" });
    sections.push({ id: "rechtsprechungsverzeichnis", title: "Rechtsprechungsverzeichnis" });
  }
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

/** List all provision numbers for a law */
export async function getLawProvisions(repo: string, slug: string): Promise<number[]> {
  const files = await listFiles(repo, slug);
  return files
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseInt(f.replace(".md", ""), 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);
}

/** Find breadcrumb path to a provision in a law TOC */
export function findLawBreadcrumb(toc: LawTocNode[], nr: string): LawTocNode[] {
  for (const node of toc) {
    if (node.nr === nr) return [node];
    if (node.children) {
      const path = findLawBreadcrumb(node.children, nr);
      if (path.length) return [node, ...path];
    }
  }
  return [];
}

export async function getJournalArticleContent(
  repo: string,
  year: string,
  issue: string,
  slug: string,
): Promise<string | null> {
  return fetchFile(repo, `${year}/${issue}/${slug}.md`);
}
