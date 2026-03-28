import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import dynamic from "next/dynamic";
import { type BookEntry, type ContentRegistry, resolveDisplay } from "@/lib/registry";
import { getBookContent } from "@/lib/content";
import { findTocEntry, findTocNeighbors, extractHeadingsFromHtml, getBackmatterSections, resolveTocTitles } from "@/lib/toc-utils";
import { SetLicense } from "@/components/license-context";
import { getProvider } from "@/lib/git-provider";
import { renderMarkdown } from "@/lib/markdown";
import { renderBackmatter } from "@/lib/backmatter";
import { t, defaultLocale, type Locale } from "@/lib/i18n";
import { SidebarBook } from "@/components/sidebar-book";
import { ContentActions } from "@/components/content-actions";
import { ContentLanguageLinks } from "@/components/content-language-switcher";
import { RelatedContent } from "@/components/related-content";
import { PrevNextNav } from "@/components/prev-next-nav";
import { person, licenseUrl } from "@/lib/jsonld-utils";
import { safeJsonLd } from "@/lib/escape-html";
import type { Metadata } from "next";

const FeedbackButton = dynamic(() => import("@/components/feedback-button").then((m) => m.FeedbackButton));
const FootnoteTooltips = dynamic(() => import("@/components/footnote-tooltips").then((m) => m.FootnoteTooltips));
const HistoryTracker = dynamic(() => import("@/components/history-tracker").then((m) => m.HistoryTracker));

function bookChapterJsonLd(meta: BookEntry, chapter: { title: string; author?: string | { name: string; orcid?: string } }, url: string): string {
  const authors = chapter.author
    ? [person(typeof chapter.author === "string" ? { name: chapter.author } : chapter.author)]
    : meta.editors.map(person);
  return safeJsonLd({
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: chapter.title,
    author: authors,
    isPartOf: { "@type": "Book", name: resolveDisplay(meta).title, editor: meta.editors.map(person), inLanguage: meta.lang, ...(licenseUrl(meta.license) && { license: licenseUrl(meta.license) }) },
    url,
  });
}

interface Props {
  registry: ContentRegistry;
  entry: BookEntry;
  rest: string[];
}

export function bookMetadata(entry: BookEntry, rest: string[], siteName: string): Metadata {
  const { title: bookTitle } = resolveDisplay(entry);
  if (!rest.length) return { title: `${bookTitle} – ${siteName}`, openGraph: { title: bookTitle, images: [`/api/og?title=${encodeURIComponent(bookTitle)}`] } };
  const resolved = resolveTocTitles(entry.toc, entry.lang);
  const chapter = findTocEntry(resolved, rest.join("/"));
  if (!chapter) return {};
  const short = resolveDisplay(entry).display;
  const ct = chapter.title as string;
  const t = `${ct} – ${short}`;
  return { title: `${t} – ${siteName}`, openGraph: { title: t, images: [`/api/og?title=${encodeURIComponent(ct)}&sub=${encodeURIComponent(short)}`] } };
}

const BACKMATTER_SLUGS = new Set(["literaturverzeichnis", "rechtsprechungsverzeichnis", "autorenverzeichnis"]);

function parseSlug(rest: string[]): { fileSlug: string; ref: string } | null {
  if (rest.length === 1) return { fileSlug: rest[0]!, ref: "main" };
  if (rest.length === 2 && /^\d+ed$/.test(rest[0]!)) return { fileSlug: rest[1]!, ref: rest[0]! };
  return null;
}

