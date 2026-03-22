"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useT } from "@/lib/i18n/useT";
import type { LawTocNode } from "@/lib/registry";

interface Props {
  law: string;
  title: string;
  unitLabel: string;
  toc: LawTocNode[];
  provisions: number[];
  activeNr?: string;
}

/** Collect all provision nrs under a node */
function collectNrs(node: LawTocNode): string[] {
  if (node.nr) return [node.nr];
  return node.children?.flatMap(collectNrs) ?? [];
}

/** Find all structure labels that contain the active provision */
function findExpandedKeys(toc: LawTocNode[], nr: string, path: string[] = []): string[] {
  for (const node of toc) {
    if (node.nr === nr) return path;
    if (node.children) {
      const key = path.length + "-" + (node.label ?? node.title);
      const found = findExpandedKeys(node.children, nr, [...path, key]);
      if (found.length) return found;
    }
  }
  return [];
}

function TocNode({ node, law, unitLabel, activeNr, depth, expanded, onToggle }: {
  node: LawTocNode; law: string; unitLabel: string; activeNr?: string;
  depth: number; expanded: Set<string>; onToggle: (key: string) => void;
}) {
  const pathname = usePathname();

  // Leaf provision
  if (node.nr) {
    const href = `/law/${law}/${node.nr}`;
    const active = pathname === href;
    return (
      <li>
        <a
          href={href}
          className={`block px-4 py-1 text-sm transition-colors ${active ? "font-semibold" : ""}`}
          style={{ paddingLeft: `${depth * 0.75 + 1}rem`, color: active ? "var(--active-text)" : "var(--text-secondary)", background: active ? "var(--active-bg)" : undefined }}
        >
          {unitLabel} {node.nr}{node.title ? ` ${node.title}` : ""}
        </a>
      </li>
    );
  }

  // Structure node
  const key = depth + "-" + (node.label ?? node.title);
  const isExpanded = expanded.has(key);

  return (
    <li>
      <button
        onClick={() => onToggle(key)}
        aria-expanded={isExpanded}
        className="w-full flex items-center gap-1 px-4 py-1 text-sm text-left transition-colors"
        style={{ paddingLeft: `${depth * 0.75 + 1}rem`, color: "var(--text-primary)" }}
      >
        <svg className={`w-3 h-3 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="font-medium">{node.label}</span>
        {node.title && <span className="truncate" style={{ color: "var(--text-tertiary)" }}>{node.title}</span>}
      </button>
      {isExpanded && node.children && (
        <ul>
          {node.children.map((child, i) => (
            <TocNode key={child.nr ?? `${i}-${child.label}`} node={child} law={law} unitLabel={unitLabel} activeNr={activeNr} depth={depth + 1} expanded={expanded} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function LawSidebar({ law, title, unitLabel, toc, provisions, activeNr }: Props) {
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(true);

  // Auto-expand ancestors of active provision
  const initialExpanded = useMemo(() => {
    if (!activeNr) return new Set<string>();
    return new Set(findExpandedKeys(toc, activeNr));
  }, [toc, activeNr]);

  const [expanded, setExpanded] = useState(initialExpanded);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-open");
    if (stored !== null) setOpen(stored === "1");
  }, []);

  // Update expanded when active provision changes
  useEffect(() => {
    if (activeNr) {
      setExpanded((prev) => {
        const keys = findExpandedKeys(toc, activeNr);
        if (keys.every((k) => prev.has(k))) return prev;
        const next = new Set(prev);
        keys.forEach((k) => next.add(k));
        return next;
      });
    }
  }, [activeNr, toc]);

  const toggle = () => setOpen((v) => { localStorage.setItem("sidebar-open", v ? "0" : "1"); return !v; });
  const onToggle = (key: string) => setExpanded((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const hasToc = toc.length > 0;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={toggle} />}
      <aside
        className={`max-lg:fixed lg:sticky top-[57px] left-0 z-40 lg:z-auto h-[calc(100vh-57px)] transition-[width,transform] duration-200 ease-in-out flex flex-col shrink-0 ${
          open ? "w-72 max-lg:translate-x-0" : "w-0 max-lg:-translate-x-full lg:w-10"
        }`}
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border-subtle)" }}
      >
        <button onClick={toggle} className="hidden lg:flex items-center justify-end px-3 h-10 w-full transition-colors" style={{ color: "var(--text-tertiary)" }} aria-label={open ? t("sidebar.close") : t("sidebar.open")} aria-expanded={open}>
          {open ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M13 8l-4 4 4 4" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M11 8l4 4-4 4" /></svg>
          )}
        </button>
        <nav className={`overflow-y-auto flex-1 ${open ? "opacity-100" : "opacity-0 lg:hidden"}`}>
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{title}</div>
          {hasToc ? (
            <ul className="py-1">
              {toc.map((node, i) => (
                <TocNode key={node.nr ?? `${i}-${node.label}`} node={node} law={law} unitLabel={unitLabel} activeNr={activeNr} depth={0} expanded={expanded} onToggle={onToggle} />
              ))}
            </ul>
          ) : (
            <ul className="py-1 text-sm">
              {provisions.map((nr) => {
                const href = `/law/${law}/${nr}`;
                const active = pathname === href;
                return (
                  <li key={nr}>
                    <a href={href} className={`block px-4 py-1.5 transition-colors ${active ? "font-semibold" : ""}`} style={{ color: active ? "var(--active-text)" : "var(--text-secondary)", background: active ? "var(--active-bg)" : undefined }}>
                      {unitLabel} {nr}
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
