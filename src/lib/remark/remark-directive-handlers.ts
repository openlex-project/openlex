/**
 * remark plugin: transforms container directives (:::) into hast-compatible nodes.
 * Handles ::: author, ::: note, ::: law, ::: review, etc.
 */
import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

interface DirectiveNode {
  type: "containerDirective";
  name: string;
  attributes: Record<string, string>;
  children: unknown[];
  data?: { hName?: string; hProperties?: Record<string, unknown> };
}

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
    visit(tree, "containerDirective", (node: DirectiveNode) => {
      const className = DIRECTIVE_CLASSES[node.name] ?? `directive-${node.name}`;
      node.data = {
        hName: "aside",
        hProperties: {
          class: className,
          "data-directive": node.name,
        },
      };
    });
  };
};

export default remarkDirectiveHandlers;
