"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { JournalIssue } from "@/lib/registry";

interface Props {
  zeitschrift: string;
  title: string;
  issues: JournalIssue[];
  activeYear?: string;
  activeIssue?: string;
  activeArticle?: string;
}

export function JournalSidebar({ zeitschrift, title, issues, activeYear, activeIssue, activeArticle }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (activeYear && activeIssue) s.add(`${activeYear}-${activeIssue}`);
    return s;
  });

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-open");
    if (stored !== null) setOpen(stored === "1");
  }, []);

  const toggle = () => setOpen((v) => { localStorage.setItem("sidebar-open", v ? "0" : "1"); return !v; });
  const toggleIssue = (key: string) => setExpanded((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const base = `/journal/${zeitschrift}`;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={toggle} />}
      <aside className={`
        fixed lg:sticky top-[57px] left-0 z-40 lg:z-auto
        h-[calc(100vh-57px)] bg-white dark:bg-gray-950
        border-r border-gray-200 dark:border-gray-700
        transition-[width,transform] duration-200 ease-in-out flex flex-col shrink-0
        ${open ? "w-72 translate-x-0" : "w-0 -translate-x-full lg:w-10 lg:translate-x-0"}
      `}>
        <button onClick={toggle} className="hidden lg:flex items-center justify-end px-3 h-10 w-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label={open ? "Sidebar schließen" : "Sidebar öffnen"}>
          {open ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M13 8l-4 4 4 4" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M11 8l4 4-4 4" /></svg>
          )}
        </button>
        <nav className={`overflow-y-auto flex-1 ${open ? "opacity-100" : "opacity-0 lg:hidden"}`}>
          <a href={base} className="block px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600">{title}</a>
          <ul className="py-1 text-sm">
            {issues.map((iss) => {
              const key = `${iss.year}-${iss.issue}`;
              const isExpanded = expanded.has(key);
              const isActive = iss.year === activeYear && iss.issue === activeIssue;
              return (
                <li key={key}>
                  <button onClick={() => toggleIssue(key)} className={`w-full flex items-center justify-between px-4 py-1.5 text-left transition-colors ${
                    isActive && !activeArticle ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}>
                    <span>Heft {iss.issue}/{iss.year}</span>
                    <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                  {isExpanded && (
                    <ul className="ml-4 border-l border-gray-200 dark:border-gray-700">
                      {iss.articles.map((a) => {
                        const href = `${base}/${iss.year}/${iss.issue}/${a.slug}`;
                        const active = pathname === href;
                        return (
                          <li key={a.slug}>
                            <a href={href} className={`block px-3 py-1 text-xs leading-snug transition-colors ${
                              active
                                ? "font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            }`}>
                              <span className="font-medium">{a.author.split(" ").pop()}</span>
                              {" – "}
                              <span>{a.title.length > 40 ? a.title.slice(0, 40) + "…" : a.title}</span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      {!open && (
        <button onClick={toggle} className="fixed bottom-4 left-4 z-30 lg:hidden bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg" aria-label="Navigation öffnen">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      )}
    </>
  );
}
