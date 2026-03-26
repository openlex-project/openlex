import { NextRequest, NextResponse } from "next/server";
import { buildRegistry, getBookContent, getLawContent, type TocEntry } from "@/lib/registry";
import { getProvider } from "@/lib/git-provider";
import { loadSiteConfig } from "@/lib/site";
import { withSession } from "@/lib/api-utils";
import { exportMarkdown } from "@/lib/export-md";
import { log } from "@/lib/logger";

export const GET = withSession("export GET", async (req, email) => {
    const site = loadSiteConfig();
    const exportConfig = site.features?.export;
    if (!exportConfig) return NextResponse.json({ error: "Export disabled" }, { status: 404 });

    if (exportConfig.require_auth && !email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams: sp } = req.nextUrl;
    const path = sp.get("path");
    const format = sp.get("format") ?? "md";
    const scope = sp.get("scope") ?? "page";

    if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });
    if (!exportConfig.formats.includes(format)) return NextResponse.json({ error: "Unsupported format" }, { status: 400 });

    const segments = path.replace(/^\//, "").split("/");
    const registry = await buildRegistry();
    const content = registry.slugMap.get(segments[0]!);
    if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let pages: { title: string; markdown: string }[] = [];

    if (content.type === "book") {
      const entry = content.entry;
      if (scope === "chapter") {
        pages = await collectBookChapter(entry.repo, entry.toc, segments[1]);
      } else {
        const fileSlug = segments.slice(1).join("/");
        const raw = await getBookContent(entry.repo, fileSlug);
        if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });
        pages = [{ title: fileSlug, markdown: raw }];
      }
    } else if (content.type === "law") {
      const entry = content.entry;
      if (scope === "law") {
        const { provider: p, repo } = getProvider(entry.repo);
        const files = await p.listFiles(repo, entry.slug);
        const nrs = files.filter((f) => f.endsWith(".md")).sort((a, b) => parseInt(a) - parseInt(b));
        for (const f of nrs) {
          const raw = await getLawContent(entry.repo, entry.slug, f.replace(/\.md$/, ""));
          if (raw) pages.push({ title: f.replace(/\.md$/, ""), markdown: raw });
        }
      } else {
        const nr = segments[1];
        const raw = await getLawContent(entry.repo, entry.slug, nr!);
        if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });
        pages = [{ title: nr!, markdown: raw }];
      }
    } else if (content.type === "journal") {
      const fileSlug = segments.slice(1).join("/");
      const raw = await getBookContent(content.entry.repo, fileSlug);
      if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });
      pages = [{ title: fileSlug, markdown: raw }];
    }

    if (!pages.length) return NextResponse.json({ error: "No content" }, { status: 404 });

    const filename = `${segments.join("-")}.${format}`;

    if (format === "md") {
      const body = pages.map((p) => exportMarkdown(p.markdown)).join("\n\n---\n\n");
      return new NextResponse(body, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` } });
    }

    if (format === "docx") {
      const { exportDocx } = await import("@/lib/export-docx");
      const buf = await exportDocx(pages);
      return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="${filename}"` } });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
});

async function collectBookChapter(repo: string, toc: TocEntry[], rootSlug?: string): Promise<{ title: string; markdown: string }[]> {
  const pages: { title: string; markdown: string }[] = [];
  const collect = async (entries: TocEntry[]) => {
    for (const e of entries) {
      const slug = e.file.replace(/\.md$/, "");
      if (rootSlug && slug !== rootSlug && !pages.length) { if (e.children) await collect(e.children); continue; }
      const raw = await getBookContent(repo, slug);
      if (raw) pages.push({ title: e.title, markdown: raw });
      if (e.children) await collect(e.children);
      if (rootSlug && pages.length && !e.children) break;
    }
  };
  await collect(toc);
  return pages;
}
