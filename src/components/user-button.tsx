"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function UserButton() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
        Anmelden
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-600">{session.user?.name}</span>
      <button
        onClick={() => signOut()}
        className="text-gray-500 hover:text-gray-700"
      >
        Abmelden
      </button>
    </div>
  );
}
