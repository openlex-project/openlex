import { parse } from "yaml";
import { getProvider } from "./git-provider";
import { loadSiteConfig } from "./site";
import { log } from "./logger";
import { findTocEntry } from "./toc-utils";

/* ─── Types ─── */

export interface TocEntry {
  file: string;
  title: string;
  provisions?: number[];
  related?: string[];
  author?: string | { name: string; orcid: string };
  children?: TocEntry[];
}

export interface Heading { level: number; text: string; id: string }

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
  feedback?: boolean;
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
  feedbackEnabled: boolean;
}

export interface LawTocNode { label?: string; title: string; nr?: string; children?: LawTocNode[] }

export interface BookEntry extends BookMeta { repo: string; toc: TocEntry[]; feedbackEnabled: boolean }

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

export interface JournalIssue { year: string; issue: string; articles: JournalArticle[] }

export interface JournalEntry extends BookMeta { repo: string; doi_prefix?: string; issues: JournalIssue[]; feedbackEnabled: boolean }

export type ContentEntry =
  | { type: "book"; entry: BookEntry }
  | { type: "law"; entry: LawMeta }
  | { type: "journal"; entry: JournalEntry };

export interface RelatedLink { type: "book" | "law" | "journal"; path: string; name: string }

export interface ContentRegistry {
  books: Map<string, BookEntry>;
  laws: Map<string, LawMeta>;
  journals: Map<string, JournalEntry>;
  slugMap: Map<string, ContentEntry>;
  relatedIndex: Map<string, RelatedLink[]>;
}

/* ─── Internal ─── */

/** Resolve an i18n field: string or { de: "...", en: "..." } → string */
function resolveI18n(val: string | Record<string, string> | undefined, lang: string): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[lang] ?? val["en"] ?? Object.values(val)[0] ?? "";
}

interface SyncYaml { laws: Record<string, { title: string | Record<string, string>; title_short?: string | Record<string, string>; unit_type: string; lang: string; license?: string; category?: string; feedback?: boolean }> }

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
      issues.push({ year, issue: issueNr, articles: issueMeta.articles.map((a) => {
        const firstPage = a.pages?.split("-")[0];
        return { slug: a.file.replace(/\.md$/, ""), title: a.title, authors: a.authors, section: a.section ?? "Other", pages: a.pages, numbering: a.numbering, doi: a.doi ?? (doiPrefix && firstPage ? `${doiPrefix}.${year}.${firstPage}` : undefined), related: a.related };
      }) });
    }
  }
  return issues;
}

/* ─── Build Registry ─── */

let _cache: { data: ContentRegistry; ts: number } | null = null;
let _pending: Promise<ContentRegistry> | null = null;
const CACHE_TTL = 5 * 60_000;

export async function buildRegistry(): Promise<ContentRegistry> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.data;
  if (_pending) return _pending;
  _pending = _buildRegistry().finally(() => { _pending = null; });
  return _pending;
}

const CONCURRENCY = 5;

async function pooled<T>(items: T[], fn: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length) await fn(queue.shift()!);
  });
  await Promise.all(workers);
}

