"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
    },
    [query, router],
  );

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-tertiary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche in Kommentaren, Gesetzen, Zeitschriften…"
          aria-label="Volltextsuche"
          className="w-full rounded-lg pl-9 pr-3 py-2 text-sm transition-colors"
          style={{
            background: "var(--surface-secondary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>
    </form>
  );
}
