"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { SidebarShell } from "./sidebar-shell";
import type { JournalIssue } from "@/lib/registry";

interface Props {
  journal: string;
  title: string;
  issues: JournalIssue[];
  issueLabel?: string;
  activeYear?: string;
  activeIssue?: string;
  activeArticle?: string;
}

export function JournalSidebar({ journal, title, issues, issueLabel = "Heft", activeYear, activeIssue, activeArticle }: Props) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (activeYear && activeIssue) s.add(`${activeYear}-${activeIssue}`);
    return s;
  });

  const toggleIssue = (key: string) => setExpanded((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const base = `/journal/${journal}`;

  return (
    <SidebarShell>
      <a href={base} className="block px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{title}</a>
      <ul className="py-1 text-sm">
        {issues.map((iss) => {
          const key = `${iss.year}-${iss.issue}`;
          const isExpanded = expanded.has(key);
          const isActive = iss.year === activeYear && iss.issue === activeIssue;
          return (
            <li key={key}>
              <button onClick={() => toggleIssue(key)} aria-expanded={isExpanded}
                className={`w-full flex items-center justify-between px-4 py-1.5 text-left ${isActive && !activeArticle ? "font-semibold" : ""}`}
                style={{ color: isActive && !activeArticle ? "var(--active-text)" : "var(--text-primary)" }}>
                <span>{issueLabel} {iss.issue}/{iss.year}</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
              {isExpanded && (
                <ul className="ml-4" style={{ borderLeft: "1px solid var(--border-subtle)" }}>
                  {iss.articles.map((a) => {
                    const href = `${base}/${iss.year}/${iss.issue}/${a.slug}`;
                    const active = pathname === href;
                    return (
                      <li key={a.slug}>
                        <a href={href} className={`block px-3 py-1 text-xs leading-snug ${active ? "font-semibold" : ""}`}
                          style={{ color: active ? "var(--active-text)" : "var(--text-tertiary)", background: active ? "var(--active-bg)" : undefined }}>
                          <span className="font-medium">{a.authors[0]?.name.split(" ").pop()}</span>{" – "}
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
    </SidebarShell>
  );
}