export default async function BookPage({ registry, entry: meta, rest }: Props) {
  const parsed = parseSlug(rest);
  if (!parsed) notFound();
  const { fileSlug, ref } = parsed;
  const h = await headers();
  const locale = (h.get("x-ui-locale") ?? defaultLocale) as Locale;
  const contentLocale = h.get("x-content-locale");

  const backmatter = getBackmatterSections(meta);
  const work = meta.slug;
  const resolvedToc = resolveTocTitles(meta.toc, contentLocale ?? meta.lang);
  const slugPrefix = ref === "main" ? `/${work}` : `/${work}/${ref}`;

  if (BACKMATTER_SLUGS.has(fileSlug)) {
    const bm = await renderBackmatter(fileSlug, meta);
    if (!bm) notFound();
    return (
      <div className="flex">
        <SidebarBook work={work} toc={resolvedToc} edition={ref} activeSlug={fileSlug} backmatter={backmatter} />
        <article className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
          <h1 className="text-2xl font-bold mb-8">{bm.title}</h1>
          <div className="content-prose" dangerouslySetInnerHTML={{ __html: bm.html }} />
        </article>
      </div>
    );
  }

  const tocEntry = findTocEntry(resolvedToc, fileSlug);
  const { prev, next } = findTocNeighbors(resolvedToc, fileSlug);

  const { provider: p, repo } = getProvider(meta.repo);
  const [result, cslXml, referencesYaml] = await Promise.all([
    getBookContent(meta.repo, fileSlug, ref, contentLocale ?? undefined),
    meta.csl ? p.fetchFile(repo, meta.csl, ref) : null,
    meta.bibliography ? p.fetchFile(repo, meta.bibliography, ref) : null,
  ]);
  if (!result) notFound();

  const html = await renderMarkdown(result.content, {
    numbering: { schema: meta.numbering },
    ...(cslXml && referencesYaml ? { cslXml, referencesYaml } : {}),
    tocAuthor: tocEntry?.author,
    editors: meta.editors,
  });
  const headings = extractHeadingsFromHtml(html);

  const displayName = resolveDisplay(meta).display;
  const edition = ref === "main" ? null : t(locale, "edition.label", { ref: ref.replace("ed", "") });
  const prevHref = prev ? `${slugPrefix}/${prev.file.replace(/\.md$/, "")}` : null;
  const nextHref = next ? `${slugPrefix}/${next.file.replace(/\.md$/, "")}` : null;

  const authorName = tocEntry?.author ? (typeof tocEntry.author === "string" ? tocEntry.author : tocEntry.author.name) : null;
  const authorOrcid = tocEntry?.author && typeof tocEntry.author === "object" ? tocEntry.author.orcid : null;
  const _authorLast = authorName?.split(" ").pop();

  const authorCenter = authorName && (
    authorOrcid ? <a href={`https://orcid.org/${authorOrcid}`} target="_blank" rel="noopener" className="hover:underline">{authorName}</a> : authorName
  );

  return (
    <div className="flex">
      <SidebarBook work={work} toc={resolvedToc} edition={ref} activeSlug={fileSlug} headings={headings} backmatter={backmatter} />
      <article className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        <PrevNextNav position="top" prev={prev ? { href: prevHref!, label: prev.title as string } : null} next={next ? { href: nextHref!, label: next.title as string } : null} center={authorCenter} ariaLabel="Kapitelnavigation" />
        <div className="mb-6 text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
          <span>
            {displayName} – {tocEntry?.title as string ?? fileSlug}
            {edition && <span className="ml-2" style={{ color: "var(--color-accent-600)" }}>({edition})</span>}
            {meta.comments_on && tocEntry?.provisions?.[0] && (
              <> · <Link href={`/${meta.comments_on}/${tocEntry.provisions[0]}`} className="hover:underline" style={{ color: "var(--active-text)" }}>{t(locale, "law.link")}</Link></>
            )}
            <ContentLanguageLinks translations={meta.translations} currentPath={`/${meta.slug}/${fileSlug}`} />
          </span>
          <ContentActions title={`${displayName} – ${tocEntry?.title as string ?? fileSlug}`} contentType="book" />
        </div>
        <RelatedContent links={registry.relatedIndex.get(`/${meta.slug}/${fileSlug}`) ?? []} />
        <div className="content-prose prose-rn" dangerouslySetInnerHTML={{ __html: html }} />
        <PrevNextNav position="bottom" prev={prev ? { href: prevHref!, label: prev.title as string } : null} next={next ? { href: nextHref!, label: next.title as string } : null} ariaLabel="Kapitelnavigation" />
        <SetLicense value={meta.license} />
        {meta.feedbackEnabled && <FeedbackButton repo={meta.repo} />}
        <FootnoteTooltips />
        <HistoryTracker title={`${displayName} – ${tocEntry?.title as string ?? fileSlug}`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: bookChapterJsonLd(meta, { title: tocEntry?.title as string ?? fileSlug, author: tocEntry?.author }, `${slugPrefix}/${fileSlug}`) }} />
      </article>
    </div>
  );
}
