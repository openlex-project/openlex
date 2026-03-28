import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Footer, PageNumber, NumberFormat } from "docx";
import { exportMarkdown } from "./export-md";

const headingLevel: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
};

export async function exportDocx(pages: { title: string; markdown: string }[]): Promise<Buffer> {
  const children: Paragraph[] = [];

  for (const page of pages) {
    const md = exportMarkdown(page.markdown);
    for (const line of md.split("\n")) {
      const hMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (hMatch) {
        const level = hMatch[1]!.length;
        children.push(new Paragraph({ heading: headingLevel[level], children: [new TextRun({ text: hMatch[2]!, bold: true })] }));
        continue;
      }
      const rnMatch = line.match(/^::: \{\.rn data-rn="(\d+)"\}/);
      if (rnMatch) {
        children.push(new Paragraph({ style: "MarginNumber", children: [new TextRun({ text: rnMatch[1]!, bold: true, size: 18 })] }));
        continue;
      }
      if (line.startsWith(":::")) continue;
      if (!line.trim()) { children.push(new Paragraph({})); continue; }
      children.push(new Paragraph({ children: parseInline(line) }));
    }
  }

  const doc = new Document({
    styles: { paragraphStyles: [{ id: "MarginNumber", name: "Margin Number", basedOn: "Normal", run: { size: 18, color: "888888" } }] },
    sections: [{
      properties: { page: { pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT] })] })] }) },
      children,
    }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

function parseInline(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\(.+?\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) runs.push(new TextRun(text.slice(last, m.index)));
    if (m[1]) runs.push(new TextRun({ text: m[1], bold: true }));
    else if (m[2]) runs.push(new TextRun({ text: m[2], italics: true }));
    else if (m[3]) runs.push(new TextRun({ text: m[3], underline: {} }));
    last = m.index + m[0].length;
  }
  if (last < text.length) runs.push(new TextRun(text.slice(last)));
  return runs;
}
