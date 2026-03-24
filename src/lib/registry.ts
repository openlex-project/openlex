import { parse } from "yaml";
import { getProvider } from "./git-provider";
import { loadSiteConfig } from "./site";
import { log } from "./logger";

export interface TocEntry {
  file: string;
  title: string;
  provisions?: number[];
  related?: string[];
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
  related?: string[];
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

export interface RelatedLink {
  type: "book" | "law" | "journal";
  path: string;
  name: string;
}

export interface ContentRegistry {
  books: Map<string, BookEntry>;
  laws: Map<string, LawMeta>;
  journals: Map<string, JournalEntry>;
  slugMap: Map<string, ContentEntry>;
  relatedIndex: Map<string, RelatedLink[]>;
}

function getContentRepos(): string[] {
  return loadSiteConfig().content_repos ?? [];
}

/** Discover journal issues from per-issue meta.yaml */
async function discoverJournal(repoUrl: string, doiPrefix?: string): Promise<JournalIssue[]> {
  const { provider: p, repo } = getProvider(repoUrl);
  const years = (await p.listDirs(repo, ".")).filter((d) => /^\d{4}$/.test(d)).sort().reverse();
  const issues: JournalIssue[] = [];
  for (const year of years) {
    const nums = (await p.listDirs(repo, year)).sort().reverse();
    for (const issueNr of nums) {
      const raw = await p.fetchFile(repo, `${year}/${issueNr}/issue.yaml`);
      if (!raw) continue;
      const issueMeta = parse(raw) as { articles: { file: string; title: string; authors: { name: string; orcid?: string }[]; section: string; pages?: string; numbering?: string; doi?: string; related?: string[] }[] };
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
          related: a.related,
        };
      });
      issues.push({ year, issue: issueNr, articles });
    }
  }
  return issues;
}

let _cache: { data: ContentRegistry; ts: number } | null = null;
const CACHE_TTL = 5 * 60_000; // 5 min — avoids GitHub API rate limit during dev

