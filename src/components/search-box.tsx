"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";

interface SearchResult {
  url: string;
  meta: { title?: string };
  excerpt: string;
}

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        ref.current?.querySelector("input")?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      // @ts-expect-error pagefind loaded from static files
      const pagefind = await import(/* webpackIgnore: true */ "/pagefind/pagefind.js");
      await pagefind.init();
      const search = await pagefind.search(q);
      const loaded: SearchResult[] = await Promise.all(
        search.results.slice(0, 8).map(async (r: { data: () => Promise<SearchResult> }) => r.data()),
      );
      setResults(loaded);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    setOpen(true);
    setActive(-1);
    clearTimeout(timerRef.current ?? undefined);
    timerRef.current = setTimeout(() => doSearch(val), 200);
  };

  const navigate = (url: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActive(-1);
    router.push(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i <= 0 ? results.length - 1 : i - 1)); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); navigate(results[active]!.url); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-tertiary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Suche… ⌘K"
          aria-label="Volltextsuche"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="search-listbox"
          aria-activedescendant={active >= 0 ? `search-option-${active}` : undefined}
          className="w-full rounded-lg pl-9 pr-3 py-2 text-sm transition-colors"
          style={{ background: "var(--surface-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
      </div>

      {open && query.trim() && (
        <div
          className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl shadow-xl overflow-hidden"
          style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
        >
          {loading && <p className="px-4 py-3 text-sm" style={{ color: "var(--text-tertiary)" }}>Suche…</p>}
          {!loading && results.length === 0 && (
            <p className="px-4 py-3 text-sm" style={{ color: "var(--text-tertiary)" }}>Keine Ergebnisse für „{query}"</p>
          )}
          {!loading && results.length > 0 && (
            <ul id="search-listbox" role="listbox" className="max-h-96 overflow-y-auto py-1">
              {results.map((r, i) => (
                <li key={r.url} id={`search-option-${i}`} role="option" aria-selected={i === active}>
                  <button
                    onClick={() => navigate(r.url)}
                    className="w-full text-left px-4 py-2.5 transition-colors"
                    style={{ color: "var(--text-primary)", background: i === active ? "var(--hover-bg)" : undefined }}
                    onMouseEnter={(e) => { setActive(i); e.currentTarget.style.background = "var(--hover-bg)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    tabIndex={-1}
                  >
                    <div className="text-sm font-medium truncate">{r.meta.title ?? r.url}</div>
                    <div className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-tertiary)" }} dangerouslySetInnerHTML={{ __html: r.excerpt }} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
