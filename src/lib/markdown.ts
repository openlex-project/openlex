import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkMarginNumbers from "./remark/remark-margin-numbers";
import remarkDirectiveHandlers from "./remark/remark-directive-handlers";
import remarkAuthor from "./remark/remark-author";
import remarkInlineFootnotes from "./remark/remark-inline-footnotes";
import remarkNumbering, { type NumberingOptions } from "./remark/remark-numbering";

/** Convert Pandoc-style `::: name` to remark-directive `:::name` */
function normalizeFencedDivs(md: string): string {
  return md.replace(/^(:{3,})\s+(\w+)/gm, "$1$2");
}

function buildProcessor(numbering?: NumberingOptions) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let p = (unified() as any)
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkAuthor)
    .use(remarkDirectiveHandlers)
    .use(remarkMarginNumbers)
    .use(remarkInlineFootnotes);

  if (numbering) {
    p = p.use(remarkNumbering, numbering);
  }

  return p
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true });
}

// Default processor (no numbering)
const defaultProcessor = buildProcessor();

export interface RenderOptions {
  numbering?: NumberingOptions;
}

export async function renderMarkdown(
  markdown: string,
  opts?: RenderOptions,
): Promise<string> {
  const proc = opts?.numbering ? buildProcessor(opts.numbering) : defaultProcessor;
  const result = await proc.process(normalizeFencedDivs(markdown));
  return String(result);
}
