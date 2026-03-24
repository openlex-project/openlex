import Link from "next/link";
import { BookOpen, FileText, Scale } from "lucide-react";
import { t, defaultLocale } from "@/lib/i18n";
import type { RelatedLink } from "@/lib/registry";

const icons: Record<string, React.ReactNode> = {
  book: <BookOpen className="w-4 h-4 shrink-0" />,
  journal: <FileText className="w-4 h-4 shrink-0" />,
  law: <Scale className="w-4 h-4 shrink-0" />,
};

export function RelatedContent({ links }: { links: RelatedLink[] }) {
  if (!links.length) return null;
  return (
    <div className="mb-6 rounded-md border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
      <div className="text-xs font-medium mb-1.5" style={{ color: "var(--text-tertiary)" }}>{t(defaultLocale as "de" | "en", "commentary.title")}</div>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.path}>
            <Link href={link.path} className="inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: "var(--active-text)" }}>
              {icons[link.type] ?? icons.book}
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
