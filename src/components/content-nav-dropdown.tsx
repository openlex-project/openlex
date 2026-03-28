"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useDropdownMenu } from "./use-dropdown-menu";

interface NavItem { href: string; label: string }
interface NavGroup { label: string; items: NavItem[] }

export function ContentNavDropdown({ groups, label }: { groups: NavGroup[]; label: string }) {
  const { open, close, triggerProps, menuProps } = useDropdownMenu();

  return (
    <div className="relative hidden lg:block">
      <button type="button" {...triggerProps} className="flex items-center gap-1.5 px-2 py-1 text-sm rounded-md hover:bg-[var(--surface-secondary)] transition-colors" style={{ color: "var(--text-secondary)" }}>
        <BookOpen className="w-4 h-4" />
        {label}
      </button>
      {open && (
        <div {...menuProps} className="absolute left-0 top-full mt-1 z-50 min-w-[220px] rounded-md border py-2 shadow-lg" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {groups.map((group) => (
            <div key={group.label} className="px-3 py-1">
              <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>{group.label}</div>
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} role="menuitem" tabIndex={-1} onClick={close} className="block px-2 py-1 text-sm rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: "var(--text-primary)" }}>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
