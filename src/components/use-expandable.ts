"use client";

import { useState, useEffect, useCallback } from "react";

/** Shared expand/collapse state that auto-expands when activeKeys change. */
export function useExpandable(activeKeys: string[]) {
  const [expanded, setExpanded] = useState(() => new Set(activeKeys));

  useEffect(() => {
    if (!activeKeys.length) return;
    setExpanded((prev) => {
      if (activeKeys.every((k) => prev.has(k))) return prev;
      const next = new Set(prev);
      // biome-ignore lint/suspicious/useIterableCallbackReturn: forEach does not use return values
      activeKeys.forEach((k) => next.add(k));
      return next;
    });
  }, [activeKeys]);

  const toggle = useCallback((key: string) => setExpanded((s) => {
    const n = new Set(s);
    n.has(key) ? n.delete(key) : n.add(key);
    return n;
  }), []);

  return { expanded, toggle };
}
