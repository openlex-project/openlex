import { notFound } from "next/navigation";
import { buildRegistry, getBookContent, findTocEntry, findTocNeighbors, extractHeadings, getBackmatterSections, type TocEntry, type BookEntry } from "@/lib/registry";
import { fetchFile } from "@/lib/github";
import { renderMarkdown } from "@/lib/markdown";
import { createCitationEngine, parseReferencesYaml } from "@/lib/citeproc";
import { FeedbackButton } from "@/components/feedback-button";
import { BookSidebar } from "@/components/book-sidebar";
import { FootnoteTooltips } from "@/components/footnote-tooltips";

interface Props {
  params: Promise<{ werk: string; slug: string[] }>;
}

const BACKMATTER_SLUGS = new Set(["literaturverzeichnis", "rechtsprechungsverzeichnis", "autorenverzeichnis"]);

/** Parse slug: ["art-5"] → fileSlug=art-5, ref=main; ["1ed", "art-5"] → fileSlug=art-5, ref=1ed */
function parseSlug(slug: string[]): { fileSlug: string; ref: string } | null {
  if (slug.length === 1) return { fileSlug: slug[0]!, ref: "main" };
  if (slug.length === 2 && /^\d+ed$/.test(slug[0]!)) return { fileSlug: slug[1]!, ref: slug[0]! };
  return null;
}

// --- Backmatter helpers ---

function flatFiles(toc: TocEntry[]): string[] {
  const result: string[] = [];
  for (const e of toc) {
    result.push(e.file);
    if (e.children) result.push(...flatFiles(e.children));
  }
  return result;
}

async function collectCitations(repo: string, toc: TocEntry[]): Promise<Set<string>> {
  const keys = new Set<string>();
  const contents = await Promise.all(flatFiles(toc).map((f) => getBookContent(repo, f.replace(/\.md$/, ""))));
  const re = /@([a-zA-Z0-9_-]+)/g;
  for (const md of contents) {
    if (!md) continue;
    for (const m of md.matchAll(re)) keys.add(m[1]!);
  }
  return keys;
}

function collectAuthors(toc: TocEntry[]): { name: string; orcid?: string }[] {
  const seen = new Set<string>();
  const authors: { name: string; orcid?: string }[] = [];
  for (const e of toc) {
    if (e.author) {
      const name = typeof e.author === "string" ? e.author : e.author.name;
      if (!seen.has(name)) {
        seen.add(name);
        authors.push({ name, orcid: typeof e.author === "object" ? e.author.orcid : undefined });
      }
    }
    if (e.children) for (const a of collectAuthors(e.children)) {
      if (!seen.has(a.name)) { seen.add(a.name); authors.push(a); }
    }
  }
  return authors.sort((a, b) => a.name.localeCompare(b.name));
}

async function renderBackmatter(section: string, meta: BookEntry): Promise<{ title: string; html: string } | null> {
  if ((section === "literaturverzeichnis" || section === "rechtsprechungsverzeichnis") && meta.csl && meta.bibliography) {
    const [cslXml, refsYaml] = await Promise.all([
      fetchFile(meta.repo, meta.csl),
      fetchFile(meta.repo, meta.bibliography),
    ]);
    if (!cslXml || !refsYaml) return null;
    const refs = parseReferencesYaml(refsYaml);
    const cited = await collectCitations(meta.repo, meta.toc);
    const isCase = section === "rechtsprechungsverzeichnis";
    const filtered = refs.filter((r) => cited.has(r.id) && (isCase ? r.type === "legal_case" : r.type !== "legal_case"));
    if (filtered.length === 0) return null;
    const engine = createCitationEngine(cslXml, filtered);
    for (const r of filtered) engine.cite(r.id);
    let bib = engine.bibliography() || "";
    // Post-process: link each csl-entry whose ref has a URL
    const urlMap = new Map(filtered.filter((r) => r.URL).map((r) => [r.title as string, r.URL as string]));
    bib = bib.replace(/<div class="csl-entry">(.*?)<\/div>/gs, (match, inner: string) => {
      for (const [title, url] of urlMap) {
        if (inner.includes(title)) {
          return `<div class="csl-entry"><a href="${url}" target="_blank" rel="noopener">${inner}</a></div>`;
        }
      }
      return match;
    });
    return { title: isCase ? "Rechtsprechungsverzeichnis" : "Literaturverzeichnis", html: bib };
  }
  if (section === "autorenverzeichnis") {
    const authors = collectAuthors(meta.toc);
    if (authors.length === 0) return null;
    const html = "<dl>" + authors.map((a) => {
      const desc = a.orcid ? `<dd>ORCID: <a href="https://orcid.org/${a.orcid}">${a.orcid}</a></dd>` : "";
      return `<dt><strong>${a.name}</strong></dt>${desc}`;
    }).join("") + "</dl>";
    return { title: "Autorenverzeichnis", html };
  }
  return null;
}

