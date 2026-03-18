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

export interface LawMeta {
  slug: string;
  title: string;
  abbreviation: string;
  unit_type: "article" | "section" | "chapter";
  lang: string;
}

interface SyncYaml {
  laws: Record<string, {
    title: string;
    abbreviation: string;
    unit_type: string;
    lang: string;
  }>;
}

export interface ContentRegistry {
  books: Map<string, BookMeta>;
  laws: Map<string, LawMeta>;
}

const FIXTURES_DIR = join(process.cwd(), "fixtures");

let cached: ContentRegistry | null = null;

export function getRegistry(): ContentRegistry {
  if (cached) return cached;

  const books = new Map<string, BookMeta>();
  const laws = new Map<string, LawMeta>();

  if (existsSync(FIXTURES_DIR)) {
    for (const entry of readdirSync(FIXTURES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = join(FIXTURES_DIR, entry.name);

      // Book repo: has meta.yaml
      const metaPath = join(dir, "meta.yaml");
      if (existsSync(metaPath)) {
        const meta = parse(readFileSync(metaPath, "utf-8")) as BookMeta;
        books.set(meta.slug, meta);
        continue;
      }

      // Law repo: has sync.yaml
      const syncPath = join(dir, "sync.yaml");
      if (existsSync(syncPath)) {
        const sync = parse(readFileSync(syncPath, "utf-8")) as SyncYaml;
        for (const [slug, law] of Object.entries(sync.laws)) {
          laws.set(slug, {
            slug,
            title: law.title,
            abbreviation: law.abbreviation,
            unit_type: law.unit_type as LawMeta["unit_type"],
            lang: law.lang,
          });
        }
      }
    }
  }

  cached = { books, laws };
  return cached;
}

export function getBookContent(slug: string, nr: string): string | null {
  const dir = join(FIXTURES_DIR, slug, "content");
  if (!existsSync(dir)) return null;

  const single = join(dir, `${nr}.md`);
  if (existsSync(single)) return readFileSync(single, "utf-8");

  const parts = readdirSync(dir)
    .filter((f) => f.startsWith(`${nr}-`) && f.endsWith(".md"))
    .sort();
  if (parts.length === 0) return null;

  return parts.map((f) => readFileSync(join(dir, f), "utf-8")).join("\n\n");
}

export function getLawContent(slug: string, nr: string): string | null {
  // Laws live in a directory matching the fixture that contains sync.yaml
  // Find which fixture dir contains this law slug
  if (!existsSync(FIXTURES_DIR)) return null;

  for (const entry of readdirSync(FIXTURES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = join(FIXTURES_DIR, entry.name, `${nr}.md`);
    const syncPath = join(FIXTURES_DIR, entry.name, "sync.yaml");
    if (existsSync(syncPath) && existsSync(file)) {
      const sync = parse(readFileSync(syncPath, "utf-8")) as SyncYaml;
      if (slug in sync.laws) return readFileSync(file, "utf-8");
    }
  }
  return null;
}