export async function buildRegistry(): Promise<ContentRegistry> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.data;

  const books = new Map<string, BookEntry>();
  const laws = new Map<string, LawMeta>();
  const journals = new Map<string, JournalEntry>();

  for (const repoUrl of getContentRepos()) {
    try {
    const { provider: p, repo } = getProvider(repoUrl);
    const metaRaw = await p.fetchFile(repo, "meta.yaml");
    if (metaRaw) {
      const meta = parse(metaRaw) as BookMeta;

      if (meta.type === "journal") {
        const jmeta = meta as BookMeta & { doi_prefix?: string };
        const issues = await discoverJournal(repoUrl, jmeta.doi_prefix);
        journals.set(meta.slug, { ...meta, repo: repoUrl, doi_prefix: jmeta.doi_prefix, issues });
        continue;
      }

      const tocRaw = await p.fetchFile(repo, "toc.yaml");
      let toc: TocEntry[];
      if (tocRaw) {
        const parsed = parse(tocRaw) as { contents: TocEntry[] };
        toc = parsed.contents;
      } else {
        const files = await p.listFiles(repo, "content");
        toc = files
          .filter((f) => f.endsWith(".md"))
          .sort()
          .map((f) => ({ file: f, title: f.replace(/\.md$/, "") }));
      }
      books.set(meta.slug, { ...meta, repo: repoUrl, toc });
      continue;
    }

    const syncRaw = await p.fetchFile(repo, "sync.yaml");
    if (syncRaw) {
      const sync = parse(syncRaw) as SyncYaml;
      for (const [slug, law] of Object.entries(sync.laws)) {
        const tocRaw = await p.fetchFile(repo, `${slug}/toc.yaml`);
        const toc: LawTocNode[] = tocRaw ? (parse(tocRaw) as LawTocNode[]) : [];
        laws.set(slug, {
          slug,
          title: law.title,
          title_short: law.title_short,
          unit_type: law.unit_type as LawMeta["unit_type"],
          lang: law.lang,
          license: law.license,
          category: law.category,
          repo: repoUrl,
          toc,
        });
      }
    }
    } catch (err) {
      log.error(err, "Failed to load content repo: %s", repoUrl);
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

  // Build bidirectional related index
  const relatedIndex = new Map<string, RelatedLink[]>();
  const addRelated = (sourcePath: string, targetPath: string, link: RelatedLink) => {
    const existing = relatedIndex.get(targetPath) ?? [];
    if (!existing.some((l) => l.path === link.path)) existing.push(link);
    relatedIndex.set(targetPath, existing);
  };

  // Books: provisions[] → law pages (bidirectional)
  for (const [slug, book] of books) {
    if (!book.comments_on) continue;
    const walkToc = (entries: TocEntry[]) => {
      for (const e of entries) {
        const filePath = `/${slug}/${e.file.replace(/\.md$/, "")}`;
        if (e.provisions) {
          for (const nr of e.provisions) {
            const lawPath = `/${book.comments_on}/${nr}`;
            addRelated(filePath, lawPath, { type: "book", path: filePath, name: book.title_short ?? book.title });
            addRelated(lawPath, filePath, { type: "law", path: lawPath, name: `${slug === book.comments_on ? "" : book.comments_on + " "}${nr}` });
          }
        }
        if (e.children) walkToc(e.children);
      }
    };
    walkToc(book.toc);
  }

  // All content: related[] → bidirectional links
  const resolveLink = (path: string): RelatedLink | null => {
    const parts = path.split("/");
    const entry = slugMap.get(parts[0]!);
    if (!entry) return null;
    if (entry.type === "law") return { type: "law", path: `/${path}`, name: `${entry.entry.title_short ?? entry.entry.title} ${parts[1] ?? ""}`.trim() };
    if (entry.type === "book") {
      const toc = findTocEntry(entry.entry.toc, parts.slice(1).join("/"));
      return { type: "book", path: `/${path}`, name: `${entry.entry.title_short ?? entry.entry.title}${toc ? ` – ${toc.title}` : ""}` };
    }
    if (entry.type === "journal") return { type: "journal", path: `/${path}`, name: entry.entry.title_short ?? entry.entry.title };
    return null;
  };

  for (const [slug, book] of books) {
    const walkRelated = (entries: TocEntry[]) => {
      for (const e of entries) {
        if (e.related) {
          const sourcePath = `/${slug}/${e.file.replace(/\.md$/, "")}`;
          const sourceLink: RelatedLink = { type: "book", path: sourcePath, name: `${book.title_short ?? book.title} – ${e.title}` };
          for (const target of e.related) {
            const targetLink = resolveLink(target);
            if (targetLink) { addRelated(sourcePath, `/${target}`, targetLink); addRelated(`/${target}`, sourcePath, sourceLink); }
          }
        }
        if (e.children) walkRelated(e.children);
      }
    };
    walkRelated(book.toc);
  }

  for (const [slug, journal] of journals) {
    for (const iss of journal.issues) {
      for (const art of iss.articles) {
        if (!art.related) continue;
        const sourcePath = `/${slug}/${iss.year}/${iss.issue}/${art.slug}`;
        const sourceLink: RelatedLink = { type: "journal", path: sourcePath, name: `${journal.title_short ?? journal.title} – ${art.title}` };
        for (const target of art.related) {
          const targetLink = resolveLink(target);
          if (targetLink) { addRelated(sourcePath, `/${target}`, targetLink); addRelated(`/${target}`, sourcePath, sourceLink); }
        }
      }
    }
  }

  const result = { books, laws, journals, slugMap, relatedIndex };
  _cache = { data: result, ts: Date.now() };
  return result;
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

export function extractHeadingsFromHtml(html: string): Heading[] {
  const headings: Heading[] = [];
  const re = /<h([23])\s+id="([^"]*)"[^>]*>(.*?)<\/h\1>/gi;
  for (const m of html.matchAll(re)) {
    const text = m[3]!.replace(/<[^>]*>/g, "").trim();
    headings.push({ level: Number(m[1]), text, id: m[2]! });
  }
  return headings;
}

/** Find toc entries that cover a given provision number */
export function findByProvision(toc: TocEntry[], provision: number): TocEntry[] {
  return toc.filter((e) => e.provisions?.includes(provision));
}

export async function getBookContent(
  repoUrl: string,
  fileSlug: string,
  ref = "main",
): Promise<string | null> {
  const { provider: p, repo } = getProvider(repoUrl);
  return p.fetchFile(repo, `content/${fileSlug}.md`, ref);
}

export async function getLawContent(
  repoUrl: string,
  slug: string,
  nr: string,
): Promise<string | null> {
  const { provider: p, repo } = getProvider(repoUrl);
  return p.fetchFile(repo, `${slug}/${nr}.md`);
}

/** List all provision numbers for a law */
export async function getLawProvisions(repoUrl: string, slug: string): Promise<number[]> {
  const { provider: p, repo } = getProvider(repoUrl);
  const files = await p.listFiles(repo, slug);
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
  repoUrl: string,
  year: string,
  issue: string,
  slug: string,
): Promise<string | null> {
  const { provider: p, repo } = getProvider(repoUrl);
  return p.fetchFile(repo, `${year}/${issue}/${slug}.md`);
}
