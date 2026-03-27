"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { SidebarShell } from "./sidebar-shell";
import { useExpandable } from "./use-expandable";
import type { LawTocNode } from "@/lib/registry";

interface Props {
  law: string;
  title: string;
  unitLabel: string;
  toc: LawTocNode[];
  provisions: number[];
  activeNr?: string;
}

function findExpandedKeys(toc: LawTocNode[], nr: string, path: string[] = []): string[] {
  for (const node of toc) {
    if (node.nr === nr) return path;
    if (node.children) {
      const key = path.length + "-" + (node.label ?? (node.title as string));
      const found = findExpandedKeys(node.children, nr, [...path, key]);
      if (found.length) return found;
    }
  }
  return [];
}

function TocNode({ node, law, unitLabel, depth, expanded, onToggle }: {
  node: LawTocNode; law: string; unitLabel: string;
  depth: number; expanded: Set<string>; onToggle: (key: string) => void;
}) {
  const pathname = usePathname();

  if (node.nr) {
    const href = `/${law}/${node.nr}`;
    const active = pathname === href;
    return (
      <li>
        <Link href={href} className={`block px-4 py-1 text-sm truncate ${active ? "font-semibold" : ""}`}
          style={{ paddingLeft: `${depth * 0.75 + 1}rem`, color: active ? "var(--active-text)" : "var(--text-secondary)", background: active ? "var(--active-bg)" : undefined }}>
          {unitLabel} {node.nr}{node.title ? ` ${node.title as string}` : ""}
        </Link>
      </li>
    );
  }

  const key = depth + "-" + (node.label ?? (node.title as string));
  const isExpanded = expanded.has(key);

  return (
    <li>
      <button onClick={() => onToggle(key)} aria-expanded={isExpanded}
        className="w-full flex items-center gap-1 px-4 py-1 text-sm text-left"
        style={{ paddingLeft: `${depth * 0.75 + 1}rem`, color: "var(--text-primary)" }}>
        <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
        <span className="font-medium">{node.label}</span>
        {node.title && <span className="truncate" style={{ color: "var(--text-tertiary)" }}>{node.title as string}</span>}
      </button>
      {isExpanded && node.children && (
        <ul>{node.children.map((child, i) => (
          <TocNode key={child.nr ?? `${i}-${child.label}`} node={child} law={law} unitLabel={unitLabel} depth={depth + 1} expanded={expanded} onToggle={onToggle} />
        ))}</ul>
      )}
    </li>
  );
}

export function SidebarLaw({ law, title, unitLabel, toc, provisions, activeNr }: Props) {
  const pathname = usePathname();
  const activeKeys = useMemo(() => activeNr ? findExpandedKeys(toc, activeNr) : [], [toc, activeNr]);
  const { expanded, toggle: onToggle } = useExpandable(activeKeys);

  return (
    <SidebarShell>
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{title}</div>
      {toc.length > 0 ? (
        <ul className="py-1">{toc.map((node, i) => (
          <TocNode key={node.nr ?? `${i}-${node.label}`} node={node} law={law} unitLabel={unitLabel} depth={0} expanded={expanded} onToggle={onToggle} />
        ))}</ul>
      ) : (
        <ul className="py-1 text-sm">{provisions.map((nr) => {
          const href = `/${law}/${nr}`;
          const active = pathname === href;
          return (
            <li key={nr}><Link href={href} className={`block px-4 py-1.5 ${active ? "font-semibold" : ""}`} style={{ color: active ? "var(--active-text)" : "var(--text-secondary)", background: active ? "var(--active-bg)" : undefined }}>{unitLabel} {nr}</Link></li>
          );
        })}</ul>
      )}
    </SidebarShell>
  );
}
