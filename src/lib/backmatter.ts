import { getProvider } from "./git-provider";
import { getBookContent } from "./content";
import { createCitationEngine, parseReferencesYaml } from "./citeproc";
import { escapeHtml } from "./escape-html";
import type { TocEntry, BookEntry } from "./registry";

function flatFiles(toc: TocEntry[]): string[] {
  const result: string[] = [];
  for (const e of toc) { result.push(e.file); if (e.children) result.push(...flatFiles(e.children)); }
  return result;
}

export async function collectCitations(repo: string, toc: TocEntry[]): Promise<Set<string>> {
  const keys = new Set<string>();
  const results = await Promise.all(flatFiles(toc).map((f) => getBookContent(repo, f.replace(/\.md$/, ""))));
  const re = /@([a-zA-Z0-9_-]+)/g;
  for (const r of results) { if (!r) continue; for (const m of r.content.matchAll(re)) keys.add(m[1]!); }
  return keys;
}

export function collectAuthors(toc: TocEntry[]): { name: string; orcid?: string }[] {
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

export async function renderBackmatter(section: string, meta: BookEntry): Promise<{ title: string; html: string } | null> {
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
      for (const [title, url] of urlMap) { if (inner.includes(title)) return `<div class="csl-entry"><a href="${escapeHtml(url)}" target="_blank" rel="noopener">${inner}</a></div>`; }
      return match;
    });
    return { title: isCase ? "Rechtsprechungsverzeichnis" : "Literaturverzeichnis", html: bib };
  }
  if (section === "autorenverzeichnis") {
    const authors = collectAuthors(meta.toc);
    if (authors.length === 0) return null;
    const html = `<dl>${authors.map((a) => `<dt><strong>${escapeHtml(a.name)}</strong></dt>${a.orcid ? `<dd>ORCID: <a href="https://orcid.org/${escapeHtml(a.orcid)}">${escapeHtml(a.orcid)}</a></dd>` : ""}`).join("")}</dl>`;
    return { title: "Autorenverzeichnis", html };
  }
  return null;
}
