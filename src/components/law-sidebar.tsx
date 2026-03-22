"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface Props {
  law: string;
  title: string;
  unitLabel: string;
  provisions: number[];
}

export function LawSidebar({ law, title, unitLabel, provisions }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-open");
    if (stored !== null) setOpen(stored === "1");
  }, []);

  const toggle = () => setOpen((v) => { localStorage.setItem("sidebar-open", v ? "0" : "1"); return !v; });

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={toggle} />}
      <aside
        className={`fixed lg:sticky top-[57px] left-0 z-40 lg:z-auto h-[calc(100vh-57px)] transition-[width,transform] duration-200 ease-in-out flex flex-col shrink-0 ${
          open ? "w-64 translate-x-0" : "w-0 -translate-x-full lg:w-10 lg:translate-x-0"
        }`}
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border-subtle)" }}
      >
        <button onClick={toggle} className="hidden lg:flex items-center justify-end px-3 h-10 w-full transition-colors" style={{ color: "var(--text-tertiary)" }} aria-label={open ? "Sidebar schließen" : "Sidebar öffnen"}>
          {open ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M13 8l-4 4 4 4" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M11 8l4 4-4 4" /></svg>
          )}
        </button>
        <nav className={`overflow-y-auto flex-1 ${open ? "opacity-100" : "opacity-0 lg:hidden"}`}>
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{title}</div>
          <ul className="py-1 text-sm">
            {provisions.map((nr) => {
              const href = `/law/${law}/${nr}`;
              const active = pathname === href;
              return (
                <li key={nr}>
                  <a
                    href={href}
                    className={`block px-4 py-1.5 transition-colors ${active ? "font-semibold" : ""}`}
                    style={{ color: active ? "var(--active-text)" : "var(--text-secondary)", background: active ? "var(--active-bg)" : undefined }}
                  >
                    {unitLabel} {nr}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      {!open && (
        <button onClick={toggle} className="fixed bottom-4 left-4 z-30 lg:hidden rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-white" style={{ background: "var(--color-brand-600)" }} aria-label="Navigation öffnen">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      )}
    </>
  );
}
