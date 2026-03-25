import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { getJournalArticleContent, type ContentRegistry, type JournalEntry, type JournalArticle } from "@/lib/registry";
import { SetLicense } from "@/components/license-context";
import { renderMarkdown } from "@/lib/markdown";
import { SidebarJournal } from "@/components/sidebar-journal";
import { t, defaultLocale, type Locale } from "@/lib/i18n";
import Link from "next/link";
import { BookmarkButton } from "@/components/bookmark-button";
import { HistoryTracker } from "@/components/history-tracker";
import { ShareMenu } from "@/components/share-menu";
import { ExportMenu } from "@/components/export-menu";
import { loadSiteConfig } from "@/lib/site";
import { person, licenseUrl } from "@/lib/jsonld-utils";
import type { Metadata } from "next";

function articleJsonLd(journal: JournalEntry, article: JournalArticle, year: string, issue: string, url: string): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: article.title,
    author: article.authors.map(person),
    isPartOf: {
      "@type": "Periodical",
      name: journal.title,
      ...(journal.issn && { issn: journal.issn }),
    },
    ...(article.doi && { identifier: { "@type": "PropertyValue", propertyID: "DOI", value: article.doi } }),
    ...(article.pages && { pagination: article.pages }),
    datePublished: year,
    url,
    ...(licenseUrl(journal.license) && { license: licenseUrl(journal.license) }),
  });
}

interface Props {
  registry: ContentRegistry;
  entry: JournalEntry;
  rest: string[];
}

export function journalMetadata(entry: JournalEntry, rest: string[], siteName: string): Metadata {
  const short = entry.title_short ?? entry.title;
  if (rest.length >= 3) {
    const [year, issue, artSlug] = rest;
    const iss = entry.issues.find((i) => i.year === year && i.issue === issue);
    const art = iss?.articles.find((a) => a.slug === artSlug);
    if (art) {
      return { title: `${art.title} – ${short} – ${siteName}`, openGraph: { title: art.title, description: art.authors.map((a) => a.name).join(", "), images: [`/api/og?title=${encodeURIComponent(art.title)}&sub=${encodeURIComponent(short)}`] } };
    }
  }
  return { title: `${entry.title} – ${siteName}`, openGraph: { title: entry.title, images: [`/api/og?title=${encodeURIComponent(entry.title)}`] } };
}

function authorNames(a: JournalArticle) {
  return a.authors.map((au) => au.name).join(" / ");
}

function authorLastNames(a: JournalArticle) {
  return a.authors.map((au) => au.name.split(" ").pop()).join("/");
}

function AuthorLine({ article }: { article: JournalArticle }) {
  return (
    <span>
      {article.authors.map((au, i) => (
        <span key={au.name}>
          {i > 0 && " / "}
          {au.orcid ? (
            <a href={`https://orcid.org/${au.orcid}`} target="_blank" rel="noopener" className="hover:underline">{au.name}</a>
          ) : au.name}
        </span>
      ))}
    </span>
  );
}

