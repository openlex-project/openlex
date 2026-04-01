/**
 * Pre-processes Pandoc-style inline footnotes ^[...] from raw Markdown.
 *
 * Extracts footnotes before remark parses the text, replacing them with
 * HTML placeholder tokens. This avoids the problem where Markdown formatting
 * inside footnotes (e.g. *italic*, [links](url)) splits text nodes and
 * breaks regex-based remark plugins.
 *
 * Uses a balanced-bracket parser to correctly handle nested brackets.
 */


/** Find the matching closing bracket, handling nested brackets. */
function findClosingBracket(text: string, openPos: number): number {
  let depth = 0;
  for (let i = openPos; i < text.length; i++) {
    if (text[i] === "[") depth++;
    else if (text[i] === "]") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export interface ExtractedFootnotes {
  /** Markdown with footnotes replaced by placeholders */
  text: string;
  /** Ordered footnote texts (raw Markdown) */
  notes: string[];
}

/** Extract ^[...] footnotes from raw Markdown, replacing with HTML comment placeholders. */
export function extractFootnotes(markdown: string): ExtractedFootnotes {
  const notes: string[] = [];
  let result = "";
  let i = 0;

  while (i < markdown.length) {
    if (markdown[i] === "^" && markdown[i + 1] === "[") {
      const close = findClosingBracket(markdown, i + 1);
      if (close === -1) {
        result += markdown[i];
        i++;
        continue;
      }
      const content = markdown.slice(i + 2, close);
      notes.push(content);
      const n = notes.length;
      // Insert an HTML comment placeholder that survives remark parsing
      result += `<sup class="fn-ref"><a href="#fn-${n}" id="fnref-${n}">${n}</a></sup>`;
      i = close + 1;
    } else {
      result += markdown[i];
      i++;
    }
  }

  return { text: result, notes };
}

/** Build the footnotes section HTML from extracted notes. Notes are rendered as inline Markdown. */
export async function buildFootnoteSection(notes: string[]): Promise<string> {
  if (notes.length === 0) return "";
  const { unified } = await import("unified");
  const remarkParse = (await import("remark-parse")).default;
  const remarkRehype = (await import("remark-rehype")).default;
  const rehypeStringify = (await import("rehype-stringify")).default;
  const proc = unified().use(remarkParse).use(remarkRehype, { allowDangerousHtml: true }).use(rehypeStringify, { allowDangerousHtml: true });

  const items = await Promise.all(
    notes.map(async (text, i) => {
      const rendered = String(await proc.process(text)).replace(/^<p>/, "").replace(/<\/p>\s*$/, "");
      return `<li id="fn-${i + 1}"><p>${rendered} <a href="#fnref-${i + 1}" class="fn-back" role="doc-backlink">↩</a></p></li>`;
    }),
  );

  return `<section class="footnotes" role="doc-endnotes"><hr><ol>${items.join("\n")}</ol></section>`;
}
