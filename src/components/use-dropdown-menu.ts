"use client";

import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react";

/** Accessible dropdown menu hook — handles ARIA, Escape, arrow keys, focus management. */
export function useDropdownMenu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => { setOpen(false); triggerRef.current?.focus(); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) close(); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const items = menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]");
    items?.[0]?.focus();
  }, [open]);

  const onTriggerKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); }
  };

  const onMenuKeyDown = (e: KeyboardEvent) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []);
    const idx = items.indexOf(e.target as HTMLElement);
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); }
  };

  const triggerProps = {
    ref: triggerRef,
    onClick: () => setOpen(!open),
    onKeyDown: onTriggerKeyDown,
    "aria-expanded": open,
    "aria-haspopup": "menu" as const,
  };

  const menuProps = {
    ref: menuRef,
    role: "menu" as const,
    onKeyDown: onMenuKeyDown,
  };

  return { open, close, triggerProps, menuProps };
}
