/**
 * remark plugin: resolves @citation_key references using a CitationEngine.
 * Handles patterns like @mustermann2024 and @mustermann2024, S. 42.
 * Must run AFTER remark-inline-footnotes (operates on footnote HTML too).
 */
import type { Root } from "mdast";
import type { Plugin } from "unified";
import type { CitationEngine } from "../citeproc";

// Match @key optionally followed by ", locator text" (locator ends at ] or end of string)
const CITE_RE = /@([a-zA-Z0-9_-]+)(?:,\s*([^@\]]+?)\.?(?=\]|@|$))?/g;

export interface CitationPluginOptions {
  engine: CitationEngine;
}

function resolveCitations(text: string, engine: CitationEngine): string {
  return text.replace(CITE_RE, (_, key: string, locator?: string) => {
    return engine.cite(key, locator?.trim());
  });
}

const remarkCitations: Plugin<[CitationPluginOptions], Root> = (opts) => {
  const { engine } = opts;

  return (tree) => {
    // Walk all nodes and resolve citations in text and html nodes
    function walk(node: { type: string; value?: string; children?: unknown[] }) {
      if (node.type === "text" && node.value && CITE_RE.test(node.value)) {
        CITE_RE.lastIndex = 0;
        node.value = resolveCitations(node.value, engine);
      }
      if (node.type === "html" && node.value && CITE_RE.test(node.value)) {
        CITE_RE.lastIndex = 0;
        node.value = resolveCitations(node.value, engine);
      }
      if (node.children) {
        for (const child of node.children) {
          walk(child as typeof node);
        }
      }
    }
    walk(tree as unknown as { type: string; children: unknown[] });

    // Append bibliography
    const bib = engine.bibliography();
    if (bib) {
      tree.children.push({
        type: "html",
        value: `<section class="bibliography"><h2>Literaturverzeichnis</h2>${bib}</section>`,
      });
    }
  };
};

export default remarkCitations;
