"use client";

import { usePathname } from "next/navigation";
import type { TocEntry } from "@/lib/registry";

export function BookSidebar({ werk, toc, edition }: { werk: string; toc: TocEntry[]; edition: string }) {
  const pathname = usePathname();
  const prefix = edition === "main" ? `/book/${werk}` : `/book/${werk}/${edition}`;

  return (
    <nav className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto h-[calc(100vh-57px)] sticky top-[57px] hidden lg:block">
      <ul className="py-4 text-sm">
        {toc.map((entry) => {
          const slug = entry.file.replace(/\.md$/, "");
          const href = `${prefix}/${slug}`;
          const active = pathname === href;
          return (
            <li key={slug}>
              <a
                href={href}
                className={`block px-4 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  active
                    ? "font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {entry.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
