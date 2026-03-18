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
import remarkCitations from "./remark/remark-citations";
import { createCitationEngine, parseReferencesYaml } from "./citeproc";

/** Convert Pandoc-style `::: name` to remark-directive `:::name` */
function normalizeFencedDivs(md: string): string {
  return md.replace(/^(:{3,})\s+(\w+)/gm, "$1$2");
}

export interface RenderOptions {
  numbering?: NumberingOptions;
  cslXml?: string;
  referencesYaml?: string;
}

function buildProcessor(opts?: RenderOptions) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let p = (unified() as any)
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkAuthor)
    .use(remarkDirectiveHandlers)
    .use(remarkMarginNumbers);

  // Citations BEFORE footnotes so @keys in ^[...] are resolved first
  if (opts?.cslXml && opts?.referencesYaml) {
    const refs = parseReferencesYaml(opts.referencesYaml);
    const engine = createCitationEngine(opts.cslXml, refs);
    p = p.use(remarkCitations, { engine });
  }

  p = p.use(remarkInlineFootnotes);

  if (opts?.numbering) {
    p = p.use(remarkNumbering, opts.numbering);
  }

  return p
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true });
}

// Default processor (no numbering, no citations)
const defaultProcessor = buildProcessor();

export async function renderMarkdown(
  markdown: string,
  opts?: RenderOptions,
): Promise<string> {
  const needsCustom = opts?.numbering || (opts?.cslXml && opts?.referencesYaml);
  const proc = needsCustom ? buildProcessor(opts) : defaultProcessor;
  const result = await proc.process(normalizeFencedDivs(markdown));
  return String(result);
}
