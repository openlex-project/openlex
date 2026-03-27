"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useT } from "@/lib/i18n/useT";

interface FeedbackIssue { title: string; url: string; state: "open" | "closed"; created_at: string; comments: number }

export default function FeedbackPage() {
  const { data: session } = useSession();
  const t = useT();
  const [issues, setIssues] = useState<FeedbackIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    fetch("/api/feedback")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setIssues(d?.issues ?? []))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) {
    return (
      <div className="page-container">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">{t("feedback.title")}</h1>
        <p style={{ color: "var(--text-secondary)" }}>{t("feedback.login")}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">{t("feedback.title")}</h1>
      {loading ? (
        <p style={{ color: "var(--text-tertiary)" }}>…</p>
      ) : issues.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>{t("feedback.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {issues.map((issue) => (
            <li key={issue.url}>
              <a href={issue.url} target="_blank" rel="noopener" className="block card px-4 py-3 hover:border-[var(--color-brand-300)] transition-colors">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${issue.state === "open" ? "bg-green-500" : "bg-gray-400"}`} />
                  <span className="text-sm font-medium" style={{ color: "var(--active-text)" }}>{issue.title}</span>
                </div>
                <div className="text-xs mt-1 flex gap-3" style={{ color: "var(--text-tertiary)" }}>
                  <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                  {issue.comments > 0 && <span>{issue.comments} {issue.comments === 1 ? t("feedback.reply") : t("feedback.replies")}</span>}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
