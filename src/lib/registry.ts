import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export interface BookMeta {
  slug: string;
  type: "book" | "journal";
  title: string;
  abbreviation: string;
  unit_type: "article" | "section" | "chapter";
  lang: string;
  license: string;
  numbering: string;
  comments_on?: string;
  editors: { name: string; orcid: string }[];
}

export interface ContentRegistry {
  books: Map<string, BookMeta>;
}

const FIXTURES_DIR = join(process.cwd(), "fixtures");

function loadBookMeta(dir: string): BookMeta | null {
  const metaPath = join(dir, "meta.yaml");
  if (!existsSync(metaPath)) return null;
  return parse(readFileSync(metaPath, "utf-8")) as BookMeta;
}

let cached: ContentRegistry | null = null;

export function getRegistry(): ContentRegistry {
  if (cached) return cached;

  const books = new Map<string, BookMeta>();

  if (existsSync(FIXTURES_DIR)) {
    for (const entry of readdirSync(FIXTURES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const meta = loadBookMeta(join(FIXTURES_DIR, entry.name));
      if (meta) books.set(meta.slug, meta);
    }
  }

  cached = { books };
  return cached;
}

export function getBookContent(slug: string, nr: string): string | null {
  const dir = join(FIXTURES_DIR, slug, "content");
  if (!existsSync(dir)) return null;

  // Single file: {nr}.md
  const single = join(dir, `${nr}.md`);
  if (existsSync(single)) return readFileSync(single, "utf-8");

  // Split files: {nr}-01.md, {nr}-02.md, ...
  const parts = readdirSync(dir)
    .filter((f) => f.startsWith(`${nr}-`) && f.endsWith(".md"))
    .sort();
  if (parts.length === 0) return null;

  return parts.map((f) => readFileSync(join(dir, f), "utf-8")).join("\n\n");
}
