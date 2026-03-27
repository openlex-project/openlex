"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n/useT";
import { useLocale } from "@/components/locale-provider";
import { formatDate } from "@/lib/format-date";
import { fetchJson } from "@/lib/fetch-json";

interface Issue { id: number; title: string; state: "open" | "closed"; created_at: string; comments: number; closedByUser: boolean; repo: string }
interface Comment { author: string; body: string; created_at: string }

function IssueCard({ issue }: { issue: Issue }) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [state, setState] = useState(issue.state);

  const loadComments = async () => {
    if (!open) {
      const data = await fetchJson<{ comments: Comment[] }>(`/api/feedback/comments?repo=${encodeURIComponent(issue.repo)}&issueId=${issue.id}`);
      if (data) setComments(data.comments);
    }
    setOpen(!open);
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    const ok = await fetchJson("/api/feedback/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "comment", repo: issue.repo, issueId: issue.id, body: reply }) });
    if (ok) { setComments([...comments, { author: "you", body: reply, created_at: new Date().toISOString() }]); setReply(""); }
    setSending(false);
  };

  const closeIssue = async () => {
    const ok = await fetchJson("/api/feedback/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "close", repo: issue.repo, issueId: issue.id }) });
    if (ok) setState("closed");
  };

  const canClose = state === "open";
  const closedByAuthor = state === "closed" && !issue.closedByUser;

  return (
    <li className="card overflow-hidden">
      <button onClick={loadComments} className="w-full px-4 py-3 flex items-center gap-2 text-left">
        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} style={{ color: "var(--text-tertiary)" }} />
        <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${state === "open" ? "bg-green-500" : "bg-gray-400"}`} />
        <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--text-primary)" }}>{issue.title}</span>
        <span className="text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>{formatDate(issue.created_at, locale)}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          {comments.length === 0 ? (
            <p className="text-xs py-3" style={{ color: "var(--text-tertiary)" }}>—</p>
          ) : (
            <ul className="py-2 space-y-3">
              {comments.map((c, i) => (
                <li key={i}>
                  <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{c.author} · {formatDate(c.created_at, locale)}</div>
                  <div className="text-sm mt-0.5 whitespace-pre-line" style={{ color: "var(--text-primary)" }}>{c.body}</div>
                </li>
              ))}
            </ul>
          )}
          {state === "open" && (
            <div className="flex gap-2 mt-2">
              <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t("feedback.replyPlaceholder")} className="flex-1 text-sm px-3 py-1.5 rounded-md border" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text-primary)" }} aria-label={t("feedback.replyPlaceholder")} />
              <button onClick={sendReply} disabled={sending || !reply.trim()} className="text-sm px-3 py-1.5 rounded-md text-white disabled:opacity-50" style={{ background: "var(--color-brand-600)" }}>{t("feedback.send")}</button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-3">
            {canClose && <button onClick={closeIssue} className="text-xs px-2 py-1 rounded border transition-colors hover:bg-[var(--surface-secondary)]" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{t("feedback.close")}</button>}
            {closedByAuthor && <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t("feedback.closedByAuthor")}</span>}
            {state === "closed" && issue.closedByUser && <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t("feedback.closed")}</span>}
          </div>
        </div>
      )}
    </li>
  );
}

export default function FeedbackPage() {
  const { data: session } = useSession();
  const t = useT();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    fetch("/api/feedback").then((r) => {
      if (r.status === 404) { setDisabled(true); setLoading(false); return null; }
      return r.ok ? r.json() : null;
    }).then((d) => { if (d) setIssues(d.issues ?? []); }).finally(() => setLoading(false));
  }, [session]);

  if (disabled) return <div className="page-container"><h1 className="text-xl sm:text-2xl font-bold mb-4">404</h1><p style={{ color: "var(--text-secondary)" }}>Page not found.</p></div>;

  if (!session) return <div className="page-container"><h1 className="text-xl sm:text-2xl font-bold mb-4">{t("feedback.title")}</h1><p style={{ color: "var(--text-secondary)" }}>{t("feedback.login")}</p></div>;

  return (
    <div className="page-container">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">{t("feedback.title")}</h1>
      {loading ? <p style={{ color: "var(--text-tertiary)" }}>…</p>
        : issues.length === 0 ? <p style={{ color: "var(--text-secondary)" }}>{t("feedback.empty")}</p>
        : <ul className="space-y-2">{issues.map((issue) => <IssueCard key={`${issue.repo}-${issue.id}`} issue={issue} />)}</ul>}
    </div>
  );
}
