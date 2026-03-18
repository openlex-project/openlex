/**
 * remark plugin: transforms ::: author directive content into structured HTML.
 * Input:  :::author\nname: Max Mustermann\norcid: 0000-0000-0000-0000\n:::
 * Output: <aside class="directive-author"><a href="https://orcid.org/...">Name</a></aside>
 */
import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

interface DirectiveNode {
  type: string;
  name: string;
  children: { type: string; value?: string; children?: { type: string; value?: string }[] }[];
  data?: Record<string, unknown>;
}

const remarkAuthor: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "containerDirective", (node) => {
      const n = node as unknown as DirectiveNode;
      if (n.name !== "author") return;

      // Extract text from children (paragraphs contain "name: ...\norcid: ...")
      const text = n.children
        .flatMap((c) =>
          c.type === "paragraph" && c.children
            ? c.children.filter((t) => t.type === "text").map((t) => t.value ?? "")
            : c.value ? [c.value] : [],
        )
        .join("\n");

      const nameMatch = text.match(/name:\s*(.+)/);
      const orcidMatch = text.match(/orcid:\s*(\S+)/);

      const name = nameMatch?.[1]?.trim() ?? "Unbekannt";
      const orcid = orcidMatch?.[1]?.trim();

      const nameHtml = orcid
        ? `<a href="https://orcid.org/${orcid}" target="_blank" rel="noopener" class="author-link">${name}</a>`
        : name;

      // Replace children with rendered HTML
      n.children = [{ type: "html" as const, value: nameHtml }] as DirectiveNode["children"];
    });
  };
};

export default remarkAuthor;
