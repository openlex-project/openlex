"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function FootnoteTooltips() {
  const pathname = usePathname();

  useEffect(() => {
    // Small delay to ensure server-rendered HTML is in the DOM
    const timer = setTimeout(() => {
      const refs = document.querySelectorAll<HTMLAnchorElement>(".fn-ref a, a.footnote-ref, a[role='doc-noteref']");
      if (!refs.length) return;

      const tooltip = document.createElement("div");
      tooltip.className = "fn-tooltip";
      document.body.appendChild(tooltip);

      const show = (ref: HTMLAnchorElement) => {
        const id = ref.getAttribute("href")?.replace("#", "");
        if (!id) return;
        const fn = document.getElementById(id);
        if (!fn) return;
        // Get inner HTML, strip back-link
        let content = fn.innerHTML;
        content = content.replace(/<a[^>]*class="fn-back"[^>]*>.*?<\/a>/g, "");
        content = content.replace(/<a[^>]*role="doc-backlink"[^>]*>.*?<\/a>/g, "");
        if (!content.trim()) return;
        tooltip.innerHTML = content;
        tooltip.style.display = "block";

        const rect = ref.getBoundingClientRect();
        const ttWidth = Math.min(360, window.innerWidth - 32);
        tooltip.style.width = `${ttWidth}px`;
        let left = rect.left + rect.width / 2 - ttWidth / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - ttWidth - 8));
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${rect.bottom + window.scrollY + 6}px`;
      };

      const hide = () => { tooltip.style.display = "none"; };

      const handlers = new Map<HTMLAnchorElement, { enter: EventListener; leave: EventListener }>();
      refs.forEach((ref) => {
        const enter = () => show(ref);
        const leave = (e: Event) => {
          if (tooltip.contains((e as MouseEvent).relatedTarget as Node)) return;
          hide();
        };
        ref.addEventListener("mouseenter", enter);
        ref.addEventListener("mouseleave", leave);
        handlers.set(ref, { enter, leave });
      });
      tooltip.addEventListener("mouseleave", hide);

      return () => {
        handlers.forEach(({ enter, leave }, ref) => {
          ref.removeEventListener("mouseenter", enter);
          ref.removeEventListener("mouseleave", leave);
        });
        tooltip.remove();
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
