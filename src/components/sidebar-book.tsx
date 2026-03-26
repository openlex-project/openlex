"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { SidebarShell } from "./sidebar-shell";
import { useExpandable } from "./use-expandable";
import type { TocEntry, Heading } from "@/lib/registry";

export interface BackmatterSection { id: string; title: string }

interface Props {
  work: string;
  toc: TocEntry[];
  edition: string;
  activeSlug?: string;
  headings?: Heading[];
  backmatter?: BackmatterSection[];
}

function findExpandedKeys(toc: TocEntry[], slug: string, path: string[] = []): string[] {
  for (const e of toc) {
    const s = e.file.replace(/\.md$/, "");
    if (s === slug) return path;
    if (e.children) {
      const found = findExpandedKeys(e.children, slug, [...path, s]);
      if (found.length) return found;
    }
  }
  return [];
}

function useActiveHeading(ids: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    if (!ids.length) return;
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const ob = new IntersectionObserver(
      (entries) => { for (const e of entries) { if (e.isIntersecting) { setActiveId(e.target.id); break; } } },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => ob.observe(el));
    return () => ob.disconnect();
  }, [ids]);
  return activeId;
}

export function SidebarBook({ work, toc, edition, activeSlug, headings = [], backmatter = [] }: Props) {
  const pathname = usePathname();
  const prefix = edition === "main" ? `/${work}` : `/${work}/${edition}`;
  const activeKeys = useMemo(() => activeSlug ? findExpandedKeys(toc, activeSlug) : [], [toc, activeSlug]);
  const { expanded, toggle } = useExpandable(activeKeys);
  const headingIds = headings.map((h) => h.id);
  const activeHeadingId = useActiveHeading(headingIds);

  const renderEntry = (entry: TocEntry, depth = 0) => {
    const slug = entry.file.replace(/\.md$/, "");
    const href = `${prefix}/${slug}`;
    const active = pathname === href;
    const hasChildren = !!entry.children?.length;
    const isExpanded = expanded.has(slug);

    return (
      <li key={slug}>
        <div className="flex items-center">
          {hasChildren ? (
            <button onClick={() => toggle(slug)} aria-expanded={isExpanded} className="pl-1 pr-0.5 py-1.5 shrink-0" style={{ paddingLeft: `${depth * 0.75 + 0.25}rem`, color: "var(--text-tertiary)" }}>
              <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
            </button>
          ) : null}
          <Link href={href} className={`block py-1.5 truncate flex-1 ${active ? "font-semibold" : ""}`}
            style={{ paddingLeft: hasChildren ? "0.25rem" : `${1 + depth * 0.75}rem`, paddingRight: "1rem", color: active ? "var(--active-text)" : "var(--text-secondary)", background: active ? "var(--active-bg)" : undefined }}>
            {entry.title}
          </Link>
        </div>
        {hasChildren && isExpanded && <ul>{entry.children!.map((c) => renderEntry(c, depth + 1))}</ul>}
        {active && headings.length > 0 && (
          <ul>{headings.map((h) => {
            const isCurrent = activeHeadingId === h.id;
            return (
              <li key={h.id}>
                <a href={`#${h.id}`} className={`block py-1 truncate text-xs${isCurrent ? " font-semibold" : ""}`}
                  style={{ paddingLeft: `${1 + (h.level - 1) * 0.75}rem`, paddingRight: "1rem", color: isCurrent ? "var(--active-text)" : "var(--text-tertiary)" }}>
                  {h.text}
                </a>
              </li>
            );
          })}</ul>
        )}
      </li>
    );
  };

  return (
    <SidebarShell width="w-64">
      <ul className="py-2 text-sm">{toc.map((entry) => renderEntry(entry))}</ul>
      {backmatter.length > 0 && (
        <ul className="py-2 text-sm mt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          {backmatter.map((s) => {
            const href = `/${work}/${s.id}`;
            const active = pathname === href;
            return (
              <li key={s.id}>
                <Link href={href} className={`block px-4 py-1.5 truncate ${active ? "font-semibold" : ""}`}
                  style={{ color: active ? "var(--active-text)" : "var(--text-tertiary)", background: active ? "var(--active-bg)" : undefined }}>
                  {s.title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </SidebarShell>
  );
}
