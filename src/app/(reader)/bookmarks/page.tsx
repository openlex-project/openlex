"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useT } from "@/lib/i18n/useT";

export default function BookmarksPage() {
  const { data: session } = useSession();
  const t = useT();
  const [bookmarks, setBookmarks] = useState<string[]>([]);
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
      <div className="px-4 sm:px-6 py-8 sm:py-12 max-w-3xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">{t("bookmarks.title")}</h1>
        <p style={{ color: "var(--text-secondary)" }}>{t("bookmarks.login")}</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12 max-w-3xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">{t("bookmarks.title")}</h1>
      {loading ? (
        <p style={{ color: "var(--text-tertiary)" }}>…</p>
      ) : bookmarks.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>{t("bookmarks.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {bookmarks.map((path) => (
            <li key={path}>
              <Link href={path} className="block card px-4 py-3 hover:border-[var(--color-brand-300)] transition-colors">
                <span className="text-sm" style={{ color: "var(--active-text)" }}>{path}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
