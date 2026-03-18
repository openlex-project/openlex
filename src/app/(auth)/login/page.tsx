"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Anmelden</h1>
        <p className="text-sm text-gray-500 mt-1">
          Für Lesezeichen, Verlauf und Feedback
        </p>
      </div>
      <div className="space-y-3">
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Mit GitHub anmelden
        </button>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Mit Google anmelden
        </button>
      </div>
    </div>
  );
}
