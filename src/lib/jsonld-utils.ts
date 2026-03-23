type JsonLd = Record<string, unknown>;

export function person(p: { name: string; orcid?: string }): JsonLd {
  const o: JsonLd = { "@type": "Person", name: p.name };
  if (p.orcid) o.url = `https://orcid.org/${p.orcid}`;
  return o;
}

export function licenseUrl(license?: string): string | undefined {
  if (!license) return undefined;
  const l = license.toLowerCase().replace(/ /g, "-");
  if (l.startsWith("cc-")) return `https://creativecommons.org/licenses/${l.replace("cc-", "")}/4.0/`;
  return undefined;
}
