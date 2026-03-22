"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export function HistoryTracker({ title }: { title: string }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (!session) return;
    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, title }),
    }).catch(() => {});
  }, [session, pathname, title]);

  return null;
}
