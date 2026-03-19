/**
 * remark plugin: resolves author for each chapter/section.
 * Priority: 1. ::: author in content (override)  2. toc.yaml author  3. none
 * ORCID registry: built from toc.yaml author objects + meta.yaml editors.
 */
import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

interface AuthorObj { name: string; orcid: string }
interface AuthorOptions {
  tocAuthor?: string | AuthorObj;
  editors?: AuthorObj[];
}

interface DirectiveNode {
  type: string;
  name: string;
  children: { type: string; value?: string; children?: { type: string; value?: string }[] }[];
  data?: Record<string, unknown>;
}

const remarkAuthor: Plugin<[AuthorOptions?], Root> = (opts) => {
  const orcidRegistry = new Map<string, string>();

  // Build ORCID registry from editors
  if (opts?.editors) {
    for (const e of opts.editors) {
      if (e.orcid) orcidRegistry.set(e.name, e.orcid);
    }
  }
  // From toc author (long form)
  if (opts?.tocAuthor && typeof opts.tocAuthor === "object") {
    orcidRegistry.set(opts.tocAuthor.name, opts.tocAuthor.orcid);
  }

  // Resolve toc author name
  const tocName = opts?.tocAuthor
    ? typeof opts.tocAuthor === "string" ? opts.tocAuthor : opts.tocAuthor.name
    : undefined;

  return (tree) => {
    let hasInlineAuthor = false;

    // First pass: check if ::: author exists (override)
    visit(tree, "containerDirective", (node) => {
      const n = node as unknown as DirectiveNode;
      if (n.name === "author") hasInlineAuthor = true;
    });

    // Process ::: author directives
    visit(tree, "containerDirective", (node) => {
      const n = node as unknown as DirectiveNode;
      if (n.name !== "author") return;

      const text = n.children
        .flatMap((c) =>
          c.type === "paragraph" && c.children
            ? c.children.filter((t) => t.type === "text").map((t) => t.value ?? "")
            : c.value ? [c.value] : [],
        )
        .join("\n");

      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      let name = "Unbekannt";
      let orcid: string | undefined;

      for (const line of lines) {
        const kv = line.match(/^(\w+):\s*(.+)$/);
        if (kv?.[1] === "name" && kv[2]) name = kv[2].trim();
        else if (kv?.[1] === "orcid" && kv[2]) orcid = kv[2].trim();
        else if (name === "Unbekannt") name = line;
      }

      if (orcid) orcidRegistry.set(name, orcid);
      else orcid = orcidRegistry.get(name);

      const nameHtml = orcid
        ? `<a href="https://orcid.org/${orcid}" target="_blank" rel="noopener" class="author-link">${name}</a>`
        : name;

      n.children = [{ type: "html" as const, value: nameHtml }] as DirectiveNode["children"];
    });

    // If no ::: author but toc.yaml has author, inject it after first heading
    if (!hasInlineAuthor && tocName) {
      const orcid = orcidRegistry.get(tocName);
      const nameHtml = orcid
        ? `<aside class="directive-author"><a href="https://orcid.org/${orcid}" target="_blank" rel="noopener" class="author-link">${tocName}</a></aside>`
        : `<aside class="directive-author">${tocName}</aside>`;

      visit(tree, "heading", (_node, index, parent) => {
        if (index !== undefined && parent) {
          parent.children.splice(index + 1, 0, { type: "html", value: nameHtml } as never);
          return false; // stop after first heading
        }
      });
    }
  };
};

export default remarkAuthor;
