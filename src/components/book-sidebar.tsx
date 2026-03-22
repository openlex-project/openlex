"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { TocEntry, Heading } from "@/lib/registry";
import { useT } from "@/lib/i18n/useT";

export interface BackmatterSection {
  id: string;
  title: string;
}

interface Props {
  work: string;
  toc: TocEntry[];
  edition: string;
  activeSlug?: string;
  headings?: Heading[];
  backmatter?: BackmatterSection[];
}

export function BookSidebar({ work, toc, edition, activeSlug, headings = [], backmatter = [] }: Props) {
  const pathname = usePathname();
  const t = useT();
  const prefix = edition === "main" ? `/book/${work}` : `/book/${work}/${edition}`;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-open");
    if (stored !== null) setOpen(stored === "1");
  }, []);

  const toggle = () => setOpen((v) => { localStorage.setItem("sidebar-open", v ? "0" : "1"); return !v; });

  const renderEntry = (entry: TocEntry, depth = 0) => {
    const slug = entry.file.replace(/\.md$/, "");
    const href = `${prefix}/${slug}`;
    const active = pathname === href;

    return (
      <li key={slug}>
        <a
          href={href}
          className={`block py-1.5 truncate transition-colors ${active ? "font-semibold" : ""}`}
          style={{
            paddingLeft: `${1 + depth * 0.75}rem`,
            paddingRight: "1rem",
            color: active ? "var(--active-text)" : "var(--text-secondary)",
            background: active ? "var(--active-bg)" : undefined,
          }}
        >
          {entry.title}
        </a>
        {entry.children && entry.children.length > 0 && (
          <ul>{entry.children.map((c) => renderEntry(c, depth + 1))}</ul>
        )}
        {active && headings.length > 0 && (
          <ul>
            {headings.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className="block py-1 truncate text-xs transition-colors"
                  style={{
                    paddingLeft: `${1 + (h.level - 1) * 0.75}rem`,
                    paddingRight: "1rem",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={toggle} />}
      <aside
        className={`sticky top-[57px] h-[calc(100vh-57px)] shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out flex flex-col ${
          open ? "w-64" : "w-0 lg:w-10"
        }`}
        style={{ background: "var(--surface)", borderRight: open ? "1px solid var(--border-subtle)" : undefined }}
      >
        <button onClick={toggle} className="hidden lg:flex items-center justify-end px-3 h-10 w-full" style={{ color: "var(--text-tertiary)" }} aria-label={open ? t("sidebar.close") : t("sidebar.open")} aria-expanded={open}>
          {open ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M13 8l-4 4 4 4" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M11 8l4 4-4 4" /></svg>
          )}
        </button>
        <nav className={`overflow-y-auto flex-1 ${open ? "" : "hidden"}`}>
          <ul className="py-2 text-sm">{toc.map((entry) => renderEntry(entry))}</ul>
          {backmatter.length > 0 && (
            <ul className="py-2 text-sm mt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              {backmatter.map((s) => {
                const href = `/book/${work}/${s.id}`;
                const active = pathname === href;
                return (
                  <li key={s.id}>
                    <a
                      href={href}
                      className={`block px-4 py-1.5 truncate transition-colors ${active ? "font-semibold" : ""}`}
                      style={{ color: active ? "var(--active-text)" : "var(--text-tertiary)", background: active ? "var(--active-bg)" : undefined }}
                    >
                      {s.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </aside>
      {!open && (
        <button onClick={toggle} className="fixed bottom-4 left-4 z-30 lg:hidden rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-white" style={{ background: "var(--color-brand-600)" }} aria-label={t("nav.open")}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      )}
    </>
  );
}
