"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export function BookmarkButton({ title }: { title?: string }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [bookmarked, setBookmarked] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!session) return;
    fetch(`/api/bookmarks?path=${encodeURIComponent(pathname)}`)
      .then((r) => r.json())
      .then((d) => setBookmarked(d.bookmarked));
  }, [session, pathname]);

  if (!session) return null;

  const toggle = () => {
    setBookmarked((v) => !v);
    startTransition(async () => {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, title }),
      });
      if (res.ok) {
        const { bookmarked: state } = await res.json();
        setBookmarked(state);
      }
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="inline-flex items-center gap-1 text-sm transition-colors"
      style={{ color: bookmarked ? "var(--color-brand-600)" : "var(--text-tertiary)" }}
      aria-label={bookmarked ? "Lesezeichen entfernen" : "Lesezeichen setzen"}
      aria-pressed={bookmarked}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0z" />
      </svg>
    </button>
  );
}
