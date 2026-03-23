"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/useT";

interface Props {
  children: ReactNode;
  width?: string;
}

export function SidebarShell({ children, width = "w-72" }: Props) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-open");
    if (stored !== null) setOpen(stored === "1");
  }, []);

  // Track mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) setOpen(false);
  }, [pathname, isMobile]);

  const toggle = useCallback(() => {
    setOpen((v) => {
      localStorage.setItem("sidebar-open", v ? "0" : "1");
      return !v;
    });
  }, []);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={toggle} />}
      <aside
        className={`sticky top-[57px] h-[calc(100vh-57px)] shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out flex flex-col ${
          open ? width : "w-0 lg:w-10"
        }`}
        style={{ background: "var(--surface)", borderRight: open ? "1px solid var(--border-subtle)" : undefined }}
        aria-label={t("sidebar.aria")}
      >
        <button onClick={toggle} className="hidden lg:flex items-center justify-end px-3 h-10 w-full" style={{ color: "var(--text-tertiary)" }} aria-label={open ? t("sidebar.close") : t("sidebar.open")} aria-expanded={open}>
          {open ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M13 8l-4 4 4 4" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M11 8l4 4-4 4" /></svg>
          )}
        </button>
        {open && <nav className="overflow-y-auto flex-1">{children}</nav>}
      </aside>
      {!open && (
        <button onClick={toggle} className="fixed bottom-4 left-4 z-30 lg:hidden rounded-full w-11 h-11 flex items-center justify-center shadow-lg text-white" style={{ background: "var(--color-brand-600)" }} aria-label={t("nav.open")}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      )}
    </>
  );
}
