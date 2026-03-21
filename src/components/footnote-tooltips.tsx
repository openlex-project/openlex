"use client";

import { useEffect } from "react";

/**
 * Adds hover tooltips to footnote references.
 * Reads content from the footnotes section and shows it as a popover.
 */
export function FootnoteTooltips() {
  useEffect(() => {
    const refs = document.querySelectorAll<HTMLAnchorElement>(".fn-ref a, a.footnote-ref, a[role='doc-noteref']");
    if (!refs.length) return;

    const tooltip = document.createElement("div");
    tooltip.className = "fn-tooltip";
    document.body.appendChild(tooltip);

    let active: HTMLAnchorElement | null = null;

    const show = (ref: HTMLAnchorElement) => {
      const id = ref.getAttribute("href")?.replace("#", "");
      if (!id) return;
      const fn = document.getElementById(id);
      if (!fn) return;
      // Clone content, remove back-reference link
      const clone = fn.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("a.fn-back, a.footnote-back, a[role='doc-backlink']").forEach((a) => a.remove());
      tooltip.innerHTML = clone.innerHTML;
      tooltip.style.display = "block";

      const rect = ref.getBoundingClientRect();
      const ttWidth = Math.min(360, window.innerWidth - 32);
      tooltip.style.width = `${ttWidth}px`;

      let left = rect.left + rect.width / 2 - ttWidth / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - ttWidth - 8));
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${rect.bottom + window.scrollY + 6}px`;
      active = ref;
    };

    const hide = () => {
      tooltip.style.display = "none";
      active = null;
    };

    const onEnter = (e: Event) => show(e.currentTarget as HTMLAnchorElement);
    const onLeave = (e: Event) => {
      const related = (e as MouseEvent).relatedTarget as Node | null;
      if (tooltip.contains(related)) return;
      hide();
    };

    refs.forEach((ref) => {
      ref.addEventListener("mouseenter", onEnter);
      ref.addEventListener("mouseleave", onLeave);
    });
    tooltip.addEventListener("mouseleave", hide);

    return () => {
      refs.forEach((ref) => {
        ref.removeEventListener("mouseenter", onEnter);
        ref.removeEventListener("mouseleave", onLeave);
      });
      tooltip.remove();
    };
  }, []);

  return null;
}
