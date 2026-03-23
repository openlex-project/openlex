"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useT } from "@/lib/i18n/useT";

interface Bookmark { path: string; title: string; }

export default function BookmarksPage() {
  const { data: session } = useSession();
  const t = useT();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((d) => setBookmarks(d.bookmarks))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) {
    return (
      <div className="page-container">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">{t("bookmarks.title")}</h1>
        <p style={{ color: "var(--text-secondary)" }}>{t("bookmarks.login")}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">{t("bookmarks.title")}</h1>
      {loading ? (
        <p style={{ color: "var(--text-tertiary)" }}>…</p>
      ) : bookmarks.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>{t("bookmarks.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {bookmarks.map((b) => (
            <li key={b.path}>
              <Link href={b.path} className="block card px-4 py-3 hover:border-[var(--color-brand-300)] transition-colors">
                <span className="text-sm font-medium" style={{ color: "var(--active-text)" }}>{b.title}</span>
                <span className="block text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{b.path}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
