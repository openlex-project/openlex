"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useT } from "@/lib/i18n/useT";
import { useLocale } from "@/components/locale-provider";

interface HistoryEntry {
  path: string;
  title: string;
  ts: number;
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const t = useT();
  const locale = useLocale();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    fetch("/api/history")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setHistory(d?.history ?? []))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) {
    return (
      <div className="page-container">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">{t("history.title")}</h1>
        <p style={{ color: "var(--text-secondary)" }}>{t("history.login")}</p>
      </div>
    );
  }

  const fmt = (ts: number) => new Date(ts).toLocaleDateString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="page-container">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">{t("history.title")}</h1>
      {loading ? (
        <p style={{ color: "var(--text-tertiary)" }}>…</p>
      ) : history.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>{t("history.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {history.map((entry) => (
            <li key={entry.path + entry.ts}>
              <Link href={entry.path} className="block card px-4 py-3 hover:border-[var(--color-brand-300)] transition-colors">
                <div className="text-sm font-medium" style={{ color: "var(--active-text)" }}>{entry.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{fmt(entry.ts)}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
