"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function FootnoteTooltips() {
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => {
      const refs = document.querySelectorAll<HTMLAnchorElement>(".fn-ref a, a.footnote-ref, a[role='doc-noteref']");
      if (!refs.length) return;

      const tooltip = document.createElement("div");
      tooltip.className = "fn-tooltip";
      tooltip.setAttribute("role", "tooltip");
      tooltip.id = "fn-tooltip";
      document.body.appendChild(tooltip);

      const show = (ref: HTMLAnchorElement) => {
        const id = ref.getAttribute("href")?.replace("#", "");
        if (!id) return;
        const fn = document.getElementById(id);
        if (!fn) return;
        const clone = fn.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("a.fn-back, a.footnote-back, a[role='doc-backlink']").forEach((a) => a.remove());
        tooltip.innerHTML = clone.innerHTML;
        tooltip.style.display = "block";
        ref.setAttribute("aria-describedby", "fn-tooltip");

        const rect = ref.getBoundingClientRect();
        const ttWidth = Math.min(360, window.innerWidth - 32);
        tooltip.style.width = `${ttWidth}px`;
        let left = rect.left + rect.width / 2 - ttWidth / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - ttWidth - 8));
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${rect.bottom + window.scrollY + 6}px`;
      };

      const hide = () => {
        tooltip.style.display = "none";
        document.querySelector("[aria-describedby='fn-tooltip']")?.removeAttribute("aria-describedby");
      };

      const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") hide(); };
      document.addEventListener("keydown", onKey);

      const handlers = new Map<HTMLAnchorElement, { enter: EventListener; leave: EventListener; focus: EventListener; blur: EventListener }>();
      refs.forEach((ref) => {
        const enter = () => show(ref);
        const leave = (e: Event) => {
          if (tooltip.contains((e as MouseEvent).relatedTarget as Node)) return;
          hide();
        };
        const focus = () => show(ref);
        const blur = () => hide();
        ref.addEventListener("mouseenter", enter);
        ref.addEventListener("mouseleave", leave);
        ref.addEventListener("focus", focus);
        ref.addEventListener("blur", blur);
        handlers.set(ref, { enter, leave, focus, blur });
      });
      tooltip.addEventListener("mouseleave", hide);

      return () => {
        document.removeEventListener("keydown", onKey);
        handlers.forEach(({ enter, leave, focus, blur }, ref) => {
          ref.removeEventListener("mouseenter", enter);
          ref.removeEventListener("mouseleave", leave);
          ref.removeEventListener("focus", focus);
          ref.removeEventListener("blur", blur);
        });
        tooltip.remove();
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
