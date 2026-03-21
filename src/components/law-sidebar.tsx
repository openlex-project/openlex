"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface Props {
  gesetz: string;
  title: string;
  unitLabel: string;
  provisions: number[];
}

export function LawSidebar({ gesetz, title, unitLabel, provisions }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-open");
    if (stored !== null) setOpen(stored === "1");
  }, []);

  const toggle = () => {
    setOpen((v) => {
      localStorage.setItem("sidebar-open", v ? "0" : "1");
      return !v;
    });
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={toggle} />}
      <aside className={`
        fixed lg:sticky top-[57px] left-0 z-40 lg:z-auto
        h-[calc(100vh-57px)] bg-white dark:bg-gray-950
        border-r border-gray-200 dark:border-gray-700
        transition-[width,transform] duration-200 ease-in-out flex flex-col shrink-0
        ${open ? "w-64 translate-x-0" : "w-0 -translate-x-full lg:w-10 lg:translate-x-0"}
      `}>
        <button onClick={toggle} className="hidden lg:flex items-center justify-end px-3 h-10 w-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label={open ? "Sidebar schließen" : "Sidebar öffnen"}>
          {open ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M13 8l-4 4 4 4" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M11 8l4 4-4 4" /></svg>
          )}
        </button>
        <nav className={`overflow-y-auto flex-1 ${open ? "opacity-100" : "opacity-0 lg:hidden"}`}>
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</div>
          <ul className="py-1 text-sm">
            {provisions.map((nr) => {
              const href = `/law/${gesetz}/${nr}`;
              const active = pathname === href;
              return (
                <li key={nr}>
                  <a href={href} className={`block px-4 py-1.5 transition-colors ${
                    active
                      ? "font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}>
                    {unitLabel} {nr}
                  </a>
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
