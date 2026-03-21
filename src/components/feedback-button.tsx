"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

const CATEGORIES = ["Fehler", "Ergänzung", "Frage"] as const;

export function FeedbackButton({ repo }: { repo: string }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [comment, setComment] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!session?.user) return null;

  const handleOpen = () => {
    setSelectedText(window.getSelection()?.toString().trim() ?? "");
    setOpen(true);
    setDone(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, category, location: window.location.href, selectedText, comment }),
      });
      if (res.ok) {
        setDone(true);
        setComment("");
        setTimeout(() => setOpen(false), 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 rounded-full w-12 h-12 flex items-center justify-center shadow-lg text-white text-xl transition-transform hover:scale-105"
        style={{ background: "var(--color-brand-600)" }}
        aria-label="Feedback geben"
        title="Feedback geben"
      >
        ✎
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6">
          <div className="fixed inset-0 bg-black/20" onClick={() => setOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="relative rounded-xl shadow-xl p-5 w-80 space-y-3"
            style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold">Feedback</h3>

            {selectedText && (
              <blockquote className="text-sm pl-2 truncate" style={{ borderLeft: "2px solid var(--border)", color: "var(--text-secondary)" }}>
                {selectedText.slice(0, 120)}
              </blockquote>
            )}

            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className="text-xs px-2 py-1 rounded-full border transition-colors"
                  style={{
                    background: category === c ? "var(--color-brand-600)" : "transparent",
                    color: category === c ? "white" : "var(--text-secondary)",
                    borderColor: category === c ? "var(--color-brand-600)" : "var(--border)",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ihr Kommentar…"
              required
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: "var(--surface-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={submitting || done}
                className="text-sm text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                style={{ background: "var(--color-brand-600)" }}
              >
                {done ? "✓ Gesendet" : submitting ? "…" : "Senden"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
