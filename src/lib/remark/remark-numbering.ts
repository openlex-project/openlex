/**
 * remark plugin: automatic heading numbering with configurable format strings.
 *
 * Counter types: {1} arabic, {A} upper alpha, {a} lower alpha, {I} upper roman, {i} lower roman
 * Manual override: {number="X."} attribute on heading
 * Predefined schemas: commentary, textbook, decimal, none
 * Custom: numbering_format + numbering_reset in meta.yaml
 */
import type { Root, Heading, PhrasingContent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export interface NumberingOptions {
  schema?: string;
  format?: Record<string, string>;
  reset?: Record<string, boolean>;
}

interface ResolvedConfig {
  format: Map<number, string>;
  reset: Map<number, boolean>;
  isDecimal: boolean;
}

// --- Counter formatters ---

function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]!) {
      result += syms[i];
      n -= vals[i]!;
    }
  }
  return result;
}

function toAlpha(n: number): string {
  let result = "";
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

function formatCounter(counter: number, type: string): string {
  switch (type) {
    case "1": return String(counter);
    case "A": return toAlpha(counter);
    case "a": return toAlpha(counter).toLowerCase();
    case "I": return toRoman(counter);
    case "i": return toRoman(counter).toLowerCase();
    default: return String(counter);
  }
}

function applyFormat(template: string, counter: number): string {
  return template.replace(/\{([1AaIi])\}/g, (_, type: string) =>
    formatCounter(counter, type),
  );
}

// --- Predefined schemas ---

const SCHEMAS: Record<string, { format: Record<string, string>; reset: Record<string, boolean> }> = {
  none: { format: {}, reset: {} },
  commentary: {
    format: {
      "##": "{A}.",
      "###": "{I}.",
      "####": "{1}.",
      "#####": "{a})",
    },
    reset: {
      "##": true,
      "###": true,
      "####": true,
      "#####": true,
    },
  },
  textbook: {
    format: {
      "#": "Teil {1}:",
      "##": "§ {1}",
      "###": "{A}.",
      "####": "{I}.",
      "#####": "{1}.",
    },
    reset: {
      "##": true,
      "###": true,
      "####": true,
      "#####": true,
    },
  },
  decimal: { format: {}, reset: {} }, // handled specially
};

function levelKey(depth: number): string {
  return "#".repeat(depth);
}

function resolveConfig(opts: NumberingOptions): ResolvedConfig {
  const schemaName = opts.schema ?? "none";
  const isDecimal = schemaName === "decimal";
  const base = SCHEMAS[schemaName] ?? SCHEMAS["none"]!;

  const rawFormat = { ...base.format, ...opts.format };
  const rawReset = { ...base.reset, ...opts.reset };

  const format = new Map<number, string>();
  const reset = new Map<number, boolean>();

  for (const [key, val] of Object.entries(rawFormat)) {
    format.set(key.length, val);
  }
  for (const [key, val] of Object.entries(rawReset)) {
    reset.set(key.length, val);
  }

  // Decimal: auto-reset all levels
  if (isDecimal) {
    for (let i = 2; i <= 6; i++) reset.set(i, true);
  }

  return { format, reset, isDecimal };
}

// --- Manual override parsing ---

const OVERRIDE_RE = /\{number="([^"]+)"\}\s*$/;

function extractOverride(heading: Heading): string | null {
  const lastChild = heading.children[heading.children.length - 1];
  if (!lastChild || lastChild.type !== "text") return null;

  const match = lastChild.value.match(OVERRIDE_RE);
  if (!match) return null;

  // Remove the override syntax from the text
  lastChild.value = lastChild.value.replace(OVERRIDE_RE, "").trimEnd();
  return match[1] ?? null;
}

// --- Heading text extraction for .unnumbered check ---

function hasClass(heading: Heading, cls: string): boolean {
  const lastChild = heading.children[heading.children.length - 1];
  if (!lastChild || lastChild.type !== "text") return false;
  return lastChild.value.includes(`{.${cls}}`);
}

function stripClasses(heading: Heading): void {
  const lastChild = heading.children[heading.children.length - 1];
  if (!lastChild || lastChild.type !== "text") return;
  lastChild.value = lastChild.value.replace(/\s*\{[^}]*\}\s*$/, "").trimEnd();
}

// --- Plugin ---

function remarkNumbering(opts: NumberingOptions = {}): ReturnType<Plugin<[NumberingOptions?], Root>> {
  const config = resolveConfig(opts);

  return (tree: Root) => {
    const counters = new Map<number, number>();
    for (let i = 1; i <= 6; i++) counters.set(i, 0);

    const shouldNumber = config.isDecimal || config.format.size > 0;

    visit(tree, "heading", (node: Heading) => {
      const depth = node.depth;
      const isUnnumbered = hasClass(node, "unnumbered");
      const override = extractOverride(node);

      // Always strip Pandoc attribute syntax from headings
      stripClasses(node);

      if (!shouldNumber || isUnnumbered) return;

      // Reset deeper counters
      for (let i = depth + 1; i <= 6; i++) {
        if (config.reset.get(i) !== false) {
          counters.set(i, 0);
        }
      }

      // Increment current level
      counters.set(depth, (counters.get(depth) ?? 0) + 1);

      // Generate number string
      let prefix: string;
      if (override) {
        prefix = override;
      } else if (config.isDecimal) {
        // Decimal: join all ancestor counters with dots
        const parts: number[] = [];
        for (let i = 1; i <= depth; i++) {
          parts.push(counters.get(i) ?? 0);
        }
        prefix = parts.join(".") + ".";
      } else {
        const fmt = config.format.get(depth);
        if (!fmt) return; // No format for this level → skip
        prefix = applyFormat(fmt, counters.get(depth) ?? 0);
      }

      // Strip any remaining Pandoc attribute syntax before prepending
      stripClasses(node);

      // Prepend number to heading
      const firstChild = node.children[0];
      if (firstChild?.type === "text") {
        firstChild.value = `${prefix} ${firstChild.value}`;
      } else {
        node.children.unshift({
          type: "text",
          value: `${prefix} `,
        } as PhrasingContent);
      }
    });
  };
}

export default remarkNumbering;
