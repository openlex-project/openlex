import { parse } from "yaml";
import { getProvider } from "./git-provider";
import { loadSiteConfig } from "./site";
import { log } from "./logger";
import { findTocEntry } from "./toc-utils";
import { normalizeI18n, resolveI18n, resolveDisplay, type I18nString } from "./i18n-utils";

/* ─── Types ─── */

export interface TocEntry {
  file: string;
  title: string | I18nString;
  provisions?: number[];
  related?: string[];
  author?: string | { name: string; orcid: string };
  children?: TocEntry[];
}

export interface Heading { level: number; text: string; id: string }

export interface BookMeta {
  slug: string;
  type: "book" | "journal";
  title: I18nString;
  title_short?: I18nString;
  subtitle?: I18nString;
  lang: string;
  license: string;
  category?: string;
  numbering?: string;
  comments_on?: string;
  csl?: string;
  bibliography?: string;
  issn?: string;
  feedback?: boolean;
  translations?: string[];
  editors: { name: string; orcid?: string }[];
}

export interface LawMeta {
  slug: string;
  title: I18nString;
  title_short?: I18nString;
  unit_type: "article" | "section";
  lang: string;
  license?: string;
  category?: string;
  repo: string;
  toc: LawTocNode[];
  feedbackEnabled: boolean;
  translations?: string[];
}

export { resolveDisplay } from "./i18n-utils";

export interface LawTocNode { label?: string | I18nString; title: string | I18nString; nr?: string; children?: LawTocNode[] }

/** LawTocNode after i18n resolution — all fields are plain strings. */
export interface ResolvedLawTocNode { label?: string; title: string; nr?: string; children?: ResolvedLawTocNode[] }

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

interface SyncYaml { laws: Record<string, { title: unknown; title_short?: unknown; unit_type: string; lang: string; license?: string; category?: string; feedback?: boolean; translations?: string[] }> }

async function discoverJournal(repoUrl: string, doiPrefix?: string): Promise<JournalIssue[]> {
  const { provider: p, repo } = getProvider(repoUrl);
  const years = (await p.listDirs(repo, ".")).filter((d) => /^\d{4}$/.test(d)).sort().reverse();
  const issues: JournalIssue[] = [];
  for (const year of years) {
    const nums = (await p.listDirs(repo, year)).sort().reverse();
    for (const issueNr of nums) {
      const raw = await p.fetchFile(repo, `${year}/${issueNr}/issue.yaml`);
      if (!raw) continue;
      const issueMeta = parse(raw) as { articles: { file: string; title: unknown; authors: { name: string; orcid?: string }[]; section: unknown; pages?: string; numbering?: string; doi?: string; related?: string[] }[] };
      if (!issueMeta.articles?.length) continue;
      const defaultLang = "de"; // journal lang comes from meta.yaml, not available here — resolved at render time
      issues.push({ year, issue: issueNr, articles: issueMeta.articles.map((a) => {
        const firstPage = a.pages?.split("-")[0];
        return { slug: a.file.replace(/\.md$/, ""), title: resolveI18n(normalizeI18n(a.title, defaultLang), defaultLang), authors: a.authors, section: resolveI18n(normalizeI18n(a.section, defaultLang), defaultLang) || "Other", pages: a.pages, numbering: a.numbering, doi: a.doi ?? (doiPrefix && firstPage ? `${doiPrefix}.${year}.${firstPage}` : undefined), related: a.related };
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
        const raw = parse(metaRaw) as Record<string, unknown>;
        const lang = (raw.lang as string) ?? "en";
        const meta: BookMeta = {
          ...(raw as unknown as BookMeta),
          title: normalizeI18n(raw.title, lang),
          title_short: raw.title_short ? normalizeI18n(raw.title_short, lang) : undefined,
          subtitle: raw.subtitle ? normalizeI18n(raw.subtitle, lang) : undefined,
        };
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
          const titleI18n = normalizeI18n(law.title, law.lang);
          const titleShortI18n = law.title_short ? normalizeI18n(law.title_short, law.lang) : undefined;
          laws.set(slug, { slug, title: titleI18n, title_short: titleShortI18n, unit_type: law.unit_type as LawMeta["unit_type"], lang: law.lang, license: law.license, category: law.category, repo: repoUrl, toc: tocRaw ? (parse(tocRaw) as LawTocNode[]) : [], feedbackEnabled: !!(p.supportsIssues && law.feedback), translations: law.translations });
        }));
      }
    } catch (err) { log.error(err, "Failed to load content repo: %s", repoUrl); }
  });

  const slugMap = new Map<string, ContentEntry>();
  const locales = (process.env.NEXT_PUBLIC_LOCALES ?? "en").split(",");
  const reserved = new Set(["category", "login", "search", "api", "favicon.svg", "bookmarks", "history", "profile", "feedback", ...locales]);
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
    if (entry.type === "law") return { type: "law", path: `/${path}`, name: `${resolveDisplay(entry.entry).display} ${parts[1] ?? ""}`.trim() };
    if (entry.type === "book") { const toc = findTocEntry(entry.entry.toc, parts.slice(1).join("/")); return { type: "book", path: `/${path}`, name: `${resolveDisplay(entry.entry).display}${toc ? ` – ${toc.title}` : ""}` }; }
    if (entry.type === "journal") return { type: "journal", path: `/${path}`, name: resolveDisplay(entry.entry).display };
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
