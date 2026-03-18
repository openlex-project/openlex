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
    const sel = window.getSelection()?.toString().trim() ?? "";
    setSelectedText(sel);
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
        body: JSON.stringify({
          repo,
          category,
          location: window.location.href,
          selectedText,
          comment,
        }),
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
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-blue-700 text-xl"
        aria-label="Feedback geben"
        title="Feedback geben"
      >
        ✎
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <form
            onSubmit={handleSubmit}
            className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-5 w-80 space-y-3"
          >
            <h3 className="font-semibold">Feedback</h3>

            {selectedText && (
              <blockquote className="text-sm text-gray-500 border-l-2 border-gray-300 pl-2 truncate">
                {selectedText.slice(0, 120)}
              </blockquote>
            )}

            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`text-xs px-2 py-1 rounded-full border ${
                    category === c
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
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
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={submitting || done}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50"
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
