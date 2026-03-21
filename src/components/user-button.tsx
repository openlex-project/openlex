"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function UserButton() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
        style={{ color: "var(--text-secondary)" }}
      >
        Anmelden
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span style={{ color: "var(--text-secondary)" }}>{session.user?.name}</span>
      <button
        onClick={() => signOut()}
        className="text-sm transition-colors"
        style={{ color: "var(--text-tertiary)" }}
      >
        Abmelden
      </button>
    </div>
  );
}
