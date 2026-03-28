"use client";

import { Download } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useT } from "@/lib/i18n/useT";
import { useDropdownMenu } from "./use-dropdown-menu";

type ContentType = "book" | "law" | "journal";

const scopesByType: Record<ContentType, string[]> = {
  book: ["page", "chapter"],
  law: ["page", "law"],
  journal: [],
};

export function ExportMenu({ formats, requireAuth, contentType }: { formats: string[]; requireAuth?: boolean; contentType: ContentType }) {
  const t = useT();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { open, close, triggerProps, menuProps } = useDropdownMenu();

  if (requireAuth && !session) return null;

  const scopes = scopesByType[contentType];

  const download = (format: string, scope?: string) => {
    const params = new URLSearchParams({ path: pathname, format });
    if (scope) params.set("scope", scope);
    window.open(`/api/export?${params}`, "_blank");
    close();
  };

  return (
    <div className="relative">
      <button type="button" {...triggerProps} className="inline-flex items-center text-sm transition-colors p-1" style={{ color: "var(--text-tertiary)" }} aria-label={t("export.title")}>
        <Download className="w-5 h-5" />
      </button>
      {open && (
        <div {...menuProps} className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-md border py-1 shadow-lg" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {formats.map((fmt) =>
            scopes.length ? (
              scopes.map((scope) => (
                <button type="button" key={`${fmt}-${scope}`} role="menuitem" tabIndex={-1} onClick={() => download(fmt, scope)} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  {t(`export.${fmt}`)} · {t(`export.${scope}`)}
                </button>
              ))
            ) : (
              <button type="button" key={fmt} role="menuitem" tabIndex={-1} onClick={() => download(fmt)} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                {t(`export.${fmt}`)}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
