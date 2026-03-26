import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import dynamic from "next/dynamic";
import { type TocEntry, type BookEntry, type ContentRegistry } from "@/lib/registry";
import { getBookContent } from "@/lib/content";
import { findTocEntry, findTocNeighbors, extractHeadingsFromHtml, getBackmatterSections } from "@/lib/toc-utils";
import { SetLicense } from "@/components/license-context";
import { getProvider } from "@/lib/git-provider";
import { renderMarkdown } from "@/lib/markdown";
import { createCitationEngine, parseReferencesYaml } from "@/lib/citeproc";
import { t, defaultLocale, type Locale } from "@/lib/i18n";
import { SidebarBook } from "@/components/sidebar-book";
import { ContentActions } from "@/components/content-actions";
import { RelatedContent } from "@/components/related-content";
import { PrevNextNav } from "@/components/prev-next-nav";
import { person, licenseUrl } from "@/lib/jsonld-utils";
import type { Metadata } from "next";

const FeedbackButton = dynamic(() => import("@/components/feedback-button").then((m) => m.FeedbackButton));
const FootnoteTooltips = dynamic(() => import("@/components/footnote-tooltips").then((m) => m.FootnoteTooltips));
const HistoryTracker = dynamic(() => import("@/components/history-tracker").then((m) => m.HistoryTracker));

function bookChapterJsonLd(meta: BookEntry, chapter: { title: string; author?: string | { name: string; orcid?: string } }, url: string): string {
  const authors = chapter.author
    ? [person(typeof chapter.author === "string" ? { name: chapter.author } : chapter.author)]
    : meta.editors.map(person);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: chapter.title,
    author: authors,
    isPartOf: { "@type": "Book", name: meta.title, editor: meta.editors.map(person), inLanguage: meta.lang, ...(licenseUrl(meta.license) && { license: licenseUrl(meta.license) }) },
    url,
  });
}

interface Props {
  registry: ContentRegistry;
  entry: BookEntry;
  rest: string[];
}

export function bookMetadata(entry: BookEntry, rest: string[], siteName: string): Metadata {
  if (!rest.length) return { title: `${entry.title} – ${siteName}`, openGraph: { title: entry.title, images: [`/api/og?title=${encodeURIComponent(entry.title)}`] } };
  const chapter = findTocEntry(entry.toc, rest.join("/"));
  if (!chapter) return {};
  const short = entry.title_short ?? entry.title;
  const t = `${chapter.title} – ${short}`;
  return { title: `${t} – ${siteName}`, openGraph: { title: t, images: [`/api/og?title=${encodeURIComponent(chapter.title)}&sub=${encodeURIComponent(short)}`] } };
}

const BACKMATTER_SLUGS = new Set(["literaturverzeichnis", "rechtsprechungsverzeichnis", "autorenverzeichnis"]);

function parseSlug(rest: string[]): { fileSlug: string; ref: string } | null {
  if (rest.length === 1) return { fileSlug: rest[0]!, ref: "main" };
  if (rest.length === 2 && /^\d+ed$/.test(rest[0]!)) return { fileSlug: rest[1]!, ref: rest[0]! };
  return null;
}

function flatFiles(toc: TocEntry[]): string[] {
  const result: string[] = [];
  for (const e of toc) { result.push(e.file); if (e.children) result.push(...flatFiles(e.children)); }
  return result;
}

async function collectCitations(repo: string, toc: TocEntry[]): Promise<Set<string>> {
  const keys = new Set<string>();
  const contents = await Promise.all(flatFiles(toc).map((f) => getBookContent(repo, f.replace(/\.md$/, ""))));
  const re = /@([a-zA-Z0-9_-]+)/g;
  for (const md of contents) { if (!md) continue; for (const m of md.matchAll(re)) keys.add(m[1]!); }
  return keys;
}

function collectAuthors(toc: TocEntry[]): { name: string; orcid?: string }[] {
  const seen = new Set<string>();
  const authors: { name: string; orcid?: string }[] = [];
  for (const e of toc) {
    if (e.author) {
      const name = typeof e.author === "string" ? e.author : e.author.name;
      if (!seen.has(name)) { seen.add(name); authors.push({ name, orcid: typeof e.author === "object" ? e.author.orcid : undefined }); }
    }
    if (e.children) for (const a of collectAuthors(e.children)) { if (!seen.has(a.name)) { seen.add(a.name); authors.push(a); } }
  }
  return authors.sort((a, b) => a.name.localeCompare(b.name));
}

async function renderBackmatter(section: string, meta: BookEntry): Promise<{ title: string; html: string } | null> {
  if ((section === "literaturverzeichnis" || section === "rechtsprechungsverzeichnis") && meta.csl && meta.bibliography) {
    const { provider: p, repo } = getProvider(meta.repo);
    const [cslXml, refsYaml] = await Promise.all([p.fetchFile(repo, meta.csl), p.fetchFile(repo, meta.bibliography)]);
    if (!cslXml || !refsYaml) return null;
    const refs = parseReferencesYaml(refsYaml);
    const cited = await collectCitations(meta.repo, meta.toc);
    const isCase = section === "rechtsprechungsverzeichnis";
    const filtered = refs.filter((r) => cited.has(r.id) && (isCase ? r.type === "legal_case" : r.type !== "legal_case"));
    if (filtered.length === 0) return null;
    const engine = createCitationEngine(cslXml, filtered);
    for (const r of filtered) engine.cite(r.id);
    let bib = engine.bibliography() || "";
    const urlMap = new Map(filtered.filter((r) => r.URL).map((r) => [r.title as string, r.URL as string]));
    bib = bib.replace(/<div class="csl-entry">(.*?)<\/div>/gs, (match, inner: string) => {
      for (const [title, url] of urlMap) { if (inner.includes(title)) return `<div class="csl-entry"><a href="${url}" target="_blank" rel="noopener">${inner}</a></div>`; }
      return match;
    });
    return { title: isCase ? "Rechtsprechungsverzeichnis" : "Literaturverzeichnis", html: bib };
  }
  if (section === "autorenverzeichnis") {
    const authors = collectAuthors(meta.toc);
    if (authors.length === 0) return null;
    const html = "<dl>" + authors.map((a) => `<dt><strong>${a.name}</strong></dt>${a.orcid ? `<dd>ORCID: <a href="https://orcid.org/${a.orcid}">${a.orcid}</a></dd>` : ""}`).join("") + "</dl>";
    return { title: "Autorenverzeichnis", html };
  }
  return null;
}

