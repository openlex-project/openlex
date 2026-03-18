/**
 * remark plugin: transforms Pandoc-style inline footnotes ^[text] into
 * numbered superscript references with a footnote section at the end.
 */
import type { Root, PhrasingContent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const FN_PATTERN = /\^\[([^\]]+)\]/g;

const remarkInlineFootnotes: Plugin<[], Root> = () => {
  return (tree) => {
    const footnotes: string[] = [];

    visit(tree, "text", (node, index, parent) => {
      if (!parent || index === undefined) return;
      if (!FN_PATTERN.test(node.value)) return;

      FN_PATTERN.lastIndex = 0;
      const parts: PhrasingContent[] = [];
      let lastIndex = 0;

      for (const match of node.value.matchAll(FN_PATTERN)) {
        const before = node.value.slice(lastIndex, match.index);
        if (before) parts.push({ type: "text", value: before });

        footnotes.push(match[1] ?? "");
        const n = footnotes.length;
        parts.push({
          type: "html",
          value: `<sup class="fn-ref"><a href="#fn-${n}" id="fnref-${n}">${n}</a></sup>`,
        });
        lastIndex = match.index + match[0].length;
      }

      const after = node.value.slice(lastIndex);
      if (after) parts.push({ type: "text", value: after });

      parent.children.splice(index, 1, ...parts);
    });

    // Append footnote section
    if (footnotes.length > 0) {
      const items = footnotes
        .map(
          (text, i) =>
            `<li id="fn-${i + 1}"><p>${text} <a href="#fnref-${i + 1}" class="fn-back">↩</a></p></li>`,
        )
        .join("\n");

      tree.children.push({
        type: "html",
        value: `<section class="footnotes"><hr><ol>${items}</ol></section>`,
      });
    }
  };
};

export default remarkInlineFootnotes;
