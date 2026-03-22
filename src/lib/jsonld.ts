import type { BookEntry, LawMeta, JournalEntry, JournalArticle } from "./registry";
import { loadSiteConfig } from "./site";

type JsonLd = Record<string, unknown>;

function person(p: { name: string; orcid?: string }): JsonLd {
  const o: JsonLd = { "@type": "Person", name: p.name };
  if (p.orcid) o.url = `https://orcid.org/${p.orcid}`;
  return o;
}

function licenseUrl(license?: string): string | undefined {
  if (!license) return undefined;
  const l = license.toLowerCase().replace(/ /g, "-");
  if (l.startsWith("cc-")) return `https://creativecommons.org/licenses/${l.replace("cc-", "")}/4.0/`;
  return undefined;
}

export function websiteJsonLd(url: string): string {
  const site = loadSiteConfig();
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url,
    description: site.tagline[site.default_locale] ?? Object.values(site.tagline)[0],
  });
}

export function bookChapterJsonLd(meta: BookEntry, chapter: { title: string; author?: string | { name: string; orcid?: string } }, url: string): string {
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

export function lawJsonLd(meta: LawMeta, nr: string, url: string): string {
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

export function articleJsonLd(journal: JournalEntry, article: JournalArticle, year: string, issue: string, url: string): string {
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