export default async function BookPage({ registry, entry: meta, rest }: Props) {
  const parsed = parseSlug(rest);
  if (!parsed) notFound();
  const { fileSlug, ref } = parsed;
  const h = await headers();
  const locale = (h.get("x-locale") ?? defaultLocale) as Locale;

  const backmatter = getBackmatterSections(meta);
  const work = meta.slug;
  const slugPrefix = ref === "main" ? `/${work}` : `/${work}/${ref}`;

  if (BACKMATTER_SLUGS.has(fileSlug)) {
    const bm = await renderBackmatter(fileSlug, meta);
    if (!bm) notFound();
    return (
      <div className="flex">
        <SidebarBook work={work} toc={meta.toc} edition={ref} activeSlug={fileSlug} backmatter={backmatter} />
        <article className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
          <h1 className="text-2xl font-bold mb-8">{bm.title}</h1>
          <div className="content-prose" dangerouslySetInnerHTML={{ __html: bm.html }} />
        </article>
      </div>
    );
  }

  const tocEntry = findTocEntry(meta.toc, fileSlug);
  const { prev, next } = findTocNeighbors(meta.toc, fileSlug);

  const { provider: p, repo } = getProvider(meta.repo);
  const [markdown, cslXml, referencesYaml] = await Promise.all([
    getBookContent(meta.repo, fileSlug, ref),
    meta.csl ? p.fetchFile(repo, meta.csl, ref) : null,
    meta.bibliography ? p.fetchFile(repo, meta.bibliography, ref) : null,
  ]);
  if (!markdown) notFound();

  const html = await renderMarkdown(markdown, {
    numbering: { schema: meta.numbering },
    ...(cslXml && referencesYaml ? { cslXml, referencesYaml } : {}),
    tocAuthor: tocEntry?.author,
    editors: meta.editors,
  });
  const headings = extractHeadingsFromHtml(html);

  const displayName = meta.title_short ?? meta.title;
  const edition = ref === "main" ? null : t(locale, "edition.label", { ref: ref.replace("ed", "") });
  const prevHref = prev ? `${slugPrefix}/${prev.file.replace(/\.md$/, "")}` : null;
  const nextHref = next ? `${slugPrefix}/${next.file.replace(/\.md$/, "")}` : null;

  const authorName = tocEntry?.author ? (typeof tocEntry.author === "string" ? tocEntry.author : tocEntry.author.name) : null;
  const authorOrcid = tocEntry?.author && typeof tocEntry.author === "object" ? tocEntry.author.orcid : null;
  const authorLast = authorName?.split(" ").pop();

  const authorCenter = authorName && (
    authorOrcid ? <a href={`https://orcid.org/${authorOrcid}`} target="_blank" rel="noopener" className="hover:underline">{authorName}</a> : authorName
  );

  return (
    <div className="flex">
      <SidebarBook work={work} toc={meta.toc} edition={ref} activeSlug={fileSlug} headings={headings} backmatter={backmatter} />
      <article className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        <PrevNextNav position="top" prev={prev ? { href: prevHref!, label: prev.title } : null} next={next ? { href: nextHref!, label: next.title } : null} center={authorCenter} ariaLabel="Kapitelnavigation" />
        <div className="mb-6 text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
          <span>
            {displayName} – {tocEntry?.title ?? fileSlug}
            {edition && <span className="ml-2" style={{ color: "var(--color-accent-600)" }}>({edition})</span>}
            {meta.comments_on && tocEntry?.provisions?.[0] && (
              <> · <Link href={`/${meta.comments_on}/${tocEntry.provisions[0]}`} className="hover:underline" style={{ color: "var(--active-text)" }}>{t(locale, "law.link")}</Link></>
            )}
          </span>
          <ContentActions title={`${displayName} – ${tocEntry?.title ?? fileSlug}`} contentType="book" />
        </div>
        <RelatedContent links={registry.relatedIndex.get(`/${meta.slug}/${fileSlug}`) ?? []} />
        <div className="content-prose prose-rn" dangerouslySetInnerHTML={{ __html: html }} />
        <PrevNextNav position="bottom" prev={prev ? { href: prevHref!, label: prev.title } : null} next={next ? { href: nextHref!, label: next.title } : null} ariaLabel="Kapitelnavigation" />
        <SetLicense value={meta.license} />
        <FeedbackButton repo={meta.repo} />
        <FootnoteTooltips />
        <HistoryTracker title={`${displayName} – ${tocEntry?.title ?? fileSlug}`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: bookChapterJsonLd(meta, { title: tocEntry?.title ?? fileSlug, author: tocEntry?.author }, `${slugPrefix}/${fileSlug}`) }} />
      </article>
    </div>
  );
}
