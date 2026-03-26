import Link from "next/link";

/** Shared sidebar link with active styling. */
export function SidebarLink({ href, active, depth, children, className }: {
  href: string;
  active?: boolean;
  depth?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`block py-1.5 truncate ${active ? "font-semibold" : ""} ${className ?? ""}`}
      style={{ paddingLeft: depth != null ? `${1 + depth * 0.75}rem` : "1rem", paddingRight: "1rem", color: active ? "var(--active-text)" : "var(--text-secondary)", background: active ? "var(--active-bg)" : undefined }}>
      {children}
    </Link>
  );
}
