/**
 * remark plugin: transforms []{.rn} markers into numbered margin number nodes.
 * Output: <span class="rn" id="rn-{n}" data-rn="{n}">{n}</span>
 */
import type { Root, Text, PhrasingContent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const RN_PATTERN = /\[]\{\.rn\}/g;

const remarkMarginNumbers: Plugin<[], Root> = () => {
  return (tree) => {
    let counter = 0;

    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined) return;
      if (!RN_PATTERN.test(node.value)) return;

      RN_PATTERN.lastIndex = 0;
      const parts: PhrasingContent[] = [];
      let lastIndex = 0;

      for (const match of node.value.matchAll(RN_PATTERN)) {
        const before = node.value.slice(lastIndex, match.index);
        if (before) parts.push({ type: "text", value: before });

        counter++;
        parts.push({
          type: "html",
          value: `<span class="rn" id="rn-${counter}" data-rn="${counter}">${counter}</span>`,
        });
        lastIndex = match.index + match[0].length;
      }

      const after = node.value.slice(lastIndex);
      if (after) parts.push({ type: "text", value: after });

      parent.children.splice(index, 1, ...parts);
    });
  };
};

export default remarkMarginNumbers;
