import Link from "next/link";
import { notFound } from "next/navigation";
import { getLawContent, getLawProvisions, findLawBreadcrumb, type ContentRegistry, type LawMeta } from "@/lib/registry";
import { SetLicense } from "@/components/license-context";
import { SidebarLaw } from "@/components/sidebar-law";
import { BookmarkButton } from "@/components/bookmark-button";
import { HistoryTracker } from "@/components/history-tracker";
import { ShareMenu } from "@/components/share-menu";
import { ExportMenu } from "@/components/export-menu";
import { RelatedContent } from "@/components/related-content";
import { loadSiteConfig } from "@/lib/site";
import { licenseUrl } from "@/lib/jsonld-utils";
import type { Metadata } from "next";

function lawJsonLd(meta: LawMeta, nr: string, url: string): string {
  return JSON.stringify({
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

  const navLink = (href: string, label: string, align?: "right") => (
    <Link href={href} className={`hover:underline shrink-0 ${align === "right" ? "text-right" : ""}`} style={{ color: "var(--active-text)" }}>{label}</Link>
  );
  const site = loadSiteConfig();
  const pageTitle = `${unitLabel} ${nr} ${meta.title_short ?? meta.title}`;

  return (
    <div className="flex">
      <SidebarLaw law={meta.slug} title={meta.title_short ?? meta.title} unitLabel={unitLabel} toc={meta.toc} provisions={provisions} activeNr={nr} />
      <article className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        {breadcrumb.length > 1 && (
          <nav className="text-xs mb-4 flex flex-wrap gap-1" style={{ color: "var(--text-tertiary)" }} aria-label="Breadcrumb">
            <span>{meta.title_short ?? meta.title}</span>
            {breadcrumb.slice(0, -1).map((node, i) => (
              <span key={i}><span className="mx-1">›</span>{node.label}{node.title ? ` ${node.title}` : ""}</span>
            ))}
          </nav>
        )}
        <nav className="flex flex-wrap items-center justify-between gap-2 text-sm mb-6 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          {prevNr !== undefined ? navLink(`/${meta.slug}/${prevNr}`, `← ${unitLabel} ${prevNr}`) : <span />}
          {nextNr !== undefined ? navLink(`/${meta.slug}/${nextNr}`, `${unitLabel} ${nextNr} →`, "right") : <span />}
        </nav>
        <h1 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
          {pageTitle}
          <BookmarkButton title={pageTitle} />
          {site.sharing?.length && <ShareMenu title={pageTitle} siteName={site.name} targets={site.sharing} />}
          {site.export && <ExportMenu formats={site.export.formats} requireAuth={site.export.require_auth} contentType="law" />}
        </h1>
        <RelatedContent links={related} />
        <div className="content-prose whitespace-pre-line">{text}</div>
        <nav className="flex justify-between text-sm mt-12 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
          {prevNr !== undefined ? navLink(`/${meta.slug}/${prevNr}`, `← ${unitLabel} ${prevNr}`) : <span />}
          {nextNr !== undefined ? navLink(`/${meta.slug}/${nextNr}`, `${unitLabel} ${nextNr} →`, "right") : <span />}
        </nav>
        {meta.license && <SetLicense value={meta.license} />}
        <HistoryTracker title={`${unitLabel} ${nr} ${meta.title_short ?? meta.title}`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: lawJsonLd(meta, nr, `/${meta.slug}/${nr}`) }} />
      </article>
    </div>
  );
}
