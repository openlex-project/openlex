"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { SidebarShell } from "./sidebar-shell";
import { useExpandable } from "./use-expandable";
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

export function SidebarJournal({ journal, title, issues, issueLabel = "Heft", activeYear, activeIssue, activeArticle }: Props) {
  const pathname = usePathname();
  const activeKeys = useMemo(() => activeYear && activeIssue ? [`${activeYear}-${activeIssue}`] : [], [activeYear, activeIssue]);
  const { expanded, toggle: toggleIssue } = useExpandable(activeKeys);
  const base = `/${journal}`;

  return (
    <SidebarShell>
      <Link href={base} className="block px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{title}</Link>
      <ul className="py-1 text-sm">
        {issues.map((iss) => {
          const key = `${iss.year}-${iss.issue}`;
          const isExpanded = expanded.has(key);
          const isActive = iss.year === activeYear && iss.issue === activeIssue;
          return (
            <li key={key}>
              <button type="button" onClick={() => toggleIssue(key)} aria-expanded={isExpanded}
                className={`w-full flex items-center justify-between px-4 py-1.5 text-left ${isActive && !activeArticle ? "font-semibold" : ""}`}
                style={{ color: isActive && !activeArticle ? "var(--active-text)" : "var(--text-primary)" }}>
                <span>{issueLabel} {iss.issue}/{iss.year}</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </button>
              {isExpanded && (
                <ul className="ml-4" style={{ borderLeft: "1px solid var(--border-subtle)" }}>
                  {iss.articles.map((a) => {
                    const href = `${base}/${iss.year}/${iss.issue}/${a.slug}`;
                    const active = pathname === href;
                    return (
                      <li key={a.slug}>
                        <Link href={href} className={`block px-3 py-1 text-xs leading-snug ${active ? "font-semibold" : ""}`}
                          style={{ color: active ? "var(--active-text)" : "var(--text-tertiary)", background: active ? "var(--active-bg)" : undefined }}>
                          <span className="font-medium">{a.authors[0]?.name.split(" ").pop()}</span>{" – "}
                          <span>{a.title.length > 40 ? `${a.title.slice(0, 40)}…` : a.title}</span>
                        </Link>
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