async function _buildRegistry(): Promise<ContentRegistry> {

  const books = new Map<string, BookEntry>();
  const laws = new Map<string, LawMeta>();
  const journals = new Map<string, JournalEntry>();

  await pooled(loadSiteConfig().content_repos ?? [], async (repoUrl) => {
    try {
      const { provider: p, repo } = getProvider(repoUrl);
      const metaRaw = await p.fetchFile(repo, "meta.yaml");
      if (metaRaw) {
        const meta = parse(metaRaw) as BookMeta;
        if (meta.type === "journal") {
          const jmeta = meta as BookMeta & { doi_prefix?: string };
          journals.set(meta.slug, { ...meta, repo: repoUrl, doi_prefix: jmeta.doi_prefix, issues: await discoverJournal(repoUrl, jmeta.doi_prefix), feedbackEnabled: !!(p.supportsIssues && meta.feedback) });
          return;
        }
        const tocRaw = await p.fetchFile(repo, "toc.yaml");
        const toc: TocEntry[] = tocRaw ? (parse(tocRaw) as { contents: TocEntry[] }).contents : (await p.listFiles(repo, "content")).filter((f) => f.endsWith(".md")).sort().map((f) => ({ file: f, title: f.replace(/\.md$/, "") }));
        books.set(meta.slug, { ...meta, repo: repoUrl, toc, feedbackEnabled: !!(p.supportsIssues && meta.feedback) });
        return;
      }
      const syncRaw = await p.fetchFile(repo, "sync.yaml");
      if (syncRaw) {
        const sync = parse(syncRaw) as SyncYaml;
        await Promise.all(Object.entries(sync.laws).map(async ([slug, law]) => {
          const tocRaw = await p.fetchFile(repo, `${slug}/toc.yaml`);
          laws.set(slug, { slug, title: resolveI18n(law.title, law.lang), title_short: resolveI18n(law.title_short, law.lang) || undefined, unit_type: law.unit_type as LawMeta["unit_type"], lang: law.lang, license: law.license, category: law.category, repo: repoUrl, toc: tocRaw ? (parse(tocRaw) as LawTocNode[]) : [], feedbackEnabled: !!(p.supportsIssues && law.feedback) });
        }));
      }
    } catch (err) { log.error(err, "Failed to load content repo: %s", repoUrl); }
  });

  const slugMap = new Map<string, ContentEntry>();
  const reserved = new Set(["category", "login", "search", "api", "favicon.svg", "bookmarks", "history", "profile", "feedback"]);
  for (const [slug, entry] of books) { if (reserved.has(slug)) throw new Error(`Slug "${slug}" is reserved`); if (slugMap.has(slug)) throw new Error(`Slug collision: "${slug}"`); slugMap.set(slug, { type: "book", entry }); }
  for (const [slug, entry] of laws) { if (reserved.has(slug)) throw new Error(`Slug "${slug}" is reserved`); if (slugMap.has(slug)) throw new Error(`Slug collision: "${slug}"`); slugMap.set(slug, { type: "law", entry }); }
  for (const [slug, entry] of journals) { if (reserved.has(slug)) throw new Error(`Slug "${slug}" is reserved`); if (slugMap.has(slug)) throw new Error(`Slug collision: "${slug}"`); slugMap.set(slug, { type: "journal", entry }); }

  const relatedIndex = buildRelatedIndex(books, journals, slugMap);
  const result = { books, laws, journals, slugMap, relatedIndex };
  _cache = { data: result, ts: Date.now() };
  return result;
}

/* ─── Related Index ─── */

function buildRelatedIndex(books: Map<string, BookEntry>, journals: Map<string, JournalEntry>, slugMap: Map<string, ContentEntry>): Map<string, RelatedLink[]> {
  const index = new Map<string, RelatedLink[]>();
  const add = (_src: string, target: string, link: RelatedLink) => {
    const existing = index.get(target) ?? [];
    if (!existing.some((l) => l.path === link.path)) existing.push(link);
    index.set(target, existing);
  };

  const resolveLink = (path: string): RelatedLink | null => {
    const parts = path.split("/");
    const entry = slugMap.get(parts[0]!);
    if (!entry) return null;
    if (entry.type === "law") return { type: "law", path: `/${path}`, name: `${entry.entry.title_short ?? entry.entry.title} ${parts[1] ?? ""}`.trim() };
    if (entry.type === "book") { const toc = findTocEntry(entry.entry.toc, parts.slice(1).join("/")); return { type: "book", path: `/${path}`, name: `${entry.entry.title_short ?? entry.entry.title}${toc ? ` – ${toc.title}` : ""}` }; }
    if (entry.type === "journal") return { type: "journal", path: `/${path}`, name: entry.entry.title_short ?? entry.entry.title };
    return null;
  };

  // provisions[] → law pages
  for (const [slug, book] of books) {
    if (!book.comments_on) continue;
    const walk = (entries: TocEntry[]) => { for (const e of entries) {
      if (e.provisions) for (const nr of e.provisions) add(`/${slug}/${e.file.replace(/\.md$/, "")}`, `/${book.comments_on}/${nr}`, { type: "book", path: `/${slug}/${e.file.replace(/\.md$/, "")}`, name: `${book.title_short ?? book.title} – ${e.title}` });
      if (e.children) walk(e.children);
    }};
    walk(book.toc);
  }

  // related[] → bidirectional
  for (const [slug, book] of books) {
    const walk = (entries: TocEntry[]) => { for (const e of entries) {
      if (e.related) { const src = `/${slug}/${e.file.replace(/\.md$/, "")}`; const srcLink: RelatedLink = { type: "book", path: src, name: `${book.title_short ?? book.title} – ${e.title}` };
        for (const t of e.related) { const tl = resolveLink(t); if (tl) { add(src, `/${t}`, srcLink); add(`/${t}`, src, tl); } } }
      if (e.children) walk(e.children);
    }};
    walk(book.toc);
  }

  for (const [slug, journal] of journals) {
    for (const iss of journal.issues) for (const art of iss.articles) {
      if (!art.related) continue;
      const src = `/${slug}/${iss.year}/${iss.issue}/${art.slug}`;
      const srcLink: RelatedLink = { type: "journal", path: src, name: `${journal.title_short ?? journal.title} – ${art.title}` };
      for (const t of art.related) { const tl = resolveLink(t); if (tl) { add(src, `/${t}`, srcLink); add(`/${t}`, src, tl); } }
    }
  }

  return index;
}
