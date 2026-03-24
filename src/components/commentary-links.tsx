import Link from "next/link";
import { BookOpen } from "lucide-react";
import { t, defaultLocale } from "@/lib/i18n";

export function CommentaryLinks({ links }: { links: { slug: string; name: string; fileSlug: string }[] }) {
  if (!links.length) return null;
  return (
    <div className="mb-6 rounded-md border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
      <div className="text-xs font-medium mb-1.5" style={{ color: "var(--text-tertiary)" }}>{t(defaultLocale as "de" | "en", "commentary.title")}</div>
      <ul className="space-y-1">
        {links.map((c) => (
          <li key={`${c.slug}-${c.fileSlug}`}>
            <Link href={`/${c.slug}/${c.fileSlug}`} className="inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: "var(--active-text)" }}>
              <BookOpen className="w-4 h-4 shrink-0" />
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
