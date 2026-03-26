import { notFound } from "next/navigation";
import { safeJsonLd } from "@/lib/escape-html";
import { type ContentRegistry, type LawMeta } from "@/lib/registry";
import { getLawContent, getLawProvisions } from "@/lib/content";
import { findLawBreadcrumb } from "@/lib/toc-utils";
import { SetLicense } from "@/components/license-context";
import { SidebarLaw } from "@/components/sidebar-law";
import { ContentActions } from "@/components/content-actions";
import { HistoryTracker } from "@/components/history-tracker";
import { RelatedContent } from "@/components/related-content";
import { PrevNextNav } from "@/components/prev-next-nav";
import { licenseUrl } from "@/lib/jsonld-utils";
import type { Metadata } from "next";

function lawJsonLd(meta: LawMeta, nr: string, url: string): string {
  return safeJsonLd({
    "@context": "https://schema.org",
    "@type": "Legislation",
    name: `${meta.unit_type === "article" ? "Art." : "§"} ${nr} ${meta.title}`,
    legislationIdentifier: `${meta.slug}/${nr}`,
    inLanguage: meta.lang,
    url,
    ...(licenseUrl(meta.license) && { license: licenseUrl(meta.license) }),
  });
}

interface Props {
  registry: ContentRegistry;
  entry: LawMeta;
  rest: string[];
}

export function lawMetadata(entry: LawMeta, rest: string[], siteName: string): Metadata {
  if (!rest.length) return { title: `${entry.title} – ${siteName}`, openGraph: { title: entry.title, images: [`/api/og?title=${encodeURIComponent(entry.title)}`] } };
  const nr = rest[0]!;
  const label = `${entry.unit_type === "article" ? "Art." : "§"} ${nr} ${entry.title_short ?? entry.title}`;
  return { title: `${label} – ${siteName}`, openGraph: { title: label, images: [`/api/og?title=${encodeURIComponent(label)}`] } };
}

export default async function LawPage({ registry, entry: meta, rest }: Props) {
  const nr = rest[0];
  if (!nr) notFound();

  const [text, provisions] = await Promise.all([
    getLawContent(meta.repo, meta.slug, nr),
    getLawProvisions(meta.repo, meta.slug),
  ]);
  if (!text) notFound();

  const unitLabel = meta.unit_type === "article" ? "Art." : "§";

  const related = registry.relatedIndex.get(`/${meta.slug}/${nr}`) ?? [];

  const breadcrumb = findLawBreadcrumb(meta.toc, nr);
  const idx = provisions.indexOf(parseInt(nr, 10));
  const prevNr = provisions[idx - 1];
  const nextNr = provisions[idx + 1];

  const prevNav = prevNr !== undefined ? { href: `/${meta.slug}/${prevNr}`, label: `${unitLabel} ${prevNr}` } : null;
  const nextNav = nextNr !== undefined ? { href: `/${meta.slug}/${nextNr}`, label: `${unitLabel} ${nextNr}` } : null;
  const pageTitle = `${unitLabel} ${nr} ${meta.title_short ?? meta.title}`;

  return (
    <div className="flex">
      <SidebarLaw law={meta.slug} title={meta.title_short ?? meta.title} unitLabel={unitLabel} toc={meta.toc} provisions={provisions} activeNr={nr} />
      <article className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        {breadcrumb.length > 1 && (
          <nav className="text-xs mb-4 flex flex-wrap gap-1" style={{ color: "var(--text-tertiary)" }} aria-label="Breadcrumb">
            <span>{meta.title_short ?? meta.title}</span>
            {breadcrumb.slice(0, -1).map((node, i) => (
              <span key={i}><span className="mx-1" aria-hidden="true">›</span>{node.label}{node.title ? ` ${node.title}` : ""}</span>
            ))}
          </nav>
        )}
        <PrevNextNav position="top" prev={prevNav} next={nextNav} ariaLabel="Provision navigation" />
        <h1 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
          {pageTitle}
          <ContentActions title={pageTitle} contentType="law" />
        </h1>
        <RelatedContent links={related} />
        <div className="content-prose whitespace-pre-line">{text}</div>
        <PrevNextNav position="bottom" prev={prevNav} next={nextNav} ariaLabel="Provision navigation" />
        {meta.license && <SetLicense value={meta.license} />}
        <HistoryTracker title={`${unitLabel} ${nr} ${meta.title_short ?? meta.title}`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: lawJsonLd(meta, nr, `/${meta.slug}/${nr}`) }} />
      </article>
    </div>
  );
}
