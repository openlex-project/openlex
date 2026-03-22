"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/useT";

interface SearchResult {
  url: string;
  meta: { title?: string };
  excerpt: string;
}

interface PendingResult {
  data: () => Promise<SearchResult>;
}

const PAGE_SIZE = 20;

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const t = useT();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pending, setPending] = useState<PendingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<Record<string, Record<string, number>>>({});
  const [activeFilter, setActiveFilter] = useState<Record<string, string>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);

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
      const allPending = search.results as PendingResult[];
      const first = await Promise.all(allPending.slice(0, PAGE_SIZE).map((r) => r.data()));
      setResults(first);
      setPending(allPending.slice(PAGE_SIZE));
      setFilters(await pagefind.filters() as Record<string, Record<string, number>>);
    } catch { setResults([]); setPending([]); }
    finally { setLoading(false); }
  }, [activeFilter]);

  useEffect(() => { doSearch(query); }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll: load more when sentinel is visible
  useEffect(() => {
    if (!sentinelRef.current || pending.length === 0) return;
    const observer = new IntersectionObserver(async (entries) => {
      if (!entries[0]?.isIntersecting || loadingMore || pending.length === 0) return;
      setLoadingMore(true);
      const next = pending.slice(0, PAGE_SIZE);
      const loaded = await Promise.all(next.map((r) => r.data()));
      setResults((prev) => [...prev, ...loaded]);
      setPending((prev) => prev.slice(PAGE_SIZE));
      setLoadingMore(false);
    }, { rootMargin: "200px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [pending, loadingMore]);

  const toggleFilter = (key: string, value: string) => {
    const next = { ...activeFilter };
    if (next[key] === value) delete next[key]; else next[key] = value;
    setActiveFilter(next);
    doSearch(query, next);
  };

  if (!query) return <p style={{ color: "var(--text-secondary)" }}>{t("search.prompt")}</p>;

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
        <p style={{ color: "var(--text-secondary)" }}>{t("search.loading")}</p>
      ) : results.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>{t("search.empty", { query })}</p>
      ) : (
        <>
          <ul className="space-y-4">
            {results.map((r, i) => (
              <li key={`${r.url}-${i}`}>
                <Link href={r.url} className="hover:underline font-medium" style={{ color: "var(--active-text)" }}>
                  {r.meta.title ?? r.url}
                </Link>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: r.excerpt }} />
              </li>
            ))}
          </ul>
          {pending.length > 0 && (
            <div ref={sentinelRef} className="py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
              {loadingMore ? t("search.loadingMore") : ""}
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function SearchPage() {
  const t = useT();
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">{t("search.title")}</h1>
      <Suspense fallback={<p style={{ color: "var(--text-secondary)" }}>{t("search.loading")}</p>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
