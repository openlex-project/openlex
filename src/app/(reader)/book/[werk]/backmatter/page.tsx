import { notFound } from "next/navigation";
import { buildRegistry, getBookContent, getBackmatterSections, type TocEntry } from "@/lib/registry";
import { fetchFile } from "@/lib/github";
import { createCitationEngine, parseReferencesYaml } from "@/lib/citeproc";
import { BookSidebar } from "@/components/book-sidebar";

interface Props {
  params: Promise<{ werk: string }>;
  searchParams: Promise<{ section?: string }>;
}

/** Collect all @citation_key references from all content files */
async function collectCitations(repo: string, toc: TocEntry[]): Promise<Set<string>> {
  const keys = new Set<string>();
  const files = flatFiles(toc);
  const contents = await Promise.all(files.map((f) => getBookContent(repo, f.replace(/\.md$/, ""))));
  const re = /@([a-zA-Z0-9_-]+)/g;
  for (const md of contents) {
    if (!md) continue;
    for (const m of md.matchAll(re)) keys.add(m[1]!);
  }
  return keys;
}

function flatFiles(toc: TocEntry[]): string[] {
  const result: string[] = [];
  for (const e of toc) {
    result.push(e.file);
    if (e.children) result.push(...flatFiles(e.children));
  }
  return result;
}

/** Collect all authors from toc entries */
function collectAuthors(toc: TocEntry[]): { name: string; affiliation?: string; orcid?: string }[] {
  const seen = new Set<string>();
  const authors: { name: string; affiliation?: string; orcid?: string }[] = [];
  for (const e of toc) {
    if (e.author) {
      const name = typeof e.author === "string" ? e.author : e.author.name;
      if (!seen.has(name)) {
        seen.add(name);
        const orcid = typeof e.author === "object" ? e.author.orcid : undefined;
        authors.push({ name, orcid });
      }
    }
    if (e.children) {
      for (const a of collectAuthors(e.children)) {
        if (!seen.has(a.name)) { seen.add(a.name); authors.push(a); }
      }
    }
  }
  return authors.sort((a, b) => a.name.localeCompare(b.name));
}

export default async function BackmatterPage({ params, searchParams }: Props) {
  const { werk } = await params;
  const { section } = await searchParams;
  if (!section) notFound();

  const registry = await buildRegistry();
  const meta = registry.books.get(werk);
  if (!meta) notFound();

  let title = "";
  let html = "";

  if (section === "literaturverzeichnis" && meta.csl && meta.bibliography) {
    title = "Literaturverzeichnis";
    const [cslXml, refsYaml] = await Promise.all([
      fetchFile(meta.repo, meta.csl),
      fetchFile(meta.repo, meta.bibliography),
    ]);
    if (cslXml && refsYaml) {
      const refs = parseReferencesYaml(refsYaml);
      const cited = await collectCitations(meta.repo, meta.toc);
      const engine = createCitationEngine(cslXml, refs);
      // Register all cited keys
      for (const key of cited) engine.cite(key);
      const bib = engine.bibliography();
      html = bib || "<p>Keine Einträge.</p>";
    }
  } else if (section === "autorenverzeichnis") {
    title = "Autorenverzeichnis";
    const authors = collectAuthors(meta.toc);
    if (authors.length === 0) notFound();
    html = "<dl>" + authors.map((a) => {
      let desc = "";
      if (a.orcid) desc += `ORCID: <a href="https://orcid.org/${a.orcid}">${a.orcid}</a>`;
      return `<dt><strong>${a.name}</strong></dt>${desc ? `<dd>${desc}</dd>` : ""}`;
    }).join("") + "</dl>";
  } else {
    notFound();
  }

  return (
    <div className="flex">
      <BookSidebar werk={werk} toc={meta.toc} edition="main" backmatter={getBackmatterSections(meta)} />
      <article className="flex-1 min-w-0 px-8 lg:px-12 py-8">
        <h1 className="text-2xl font-bold mb-8">{title}</h1>
        <div
          className="prose prose-gray dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}
