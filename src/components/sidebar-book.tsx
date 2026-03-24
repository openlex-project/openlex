"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarShell } from "./sidebar-shell";
import type { TocEntry, Heading } from "@/lib/registry";

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

function useActiveHeading(ids: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    if (!ids.length) return;
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const ob = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setActiveId(e.target.id); break; }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => ob.observe(el));
    return () => ob.disconnect();
  }, [ids]);
  return activeId;
}

export function SidebarBook({ work, toc, edition, headings = [], backmatter = [] }: Props) {
  const pathname = usePathname();
  const prefix = edition === "main" ? `/${work}` : `/${work}/${edition}`;
  const headingIds = headings.map((h) => h.id);
  const activeHeadingId = useActiveHeading(headingIds);

  const renderEntry = (entry: TocEntry, depth = 0) => {
    const slug = entry.file.replace(/\.md$/, "");
    const href = `${prefix}/${slug}`;
    const active = pathname === href;

    return (
      <li key={slug}>
        <Link href={href} className={`block py-1.5 truncate ${active ? "font-semibold" : ""}`}
          style={{ paddingLeft: `${1 + depth * 0.75}rem`, paddingRight: "1rem", color: active ? "var(--active-text)" : "var(--text-secondary)", background: active ? "var(--active-bg)" : undefined }}>
          {entry.title}
        </Link>
        {entry.children?.length ? <ul>{entry.children.map((c) => renderEntry(c, depth + 1))}</ul> : null}
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
