/**
 * CSL citation engine powered by citeproc-js.
 * Resolves @citation_key references using CSL style + references data.
 */
const CSL = require("citeproc");
import { parse } from "yaml";
import { log } from "@/lib/logger";
import { escapeHtml } from "@/lib/escape-html";

export interface CslReference {
  id: string;
  type: string;
  title: string;
  author?: { family: string; given: string }[];
  issued?: { "date-parts": number[][] };
  [key: string]: unknown;
}

export interface CitationEngine {
  /** Resolve a single @key (with optional locator) to formatted text */
  cite(key: string, locator?: string): string;
  /** Generate full bibliography HTML */
  bibliography(): string;
  /** Get URL for a reference (if any) */
  getUrl(key: string): string | undefined;
}

export function createCitationEngine(
  cslXml: string,
  references: CslReference[],
): CitationEngine {
  const itemsById: Record<string, CslReference> = {};
  for (const ref of references) {
    itemsById[ref.id] = ref;
  }

  const citedIds = new Set<string>();
  const previousCitations: { id: string; note: number }[] = [];

  const sys = {
    retrieveLocale: () => CSL_LOCALE_DE,
    retrieveItem: (id: string) => {
      const item = itemsById[id];
      if (!item) return { id, type: "book", title: id };
      // Ensure date-parts format is correct for citeproc
      const normalized = { ...item };
      if (normalized.issued && typeof normalized.issued === "object") {
        const issued = normalized.issued as Record<string, unknown>;
        if (!issued["date-parts"]) {
          normalized.issued = { "date-parts": [[2000]] };
        }
      }
      return normalized;
    },
  };

  const engine = new CSL.Engine(sys, cslXml, "de-DE");

  return {
    cite(key: string, locator?: string): string {
      citedIds.add(key);
      try {
        const idx = previousCitations.length + 1;
        const citation = {
          citationID: `cite-${idx}`,
          citationItems: [
            {
              id: key,
              ...(locator ? { locator, label: "page" } : {}),
            },
          ],
          properties: { noteIndex: idx },
        };
        const pre = previousCitations.map((c) => [c.id, c.note] as [string, number]);
        const result = engine.processCitationCluster(citation, pre, []);
        previousCitations.push({ id: `cite-${idx}`, note: idx });

        const output = result[1];
        if (Array.isArray(output) && output.length > 0) {
          // Get the last entry which is the current citation
          const last = output[output.length - 1];
          if (Array.isArray(last) && last[1]) return last[1] as string;
        }
      } catch (err) {
        log.error(err, "citeproc: failed to process citation %s", key);
        // Fallback: format manually
        const item = itemsById[key];
        if (item) {
          const author = item.author?.[0]?.family ?? key;
          const title = item.title ?? "";
          const loc = locator ? `, ${locator}` : "";
          return `<i>${escapeHtml(author)}</i>, ${escapeHtml(title)}${escapeHtml(loc)}`;
        }
      }
      return key;
    },

    bibliography(): string {
      if (citedIds.size === 0) return "";
      try {
        engine.updateItems([...citedIds]);
        const bibResult = engine.makeBibliography();
        if (!bibResult?.[1]) return "";
        return bibResult[1].join("\n");
      } catch (err) {
        log.error(err, "citeproc: failed to generate bibliography");
        return "";
      }
    },

    getUrl(key: string): string | undefined {
      return itemsById[key]?.URL as string | undefined;
    },
  };
}

export function parseReferencesYaml(yamlContent: string): CslReference[] {
  return parse(yamlContent) as CslReference[];
}

// Minimal German locale for citeproc-js
const CSL_LOCALE_DE = `<?xml version="1.0" encoding="utf-8"?>
<locale xmlns="http://purl.org/net/xbiblio/csl" version="1.0" xml:lang="de-DE">
  <style-options punctuation-in-quote="false"/>
  <date form="text">
    <date-part name="day" suffix=". "/>
    <date-part name="month"/>
    <date-part name="year" prefix=" "/>
  </date>
  <date form="numeric">
    <date-part name="day" form="numeric" suffix="."/>
    <date-part name="month" form="numeric" suffix="."/>
    <date-part name="year"/>
  </date>
  <terms>
    <term name="and">und</term>
    <term name="et-al">u.\u2009a.</term>
    <term name="editor" form="short">Hrsg.</term>
    <term name="edition" form="short">Aufl.</term>
    <term name="page" form="short">S.</term>
    <term name="volume" form="short">Bd.</term>
    <term name="in">in</term>
    <term name="accessed">abgerufen am</term>
    <term name="ibid">ebd.</term>
    <term name="no date" form="short">o.\u2009J.</term>
    <term name="retrieved">abgerufen am</term>
    <term name="month-01">Januar</term>
    <term name="month-02">Februar</term>
    <term name="month-03">März</term>
    <term name="month-04">April</term>
    <term name="month-05">Mai</term>
    <term name="month-06">Juni</term>
    <term name="month-07">Juli</term>
    <term name="month-08">August</term>
    <term name="month-09">September</term>
    <term name="month-10">Oktober</term>
    <term name="month-11">November</term>
    <term name="month-12">Dezember</term>
  </terms>
</locale>`;
