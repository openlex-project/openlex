import Link from "next/link";
import { notFound } from "next/navigation";
import { safeJsonLd } from "@/lib/escape-html";
import { type ContentRegistry, type LawMeta } from "@/lib/registry";
import { getLawContent, getLawProvisions } from "@/lib/content";
import { resolveLawVersion } from "@/lib/law-version";
import { getProvider } from "@/lib/git-provider";
import { t, defaultLocale, type Locale } from "@/lib/i18n";
import { headers } from "next/headers";
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
  // Parse @{date} prefix for historical versions: /{law}/@2025-01-15/{nr}
  let nr: string | undefined;
  let ref: string | undefined;
  let versionDate: string | undefined;
  if (rest[0]?.startsWith("@")) {
    versionDate = rest[0].slice(1);
    nr = rest[1];
    const tag = await resolveLawVersion(meta.repo, meta.slug, versionDate);
    if (tag) ref = tag;
    else notFound(); // no version found for this date
  } else {
    nr = rest[0];
  }
  if (!nr) notFound();

  const [text, provisions] = await Promise.all([
    getLawContent(meta.repo, meta.slug, nr, ref),
    getLawProvisions(meta.repo, meta.slug),
  ]);
  if (!text) notFound();

  const h = await headers();
  const locale = (h.get("x-locale") ?? defaultLocale) as Locale;
  // Format date for display according to locale
  const fmtDate = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString(locale, { year: "numeric", month: "2-digit", day: "2-digit" });

  const unitLabel = meta.unit_type === "article" ? "Art." : "§";

  // Fetch available versions for this law
  const { provider: p, repo } = getProvider(meta.repo);
  const tags = await p.listTags(repo, `law/${meta.slug}/`);
  const versions = tags.map((tag) => tag.slice(`law/${meta.slug}/`.length));

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
        {versionDate && (
          <div className="mb-4 rounded-md border px-4 py-3 flex items-start gap-3" style={{ borderColor: "var(--color-brand-400)", background: "oklch(0.95 0.03 50)" }} role="alert">
            <span className="text-lg shrink-0">⚠️</span>
            <div className="text-sm">
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>{t(locale, "law.historicalVersion", { date: fmtDate(versionDate) })}</p>
              <Link href={`/${meta.slug}/${nr}`} className="text-xs hover:underline" style={{ color: "var(--active-text)" }}>{t(locale, "law.currentVersion")}</Link>
            </div>
          </div>
        )}
        {versions.length > 0 && (
          <div className="mb-4 text-xs flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
            <span>{t(locale, "law.versions")}:</span>
            {versions.map((v) => (
              <Link key={v} href={`/${meta.slug}/@${v}/${nr}`} className={`px-1.5 py-0.5 rounded ${versionDate === v ? "font-semibold" : ""}`} style={{ color: versionDate === v ? "var(--active-text)" : "var(--text-tertiary)", background: versionDate === v ? "var(--active-bg)" : undefined }}>{fmtDate(v)}</Link>
            ))}
            {versionDate && <Link href={`/${meta.slug}/${nr}`} className="px-1.5 py-0.5 rounded font-semibold" style={{ color: !versionDate ? "var(--active-text)" : "var(--text-tertiary)" }}>aktuell</Link>}
          </div>
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
