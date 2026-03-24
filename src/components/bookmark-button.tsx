"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Bookmark } from "lucide-react";
import { useT } from "@/lib/i18n/useT";

export function BookmarkButton({ title }: { title?: string }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const t = useT();
  const [bookmarked, setBookmarked] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!session) return;
    fetch(`/api/bookmarks?path=${encodeURIComponent(pathname)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setBookmarked(d.bookmarked); });
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
      aria-label={bookmarked ? t("bookmark.remove") : t("bookmark.add")}
      aria-pressed={bookmarked}
    >
      <Bookmark className="w-5 h-5" fill={bookmarked ? "currentColor" : "none"} />
    </button>
  );
}
