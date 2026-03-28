"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/useT";
import { search as pfSearch, filters as pfFilters, type PagefindResult } from "@/lib/pagefind";
import { sanitizeExcerpt } from "@/lib/escape-html";

const PAGE_SIZE = 20;

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const t = useT();
  const [results, setResults] = useState<PagefindResult[]>([]);
  const [allResults, setAllResults] = useState<PagefindResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<Record<string, Record<string, number>>>({});
  const [activeFilter, setActiveFilter] = useState<Record<string, string>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string, filterOverride?: Record<string, string>) => {
    if (!q) return;
    setLoading(true);
    try {
      const f = filterOverride ?? activeFilter;
      const filterArg: Record<string, string> = {};
      for (const [k, v] of Object.entries(f)) { if (v) filterArg[k] = v; }
      const all = await pfSearch(q, { filters: Object.keys(filterArg).length > 0 ? filterArg : undefined });
      setResults(all.slice(0, PAGE_SIZE));
      setAllResults(all);
      setFilters(await pfFilters());
    } catch { setResults([]); setAllResults([]); }
    finally { setLoading(false); }
  }, [activeFilter]);


  // Infinite scroll: load more when sentinel is visible
  useEffect(() => {
    if (!sentinelRef.current || results.length >= allResults.length) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting || loadingMore || results.length >= allResults.length) return;
      setLoadingMore(true);
      setResults((prev) => {
        const next = allResults.slice(prev.length, prev.length + PAGE_SIZE);
        return [...prev, ...next];
      });
      setLoadingMore(false);
    }, { rootMargin: "200px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [allResults, results.length, loadingMore]);

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
              <button type="button"
                key={`${key}-${val}`}
                onClick={() => toggleFilter(key, val)}
                aria-pressed={activeFilter[key] === val}
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
            {results.map((r) => (
              <li key={r.url}>
                <Link href={r.url} className="hover:underline font-medium" style={{ color: "var(--active-text)" }}>
                  {r.meta.title ?? r.url}
                </Link>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: sanitizeExcerpt(r.excerpt) }} />
              </li>
            ))}
          </ul>
          {results.length < allResults.length && (
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