export default async function JournalPage({ registry, entry: journal, rest }: Props) {
  const h = await headers();
  const locale = (h.get("x-locale") ?? defaultLocale) as Locale;
  const base = `/${journal.slug}`;
  const issueWord = t(locale, "issue.word");

  // Overview
  if (rest.length === 0) {
    return (
      <div className="flex">
        <SidebarJournal journal={journal.slug} title={journal.title_short ?? journal.title} issues={journal.issues} issueLabel={issueWord} />
        <article className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
          <h1 className="text-2xl font-bold mb-1">{journal.title}</h1>
          {journal.issn && <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>ISSN {journal.issn}</p>}
          <div className="space-y-6">
            {journal.issues.map((iss) => (
              <section key={`${iss.year}-${iss.issue}`}>
                <h2 className="text-lg font-semibold mb-2">
                  <Link href={`${base}/${iss.year}/${iss.issue}`} className="hover:underline">{t(locale, "issue.label", { issue: iss.issue, year: iss.year })}</Link>
                </h2>
                <ul className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
                  {iss.articles.map((a) => (
                    <li key={a.slug}>
                      <Link href={`${base}/${iss.year}/${iss.issue}/${a.slug}`} className="hover:underline">{authorNames(a)}, {a.title}</Link>
                      {a.pages && <span className="ml-1" style={{ color: "var(--text-tertiary)" }}>{t(locale, "page.abbr")} {a.pages}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </article>
      </div>
    );
  }

  // Issue: /{year}/{issue}
  if (rest.length === 2) {
    const [year, issueNr] = rest;
    const issue = journal.issues.find((i) => i.year === year && i.issue === issueNr);

    if (!issue) {
      const page = parseInt(issueNr!, 10);
      if (isNaN(page)) notFound();
      for (const iss of journal.issues.filter((i) => i.year === year)) {
        for (const a of iss.articles) {
          if (!a.pages) continue;
          const [start, end] = a.pages.split("-").map(Number);
          if (page >= start! && page <= (end ?? start!)) redirect(`${base}/${iss.year}/${iss.issue}/${a.slug}`);
        }
      }
      notFound();
    }

    const sections = new Map<string, typeof issue.articles>();
    for (const a of issue.articles) {
      const list = sections.get(a.section) ?? [];
      list.push(a);
      sections.set(a.section, list);
    }

    return (
      <div className="flex">
        <SidebarJournal journal={journal.slug} title={journal.title_short ?? journal.title} issues={journal.issues} issueLabel={issueWord} activeYear={year} activeIssue={issueNr} />
        <article className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
          <h1 className="text-2xl font-bold mb-1">{journal.title_short ?? journal.title} {t(locale, "issue.label", { issue: issueNr!, year: year! })}</h1>
          <div className="space-y-6 mt-6">
            {[...sections.entries()].map(([section, articles]) => (
              <section key={section}>
                <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>{section}</h2>
                <ul className="space-y-3">
                  {articles.map((a) => (
                    <li key={a.slug}>
                      <Link href={`${base}/${year}/${issueNr}/${a.slug}`} className="group block">
                        <span className="font-medium group-hover:underline">{a.title}</span>
                        <br />
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{authorNames(a)}{a.pages && `, ${t(locale, "page.abbr")} ${a.pages}`}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </article>
      </div>
    );
  }

  // Article: /{year}/{issue}/{article}
  if (rest.length === 3) {
    const [year, issueNr, articleSlug] = rest;
    const issue = journal.issues.find((i) => i.year === year && i.issue === issueNr);
    if (!issue) notFound();
    const article = issue.articles.find((a) => a.slug === articleSlug);
    if (!article) notFound();

    const md = await getJournalArticleContent(journal.repo, year!, issueNr!, articleSlug!);
    if (!md) notFound();
    const html = await renderMarkdown(md, article.numbering ? { numbering: { schema: article.numbering } } : undefined);
    const site = loadSiteConfig();

    const idx = issue.articles.indexOf(article);
    const prev = issue.articles[idx - 1];
    const next = issue.articles[idx + 1];
    const articleBase = `${base}/${year}/${issueNr}`;

    return (
      <div className="flex">
        <SidebarJournal journal={journal.slug} title={journal.title_short ?? journal.title} issues={journal.issues} issueLabel={issueWord} activeYear={year} activeIssue={issueNr} activeArticle={articleSlug} />
        <article className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
          <nav aria-label="Article navigation" className="flex flex-wrap items-center justify-between gap-2 text-sm mb-6 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
            {prev ? <Link href={`${articleBase}/${prev.slug}`} className="hover:underline shrink-0 max-w-[45%] truncate" style={{ color: "var(--active-text)" }}>← {authorLastNames(prev)}</Link> : <span />}
            <span className="hidden sm:block truncate mx-4" style={{ color: "var(--text-secondary)" }}><AuthorLine article={article} /></span>
            {next ? <Link href={`${articleBase}/${next.slug}`} className="hover:underline text-right shrink-0 max-w-[45%] truncate" style={{ color: "var(--active-text)" }}>{authorLastNames(next)} →</Link> : <span />}
          </nav>
          <h1 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2">{article.title} <BookmarkButton title={`${article.title} – ${journal.title_short ?? journal.title}`} />
            {site.sharing?.length && <ShareMenu title={article.title} siteName={site.name} targets={site.sharing} />}
            {site.export && <ExportMenu formats={site.export.formats} requireAuth={site.export.require_auth} contentType="journal" />}
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            <AuthorLine article={article} />
            {article.pages && ` · ${t(locale, "page.abbr")} ${article.pages}`}
            {` · ${journal.title_short ?? journal.title} ${issueNr}/${year}`}
            {article.doi && (
              <> · <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener" className="hover:underline" style={{ color: "var(--active-text)" }}>DOI: {article.doi}</a></>
            )}
          </p>
          <div className="content-prose" dangerouslySetInnerHTML={{ __html: html }} />
          <nav aria-label="Article navigation" className="flex justify-between text-sm mt-12 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
            {prev ? <Link href={`${articleBase}/${prev.slug}`} className="hover:underline" style={{ color: "var(--active-text)" }}>← {prev.title}</Link> : <span />}
            {next ? <Link href={`${articleBase}/${next.slug}`} className="hover:underline text-right" style={{ color: "var(--active-text)" }}>{next.title} →</Link> : <span />}
          </nav>
          <SetLicense value={journal.license} />
          <HistoryTracker title={article.title} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleJsonLd(journal, article, year!, issueNr!, `${base}/${year}/${issueNr}/${articleSlug}`) }} />
        </article>
      </div>
    );
  }

  notFound();
}
