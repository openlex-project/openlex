/**
 * Build Pagefind search index from all content repos.
 * Run: npx tsx scripts/build-search-index.ts
 * Called automatically via `pnpm run postbuild`.
 */
import { buildRegistry, getBookContent, getLawContent } from "../src/lib/registry";
import { listFiles } from "../src/lib/github";

async function main() {
  const pagefind = await import("pagefind");
  const { index } = await pagefind.createIndex({ forceLanguage: "de" });
  if (!index) throw new Error("Failed to create pagefind index");

  const registry = await buildRegistry();
  let count = 0;

  // Index book content
  for (const [slug, meta] of registry.books) {
    const files = await listFiles(meta.repo, "content");
    const mdFiles = files.filter((f) => f.endsWith(".md")).sort();

    for (const file of mdFiles) {
      const nr = file.replace(/\.md$/, "").replace(/-\d+$/, "");
      const content = await getBookContent(meta.repo, slug, nr);
      if (!content) continue;

      // Strip markdown syntax for plain-text indexing
      const plain = content
        .replace(/^---[\s\S]*?---\n?/, "")  // frontmatter
        .replace(/^#+\s+/gm, "")             // headings
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links
        .replace(/[*_`~]/g, "")              // emphasis
        .replace(/:::\s*\w+/g, "")           // directives
        .replace(/\{[^}]*\}/g, "");          // attributes

      await index.addCustomRecord({
        url: `/book/${slug}/${nr}`,
        content: plain,
        language: "de",
        meta: { title: `${meta.abbreviation} – ${nr}`, werk: meta.title },
        filters: { type: ["Kommentar"], werk: [meta.abbreviation] },
      });
      count++;
    }
  }

  // Index law content
  for (const [slug, meta] of registry.laws) {
    const files = await listFiles(meta.repo, slug);
    const mdFiles = files.filter((f) => f.endsWith(".md")).sort();

    for (const file of mdFiles) {
      const nr = file.replace(/\.md$/, "");
      const content = await getLawContent(meta.repo, slug, nr);
      if (!content) continue;

      const unitLabel = meta.unit_type === "article" ? "Art." : "§";
      await index.addCustomRecord({
        url: `/law/${slug}/${nr}`,
        content,
        language: "de",
        meta: { title: `${unitLabel} ${nr} ${meta.abbreviation}` },
        filters: { type: ["Gesetz"], gesetz: [meta.abbreviation] },
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
