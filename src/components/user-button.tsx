"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useT } from "@/lib/i18n/useT";

export default function UserButton() {
  const { data: session } = useSession();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!session) {
    return (
      <Link href="/login" className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors" style={{ color: "var(--text-secondary)" }}>
        {t("nav.login")}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors"
        style={{ color: "var(--text-secondary)" }}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="hidden sm:inline">{session.user?.name}</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg border py-1 z-50"
          style={{ background: "var(--surface-elevated)", borderColor: "var(--border)" }}
          role="menu"
        >
          <Link href="/bookmarks" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm transition-colors" style={{ color: "var(--text-primary)" }} role="menuitem">
            {t("nav.bookmarks")}
          </Link>
          <Link href="/history" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm transition-colors" style={{ color: "var(--text-primary)" }} role="menuitem">
            {t("nav.history")}
          </Link>
          <div className="border-t my-1" style={{ borderColor: "var(--border-subtle)" }} />
          <button onClick={() => signOut()} className="block w-full text-left px-4 py-2 text-sm transition-colors" style={{ color: "var(--text-tertiary)" }} role="menuitem">
            {t("nav.logout")}
          </button>
        </div>
      )}
    </div>
  );
}
