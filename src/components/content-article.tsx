import type { ReactNode } from "react";

/** Shared layout for all content pages: sidebar + article in a flex row. */
export function ContentArticle({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="flex">
      {sidebar}
      <article className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        {children}
      </article>
    </div>
  );
}
