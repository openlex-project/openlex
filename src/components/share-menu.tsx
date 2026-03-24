"use client";

import { useState, useEffect, useRef } from "react";
import { Share2, Copy, Mail, Check } from "lucide-react";
import { useT } from "@/lib/i18n/useT";

const icons: Record<string, React.ReactNode> = {
  copy: <Copy className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  x: <span className="w-4 h-4 inline-flex items-center justify-center font-bold text-xs">𝕏</span>,
  linkedin: <span className="w-4 h-4 inline-flex items-center justify-center font-bold text-xs">in</span>,
  whatsapp: <span className="w-4 h-4 inline-flex items-center justify-center font-bold text-xs">W</span>,
};

export function ShareMenu({ title, siteName, targets }: { title: string; siteName: string; targets: string[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = `${title} — ${siteName}`;

  const handle = (target: string) => {
    if (target === "copy") {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    const urls: Record<string, string> = {
      email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    };
    if (urls[target]) window.open(urls[target], "_blank", "noopener");
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="inline-flex items-center text-sm transition-colors" style={{ color: "var(--text-tertiary)" }} aria-label={t("share.title")}>
        <Share2 className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-md border py-1 shadow-lg" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {targets.map((target) => (
            <button key={target} onClick={() => handle(target)} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              {target === "copy" && copied ? <Check className="w-4 h-4" /> : icons[target]}
              {target === "copy" && copied ? t("share.copied") : t(`share.${target}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
