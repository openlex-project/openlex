"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";

interface SearchResult {
  url: string;
  meta: { title?: string };
  excerpt: string;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, Record<string, number>>>({});
  const [activeFilter, setActiveFilter] = useState<Record<string, string>>({});

  const doSearch = useCallback(async (q: string, filterOverride?: Record<string, string>) => {
    if (!q) return;
    setLoading(true);
    try {
      // @ts-expect-error pagefind loaded from static files
      const pagefind = await import(/* webpackIgnore: true */ "/pagefind/pagefind.js");
      await pagefind.init();
      const f = filterOverride ?? activeFilter;
      const filterArg: Record<string, string> = {};
      for (const [k, v] of Object.entries(f)) { if (v) filterArg[k] = v; }
      const search = await pagefind.search(q, { filters: Object.keys(filterArg).length > 0 ? filterArg : undefined });
      const loaded: SearchResult[] = await Promise.all(
        search.results.slice(0, 20).map(async (r: { data: () => Promise<SearchResult> }) => r.data()),
      );
      setResults(loaded);
      setFilters(await pagefind.filters() as Record<string, Record<string, number>>);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [activeFilter]);

  useEffect(() => { doSearch(query); }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFilter = (key: string, value: string) => {
    const next = { ...activeFilter };
    if (next[key] === value) delete next[key]; else next[key] = value;
    setActiveFilter(next);
    doSearch(query, next);
  };

  if (!query) return <p style={{ color: "var(--text-secondary)" }}>Suchbegriff eingeben.</p>;

  return (
    <>
      {Object.keys(filters).length > 0 && (
        <aside className="mb-6 flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, values]) =>
            Object.entries(values).map(([val, count]) => (
              <button
                key={`${key}-${val}`}
                onClick={() => toggleFilter(key, val)}
                className="text-xs px-2 py-1 rounded-full border transition-colors"
                style={{
                  background: activeFilter[key] === val ? "var(--color-brand-600)" : "transparent",
                  color: activeFilter[key] === val ? "white" : "var(--text-secondary)",
                  borderColor: activeFilter[key] === val ? "var(--color-brand-600)" : "var(--border)",
                }}
              >
                {val} ({count})
              </button>
            )),
          )}
        </aside>
      )}

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Suche…</p>
      ) : results.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>Keine Ergebnisse für „{query}".</p>
      ) : (
        <ul className="space-y-4">
          {results.map((r) => (
            <li key={r.url}>
              <Link href={r.url} className="hover:underline font-medium" style={{ color: "var(--active-text)" }}>
                {r.meta.title ?? r.url}
              </Link>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: r.excerpt }} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Suchergebnisse</h1>
      <Suspense fallback={<p style={{ color: "var(--text-secondary)" }}>Laden…</p>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
