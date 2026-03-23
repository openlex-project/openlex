export interface PagefindResult {
  url: string;
  meta: { title?: string };
  excerpt: string;
}

interface PagefindSearch {
  results: { data: () => Promise<PagefindResult> }[];
}

let pf: { search: (q: string, opts?: object) => Promise<PagefindSearch>; filters: () => Promise<Record<string, Record<string, number>>>; init: () => Promise<void> } | null = null;

async function load() {
  if (pf) return pf;
  // @ts-expect-error pagefind loaded from static files
  pf = await import(/* webpackIgnore: true */ "/pagefind/pagefind.js");
  await pf!.init();
  return pf!;
}

export async function search(query: string, opts?: object): Promise<PagefindResult[]> {
  const pg = await load();
  const res = await pg.search(query, opts);
  return Promise.all(res.results.map((r) => r.data()));
}

export async function filters(): Promise<Record<string, Record<string, number>>> {
  const pg = await load();
  return pg.filters();
}
