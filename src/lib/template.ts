import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { parse } from "yaml";
import { getProvider } from "@/lib/git-provider";
import { log } from "@/lib/logger";

/* ─── Types ─── */

export type HeaderVariant = "glass" | "solid" | "minimal";
export type CardVariant = "elevated" | "flat" | "bordered";
export type ContentWidth = "narrow" | "wide" | "full";

export interface TemplateVariants {
  header: HeaderVariant;
  card: CardVariant;
  content: ContentWidth;
}

export interface HomeSection {
  type: "hero" | "featured" | "categories" | "recent";
  items?: string[];
  limit?: number;
}

export interface TemplateConfig {
  name: string;
  variants: TemplateVariants;
  home?: HomeSection[];
  css?: string; // raw CSS to inject
}

/* ─── Defaults ─── */

const DEFAULT_VARIANTS: TemplateVariants = {
  header: "glass",
  card: "elevated",
  content: "narrow",
};

/* ─── Built-in templates ─── */

const BUILTIN: Record<string, Omit<TemplateConfig, "css"> & { cssFile: string }> = {
  default: {
    name: "default",
    variants: DEFAULT_VARIANTS,
    cssFile: "default.css",
  },
  academic: {
    name: "academic",
    variants: { header: "solid", card: "flat", content: "wide" },
    cssFile: "academic.css",
  },
};

/* ─── Loader ─── */

let cached: { data: TemplateConfig; ts: number } | null = null;
const TEMPLATE_TTL = 5 * 60_000;

/** Parse template specifier from site.yaml `template` field. */
function parseSpec(raw: string): { kind: "builtin"; id: string } | { kind: "local"; path: string } | { kind: "remote"; repo: string; ref: string } {
  if (raw in BUILTIN) return { kind: "builtin", id: raw };
  if (raw.startsWith("./") || raw.startsWith("/")) return { kind: "local", path: raw };
  // org/repo or org/repo@ref
  const [repo, ref] = raw.split("@");
  return { kind: "remote", repo: repo!, ref: ref ?? "main" };
}

function readBuiltinCss(file: string): string {
  const p = join(process.cwd(), "src", "templates", file);
  return existsSync(p) ? readFileSync(p, "utf-8") : "";
}

function readLocalTemplate(dir: string): TemplateConfig {
  const base = dir.startsWith("/") ? dir : join(process.cwd(), dir);
  const cfgPath = join(base, "template.yaml");
  const cfg = existsSync(cfgPath) ? (parse(readFileSync(cfgPath, "utf-8")) as Partial<TemplateConfig>) : {};
  const cssPath = join(base, "styles.css");
  const css = existsSync(cssPath) ? readFileSync(cssPath, "utf-8") : undefined;
  return {
    name: cfg.name ?? "custom",
    variants: { ...DEFAULT_VARIANTS, ...cfg.variants },
    home: cfg.home,
    css,
  };
}

async function fetchRemoteTemplate(repoSpec: string, ref: string): Promise<TemplateConfig> {
  const { provider: p, repo } = getProvider(repoSpec);
  const [cfgRaw, css] = await Promise.all([
    p.fetchFile(repo, "template.yaml", ref),
    p.fetchFile(repo, "styles.css", ref),
  ]);
  const cfg = cfgRaw ? (parse(cfgRaw) as Partial<TemplateConfig>) : {};
  return {
    name: cfg.name ?? repo,
    variants: { ...DEFAULT_VARIANTS, ...cfg.variants },
    home: cfg.home,
    css: css ? sanitizeCss(css) : undefined,
  };
}

/** Strip dangerous constructs from remote CSS. */
function sanitizeCss(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/@import\s+[^;]+;/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/behavior\s*:/gi, "")
    .replace(/-moz-binding\s*:/gi, "");
}

/**
 * Load the active template. Reads `template` field from site.yaml.
 * Supports: built-in name, local path, or GitHub org/repo[@ref].
 */
export async function loadTemplate(templateField?: string): Promise<TemplateConfig> {
  if (cached && Date.now() - cached.ts < TEMPLATE_TTL) return cached.data;

  const raw = templateField ?? "default";
  const spec = parseSpec(raw);

  let config: TemplateConfig;

  if (spec.kind === "builtin") {
    const b = BUILTIN[spec.id]!;
    config = { name: b.name, variants: b.variants, css: readBuiltinCss(b.cssFile) };
  } else if (spec.kind === "local") {
    config = readLocalTemplate(spec.path);
  } else {
    try {
      config = await fetchRemoteTemplate(spec.repo, spec.ref);
    } catch (err) {
      log.error(err, "Failed to load remote template: %s", raw);
      const b = BUILTIN["default"]!;
      config = { name: b.name, variants: b.variants, css: readBuiltinCss(b.cssFile) };
    }
  }

  cached = { data: config, ts: Date.now() };
  return cached.data;
}

