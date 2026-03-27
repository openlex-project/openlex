"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signIn, signOut, getProviders } from "next-auth/react";
import Link from "next/link";
import { useT } from "@/lib/i18n/useT";
import { ProviderIcon } from "./provider-icon";
import { User } from "lucide-react";

type Provider = { id: string; name: string };

export default function UserButton({ hasFeedback }: { hasFeedback?: boolean }) {
  const { data: session } = useSession();
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    getProviders().then((p) => setProviders(p ? Object.values(p) : []));
  }, []);

  if (!session && providers !== null && providers.length === 0) return null;

  const enter = () => { clearTimeout(timeout.current); setOpen(true); };
  const leave = () => { timeout.current = setTimeout(() => setOpen(false), 200); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); ref.current?.querySelector("button")?.focus(); }
    if (!open) return;
    const items = ref.current?.querySelectorAll<HTMLElement>("[role='menuitem']");
    if (!items?.length) return;
    const idx = Array.from(items).indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(idx + 1) % items.length]!.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); items[(idx - 1 + items.length) % items.length]!.focus(); }
  };

  const menuLink = (href: string, label: string) => (
    <Link href={href} onClick={() => setOpen(false)} className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--surface-secondary)]" style={{ color: "var(--text-primary)" }} role="menuitem" tabIndex={-1}>
      {label}
    </Link>
  );

  return (
    <div ref={ref} className="relative" onMouseEnter={enter} onMouseLeave={leave} onKeyDown={handleKeyDown}>
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
            ) : <User className="w-5 h-5" />}
            <span className="hidden sm:inline max-w-[120px] truncate">{session.user?.name}</span>
          </>
        ) : <User className="w-5 h-5" />}
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
              {hasFeedback && menuLink("/feedback", t("nav.feedback"))}
              <div className="border-t my-1" style={{ borderColor: "var(--border-subtle)" }} />
              <button onClick={() => signOut()} className="block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-[var(--surface-secondary)]" style={{ color: "var(--text-tertiary)" }} role="menuitem" tabIndex={-1}>
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <div className="px-4 py-2 text-xs" style={{ color: "var(--text-tertiary)" }}>{t("login.subtitle")}</div>
              {providers!.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => signIn(p.id, { callbackUrl: window.location.pathname })}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors hover:bg-[var(--surface-secondary)]"
                    style={{ color: "var(--text-primary)" }}
                    role="menuitem"
                    tabIndex={-1}
                  >
                    <ProviderIcon id={p.id} />
                    {t("login.with", { name: p.name })}
                  </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
