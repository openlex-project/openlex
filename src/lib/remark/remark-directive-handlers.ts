/**
 * remark plugin: transforms container directives (:::) into hast-compatible nodes.
 * Handles ::: author, ::: note, ::: law, ::: review, etc.
 */
import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const DIRECTIVE_CLASSES: Record<string, string> = {
  author: "directive-author",
  note: "directive-note",
  law: "directive-law",
  review: "directive-review",
  example: "directive-example",
  warning: "directive-warning",
};

const remarkDirectiveHandlers: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "containerDirective", (node) => {
      const n = node as unknown as { name: string; data?: Record<string, unknown> };
      const className = DIRECTIVE_CLASSES[n.name] ?? `directive-${n.name}`;
      n.data = {
        hName: "aside",
        hProperties: {
          class: className,
          role: n.name === "author" ? undefined : "note",
          "data-directive": n.name,
        },
      };
    });
  };
};

export default remarkDirectiveHandlers;
