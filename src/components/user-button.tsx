"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signIn, signOut, getProviders } from "next-auth/react";
import Link from "next/link";
import { useT } from "@/lib/i18n/useT";

type Provider = { id: string; name: string };

const ICONS: Record<string, React.ReactNode> = {
  github: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>,
  google: <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
  apple: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>,
  "azure-ad": <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.4 24H0l9.2-16L3.6 0h7.8l6 8-6 16z"/><path d="M24 19.5l-8.4 4.5 5.6-14.7L17.6 0H24l-4.4 9.3L24 19.5z" opacity=".7"/></svg>,
  gitlab: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#E24329"><path d="M12 22.5L16.24 9.65H7.76L12 22.5z"/><path d="M12 22.5L7.76 9.65H1.42L12 22.5z" fill="#FC6D26"/><path d="M1.42 9.65L.14 13.6a.87.87 0 0 0 .32.97L12 22.5 1.42 9.65z" fill="#FCA326"/><path d="M1.42 9.65h6.34L5.12.56a.44.44 0 0 0-.84 0L1.42 9.65z" fill="#E24329"/><path d="M12 22.5l4.24-12.85h6.34L12 22.5z" fill="#FC6D26"/><path d="M22.58 9.65l1.28 3.95a.87.87 0 0 1-.32.97L12 22.5l10.58-12.85z" fill="#FCA326"/><path d="M22.58 9.65h-6.34l2.64-9.09a.44.44 0 0 1 .84 0l2.86 9.09z" fill="#E24329"/></svg>,
};

function ProviderIcon({ id }: { id: string }) {
  return ICONS[id] ?? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25z" />
    </svg>
  );
}

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

export default function UserButton() {
  const { data: session } = useSession();
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!session) getProviders().then((p) => { if (p) setProviders(Object.values(p)); });
  }, [session]);

  const enter = () => { clearTimeout(timeout.current); setOpen(true); };
  const leave = () => { timeout.current = setTimeout(() => setOpen(false), 200); };

  const menuLink = (href: string, label: string) => (
    <Link href={href} onClick={() => setOpen(false)} className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--surface-secondary)]" style={{ color: "var(--text-primary)" }} role="menuitem">
      {label}
    </Link>
  );

  return (
    <div ref={ref} className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors"
        style={{ color: "var(--text-secondary)" }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={session ? session.user?.name ?? t("nav.profile") : t("nav.login")}
      >
        {session ? (
          <>
            {session.user?.image ? (
              <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
            ) : <UserIcon />}
            <span className="hidden sm:inline max-w-[120px] truncate">{session.user?.name}</span>
          </>
        ) : <UserIcon />}
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-56 rounded-lg shadow-lg border py-1 z-50"
          style={{ background: "var(--surface-elevated)", borderColor: "var(--border)" }}
          role="menu"
          onMouseEnter={enter}
          onMouseLeave={leave}
        >
          {session ? (
            <>
              <div className="px-4 py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{session.user?.name}</div>
                <div className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{session.user?.email}</div>
              </div>
              {menuLink("/profile", t("nav.profile"))}
              {menuLink("/bookmarks", t("nav.bookmarks"))}
              {menuLink("/history", t("nav.history"))}
              {menuLink("/feedback", t("nav.feedback"))}
              <div className="border-t my-1" style={{ borderColor: "var(--border-subtle)" }} />
              <button onClick={() => signOut()} className="block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-[var(--surface-secondary)]" style={{ color: "var(--text-tertiary)" }} role="menuitem">
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <div className="px-4 py-2 text-xs" style={{ color: "var(--text-tertiary)" }}>{t("login.subtitle")}</div>
              {providers.length === 0 ? (
                <div className="px-4 py-2 text-sm" style={{ color: "var(--text-tertiary)" }}>{t("login.none")}</div>
              ) : (
                providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => signIn(p.id, { callbackUrl: window.location.pathname })}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors hover:bg-[var(--surface-secondary)]"
                    style={{ color: "var(--text-primary)" }}
                    role="menuitem"
                  >
                    <ProviderIcon id={p.id} />
                    {t("login.with", { name: p.name })}
                  </button>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
