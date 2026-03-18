/**
 * Build Pagefind search index from all content repos.
 * Run: npx tsx scripts/build-search-index.ts
 * Called automatically via `pnpm run postbuild`.
 */
import { buildRegistry, getBookContent, getLawContent } from "../src/lib/registry";

async function main() {
  const pagefind = await import("pagefind");
  const { index } = await pagefind.createIndex({ forceLanguage: "de" });
  if (!index) throw new Error("Failed to create pagefind index");

  const registry = await buildRegistry();
  let count = 0;

  for (const [slug, meta] of registry.books) {
    const displayName = meta.title_short ?? meta.title;
    for (const entry of meta.toc) {
      const fileSlug = entry.file.replace(/\.md$/, "");
      const content = await getBookContent(meta.repo, fileSlug);
      if (!content) continue;

      const plain = content
        .replace(/^---[\s\S]*?---\n?/, "")
        .replace(/^#+\s+/gm, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[*_`~]/g, "")
        .replace(/:::\s*\w+/g, "")
        .replace(/\{[^}]*\}/g, "");

      await index.addCustomRecord({
        url: `/book/${slug}/${fileSlug}`,
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
    const { listFiles } = await import("../src/lib/github");
    const files = await listFiles(meta.repo, slug);
    for (const file of files.filter((f) => f.endsWith(".md")).sort()) {
      const nr = file.replace(/\.md$/, "");
      const content = await getLawContent(meta.repo, slug, nr);
      if (!content) continue;

      await index.addCustomRecord({
        url: `/law/${slug}/${nr}`,
        content,
        language: "de",
        meta: { title: `${unitLabel} ${nr} ${displayName}` },
        filters: { type: ["Gesetz"], gesetz: [displayName] },
      });
      count++;
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
