import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { type ContentRegistry, type JournalEntry, type JournalArticle } from "@/lib/registry";
import { getJournalArticleContent } from "@/lib/content";
import { SetLicense } from "@/components/license-context";
import { renderMarkdown } from "@/lib/markdown";
import { SidebarJournal } from "@/components/sidebar-journal";
import { t, defaultLocale, type Locale } from "@/lib/i18n";
import Link from "next/link";
import { BookmarkButton } from "@/components/bookmark-button";
import { HistoryTracker } from "@/components/history-tracker";
import { ContentActions } from "@/components/content-actions";
import { PrevNextNav } from "@/components/prev-next-nav";
import { person, licenseUrl } from "@/lib/jsonld-utils";
import { safeJsonLd } from "@/lib/escape-html";
import type { Metadata } from "next";

function articleJsonLd(journal: JournalEntry, article: JournalArticle, year: string, issue: string, url: string): string {
  return safeJsonLd({
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
  const locale = (h.get("x-ui-locale") ?? defaultLocale) as Locale;
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

    const contentLocale = h.get("x-content-locale");
    const result = await getJournalArticleContent(journal.repo, year!, issueNr!, articleSlug!, contentLocale ?? undefined);
    if (!result) notFound();
    const html = await renderMarkdown(result.content, article.numbering ? { numbering: { schema: article.numbering } } : undefined);

    const idx = issue.articles.indexOf(article);
    const prev = issue.articles[idx - 1];
    const next = issue.articles[idx + 1];
    const articleBase = `${base}/${year}/${issueNr}`;

    return (
      <div className="flex">
        <SidebarJournal journal={journal.slug} title={journal.title_short ?? journal.title} issues={journal.issues} issueLabel={issueWord} activeYear={year} activeIssue={issueNr} activeArticle={articleSlug} />
        <article className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
          <PrevNextNav position="top" prev={prev ? { href: `${articleBase}/${prev.slug}`, label: authorLastNames(prev) } : null} next={next ? { href: `${articleBase}/${next.slug}`, label: authorLastNames(next) } : null} center={<AuthorLine article={article} />} ariaLabel="Article navigation" />
          <h1 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2">{article.title}
            <ContentActions title={`${article.title} – ${journal.title_short ?? journal.title}`} contentType="journal" />
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
          <PrevNextNav position="bottom" prev={prev ? { href: `${articleBase}/${prev.slug}`, label: prev.title } : null} next={next ? { href: `${articleBase}/${next.slug}`, label: next.title } : null} ariaLabel="Article navigation" />
          <SetLicense value={journal.license} />
          <HistoryTracker title={article.title} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleJsonLd(journal, article, year!, issueNr!, `${base}/${year}/${issueNr}/${articleSlug}`) }} />
        </article>
      </div>
    );
  }

  notFound();
}
