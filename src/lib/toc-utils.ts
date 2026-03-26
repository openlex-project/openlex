import type { TocEntry, LawTocNode, BookEntry, Heading } from "./registry";

export function findTocEntry(toc: TocEntry[], slug: string): TocEntry | undefined {
  for (const e of toc) {
    if (e.file.replace(/\.md$/, "") === slug) return e;
    if (e.children) {
      const found = findTocEntry(e.children, slug);
      if (found) {
        if (!found.author && e.author) found.author = e.author;
        return found;
      }
    }
  }
  return undefined;
}

export function findTocNeighbors(toc: TocEntry[], slug: string): { prev?: TocEntry; next?: TocEntry } {
  const flat = flattenToc(toc);
  const idx = flat.findIndex((e) => e.file.replace(/\.md$/, "") === slug);
  if (idx < 0) return {};
  return { prev: flat[idx - 1], next: flat[idx + 1] };
}

export function flattenToc(toc: TocEntry[]): TocEntry[] {
  const result: TocEntry[] = [];
  for (const e of toc) { result.push(e); if (e.children) result.push(...flattenToc(e.children)); }
  return result;
}

export function getBackmatterSections(meta: BookEntry): { id: string; title: string }[] {
  const sections: { id: string; title: string }[] = [];
  if (meta.bibliography) {
    sections.push({ id: "literaturverzeichnis", title: "Literaturverzeichnis" });
    sections.push({ id: "rechtsprechungsverzeichnis", title: "Rechtsprechungsverzeichnis" });
  }
  const hasAuthors = meta.toc.some(function check(e: TocEntry): boolean { return !!e.author || (e.children?.some(check) ?? false); });
  if (hasAuthors) sections.push({ id: "autorenverzeichnis", title: "Autorenverzeichnis" });
  return sections;
}

export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  for (const match of markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)) {
    const text = match[2]!.replace(/\{[^}]*\}/g, "").trim();
    const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    headings.push({ level: match[1]!.length, text, id });
  }
  return headings;
}

export function extractHeadingsFromHtml(html: string): Heading[] {
  const headings: Heading[] = [];
  const re = /<h([23])\s+id="([^"]*)"[^>]*>(.*?)<\/h\1>/gi;
  for (const m of html.matchAll(re)) headings.push({ level: Number(m[1]), text: m[3]!.replace(/<[^>]*>/g, "").trim(), id: m[2]! });
  return headings;
}

export function findByProvision(toc: TocEntry[], provision: number): TocEntry[] {
  return toc.filter((e) => e.provisions?.includes(provision));
}

export function findLawBreadcrumb(toc: LawTocNode[], nr: string): LawTocNode[] {
  for (const node of toc) {
    if (node.nr === nr) return [node];
    if (node.children) { const path = findLawBreadcrumb(node.children, nr); if (path.length) return [node, ...path]; }
  }
  return [];
}
