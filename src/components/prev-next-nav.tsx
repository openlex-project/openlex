import Link from "next/link";

interface NavItem { href: string; label: string }

export function PrevNextNav({ prev, next, position, center, ariaLabel }: {
  prev?: NavItem | null;
  next?: NavItem | null;
  position: "top" | "bottom";
  center?: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <nav aria-label={ariaLabel ?? (position === "top" ? "Navigation" : "Navigation")} className={`flex flex-wrap items-center justify-between gap-2 text-sm ${position === "top" ? "mb-6 pb-3 border-b" : "mt-12 pt-6 border-t"}`} style={{ borderColor: "var(--border)" }}>
      {prev ? <Link href={prev.href} className="hover:underline shrink-0 max-w-[45%] truncate" style={{ color: "var(--active-text)" }}>← {prev.label}</Link> : <span />}
      {center && <span className="hidden sm:block mx-4 truncate" style={{ color: "var(--text-secondary)" }}>{center}</span>}
      {next ? <Link href={next.href} className="hover:underline text-right shrink-0 max-w-[45%] truncate" style={{ color: "var(--active-text)" }}>{next.label} →</Link> : <span />}
    </nav>
  );
}
