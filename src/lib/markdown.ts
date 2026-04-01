import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkMarginNumbers from "./remark/remark-margin-numbers";
import remarkDirectiveHandlers from "./remark/remark-directive-handlers";
import remarkAuthor from "./remark/remark-author";
import { extractFootnotes, buildFootnoteSection } from "./remark/footnote-preprocessor";
import remarkNumbering, { type NumberingOptions } from "./remark/remark-numbering";
import remarkCitations from "./remark/remark-citations";
import { createCitationEngine, parseReferencesYaml } from "./citeproc";
import { log } from "./logger";

/** Convert Pandoc-style `::: name` to remark-directive `:::name` */
function normalizeFencedDivs(md: string): string {
  return md.replace(/^(:{3,})\s+(\w+)/gm, "$1$2");
}

export interface RenderOptions {
  numbering?: NumberingOptions;
  cslXml?: string;
  referencesYaml?: string;
  tocAuthor?: string | { name: string; orcid: string };
  editors?: { name: string; orcid?: string }[];
}

function buildProcessor(opts?: RenderOptions) {
  // biome-ignore lint/suspicious/noExplicitAny: unified pipeline types are not fully compatible with plugin signatures
  let p = (unified() as any)
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkAuthor, { tocAuthor: opts?.tocAuthor, editors: opts?.editors })
    .use(remarkDirectiveHandlers)
    .use(remarkMarginNumbers);

  // Citations BEFORE footnotes so @keys in ^[...] are resolved first
  if (opts?.cslXml && opts?.referencesYaml) {
    const refs = parseReferencesYaml(opts.referencesYaml);
    const engine = createCitationEngine(opts.cslXml, refs);
    p = p.use(remarkCitations, { engine, suppressBibliography: true });
  }

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
  try {
    // Extract ^[...] footnotes before parsing (handles nested Markdown inside footnotes)
    const { text: preprocessed, notes } = extractFootnotes(markdown);
    const needsCustom = opts?.numbering || (opts?.cslXml && opts?.referencesYaml);
    const proc = needsCustom ? buildProcessor(opts) : defaultProcessor;
    const result = await proc.process(normalizeFencedDivs(preprocessed));
    const footnoteHtml = await buildFootnoteSection(notes, proc);
    return String(result) + footnoteHtml;
  } catch (err) {
    log.error(err, "Markdown render failed");
    return `<p style="color:red">Render error</p>`;
  }
}