// --- Main page ---

export default async function BookPage({ params }: Props) {
  const { werk, slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) notFound();
  const { fileSlug, ref } = parsed;

  const registry = await buildRegistry();
  const meta = registry.books.get(werk);
  if (!meta) notFound();

  const backmatter = getBackmatterSections(meta);

  // Backmatter page
  if (BACKMATTER_SLUGS.has(fileSlug)) {
    const bm = await renderBackmatter(fileSlug, meta);
    if (!bm) notFound();
    return (
      <div className="flex">
        <BookSidebar werk={werk} toc={meta.toc} edition={ref} activeSlug={fileSlug} backmatter={backmatter} />
        <article className="flex-1 min-w-0 px-8 lg:px-12 py-8">
          <h1 className="text-2xl font-bold mb-8">{bm.title}</h1>
          <div className="prose prose-gray dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: bm.html }} />
        </article>
      </div>
    );
  }

  // Regular content page
  const tocEntry = findTocEntry(meta.toc, fileSlug);
  const { prev, next } = findTocNeighbors(meta.toc, fileSlug);

  const [markdown, cslXml, referencesYaml] = await Promise.all([
    getBookContent(meta.repo, fileSlug, ref),
    meta.csl ? fetchFile(meta.repo, meta.csl, ref) : null,
    meta.bibliography ? fetchFile(meta.repo, meta.bibliography, ref) : null,
  ]);
  if (!markdown) notFound();

  const headings = extractHeadings(markdown);

  const html = await renderMarkdown(markdown, {
    numbering: { schema: meta.numbering },
    ...(cslXml && referencesYaml ? { cslXml, referencesYaml } : {}),
    tocAuthor: tocEntry?.author,
    editors: meta.editors,
  });

  const displayName = meta.title_short ?? meta.title;
  const edition = ref === "main" ? null : ref.replace("ed", ". Auflage");

  const slugPrefix = ref === "main" ? `/book/${werk}` : `/book/${werk}/${ref}`;
  const prevHref = prev ? `${slugPrefix}/${prev.file.replace(/\.md$/, "")}` : null;
  const nextHref = next ? `${slugPrefix}/${next.file.replace(/\.md$/, "")}` : null;

  const authorName = tocEntry?.author
    ? typeof tocEntry.author === "string" ? tocEntry.author : tocEntry.author.name
    : null;
  const authorOrcid = tocEntry?.author && typeof tocEntry.author === "object" ? tocEntry.author.orcid : null;
  const authorLast = authorName?.split(" ").pop();

  const navBar = (pos: "top" | "bottom") => (
    <nav aria-label={pos === "top" ? "Kapitelnavigation" : "Kapitelnavigation unten"} className={`flex items-center justify-between text-sm ${
      pos === "top" ? "mb-6 pb-3 border-b" : "mt-12 pt-6 border-t"
    }`} style={{ borderColor: "var(--border)" }}>
      {prev ? (
        <a href={prevHref!} className="hover:underline shrink-0" style={{ color: "var(--active-text)" }}>← {prev.title}</a>
      ) : <span />}
      {pos === "top" && authorName && (
        <span className="mx-4" style={{ color: "var(--text-secondary)" }}>
          {authorOrcid ? (
            <a href={`https://orcid.org/${authorOrcid}`} target="_blank" rel="noopener" className="hover:underline">
              <span className="hidden sm:inline">{authorName}</span>
              <span className="sm:hidden">{authorLast}</span>
            </a>
          ) : (
            <>
              <span className="hidden sm:inline">{authorName}</span>
              <span className="sm:hidden">{authorLast}</span>
            </>
          )}
        </span>
      )}
      {next ? (
        <a href={nextHref!} className="hover:underline text-right shrink-0" style={{ color: "var(--active-text)" }}>{next.title} →</a>
      ) : <span />}
    </nav>
  );

  return (
    <div className="flex">
      <BookSidebar werk={werk} toc={meta.toc} edition={ref} activeSlug={fileSlug} headings={headings} backmatter={backmatter} />
      <article className="flex-1 min-w-0 px-8 lg:px-12 py-8">
        {navBar("top")}
        <div className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          {displayName} – {tocEntry?.title ?? fileSlug}
          {edition && <span className="ml-2" style={{ color: "var(--color-accent-600)" }}>({edition})</span>}
          {meta.comments_on && tocEntry?.provisions?.[0] && (
            <> · <a href={`/law/${meta.comments_on}/${tocEntry.provisions[0]}`} className="hover:underline" style={{ color: "var(--active-text)" }}>Gesetzestext →</a></>
          )}
        </div>
        <div
          className="prose prose-gray prose-rn dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {navBar("bottom")}
        <FeedbackButton repo={meta.repo} />
        <FootnoteTooltips />
      </article>
    </div>
  );
}
