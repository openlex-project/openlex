import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkMarginNumbers from "./remark/remark-margin-numbers";
import remarkDirectiveHandlers from "./remark/remark-directive-handlers";

/** Convert Pandoc-style `::: name` to remark-directive `:::name` */
function normalizeFencedDivs(md: string): string {
  return md.replace(/^(:{3,})\s+(\w+)/gm, "$1$2");
}

const processor = unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkDirectiveHandlers)
  .use(remarkMarginNumbers)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSlug)
  .use(rehypeStringify, { allowDangerousHtml: true });

export async function renderMarkdown(markdown: string): Promise<string> {
  const result = await processor.process(normalizeFencedDivs(markdown));
  return String(result);
}
