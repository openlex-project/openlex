/**
 * Build Pagefind search index from all content repos.
 * Run: npx tsx scripts/build-search-index.ts
 * Called automatically via `pnpm run postbuild`.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load .env.local BEFORE any other imports (Next.js does this automatically, tsx doesn't)
for (const envFile of [".env.local", ".env"]) {
  const p = resolve(process.cwd(), envFile);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!;
  }
}

async function main() {
  const { buildRegistry } = await import("../src/lib/registry");
  const { getBookContent, getLawContent, getJournalArticleContent } = await import("../src/lib/content");
  const pagefind = await import("pagefind");
  const { index } = await pagefind.createIndex({ forceLanguage: "de" });
  if (!index) throw new Error("Failed to create pagefind index");

  const registry = await buildRegistry();
  let count = 0;

  for (const [slug, meta] of registry.books) {
    const displayName = meta.title_short ?? meta.title;
    for (const entry of meta.toc) {
      const fileSlug = entry.file.replace(/\.md$/, "");
      const result = await getBookContent(meta.repo, fileSlug);
      if (!result) continue;

      const plain = result.content
        .replace(/^---[\s\S]*?---\n?/, "")
        .replace(/^#+\s+/gm, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[*_`~]/g, "")
        .replace(/:::\s*\w+/g, "")
        .replace(/\{[^}]*\}/g, "");

      await index.addCustomRecord({
        url: `/${slug}/${fileSlug}`,
        content: plain,
        language: "de",
        meta: { title: `${displayName} – ${entry.title}` },
        filters: { type: ["Kommentar"], werk: [displayName] },
      });
      count++;
    }
  }

  for (const [slug, meta] of registry.laws) {
    const displayName = meta.title_short ?? meta.title;
    const unitLabel = meta.unit_type === "article" ? "Art." : "§";
    // Index known law files by listing directory
    const { getProvider } = await import("../src/lib/git-provider");
    const { provider: p, repo } = getProvider(meta.repo);
    const files = await p.listFiles(repo, slug);
    for (const file of files.filter((f) => f.endsWith(".md")).sort()) {
      const nr = file.replace(/\.md$/, "");
      const r = await getLawContent(meta.repo, slug, nr); const content = r?.content ?? null;
      if (!content) continue;

      await index.addCustomRecord({
        url: `/${slug}/${nr}`,
        content,
        language: "de",
        meta: { title: `${unitLabel} ${nr} ${displayName}` },
        filters: { type: ["Gesetz"], gesetz: [displayName] },
      });
      count++;
    }
  }

  for (const [slug, journal] of registry.journals) {
    const displayName = journal.title_short ?? journal.title;
    for (const issue of journal.issues) {
      for (const article of issue.articles) {
        const r2 = await getJournalArticleContent(journal.repo, issue.year, issue.issue, article.slug); const content = r2?.content ?? null;
        if (!content) continue;
        await index.addCustomRecord({
          url: `/${slug}/${issue.year}/${issue.issue}/${article.slug}`,
          content,
          language: "de",
          meta: { title: `${article.authors.map((a) => a.name).join(" / ")}, ${article.title} – ${displayName} ${issue.issue}/${issue.year}` },
          filters: { type: ["Zeitschrift"], werk: [displayName] },
        });
        count++;
      }
    }
  }

  await index.writeFiles({ outputPath: "public/pagefind" });
  await pagefind.close();
  console.log(`Pagefind: ${count} Dokumente indexiert`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
