"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";

type Provider = { id: string; name: string };

const STYLES: Record<string, string> = {
  github: "bg-gray-900 text-white hover:bg-gray-800",
  google: "border border-gray-300 hover:bg-gray-50",
  apple: "bg-black text-white hover:bg-gray-900",
};

export default function LoginPage() {
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    getProviders().then((p) => {
      if (p) setProviders(Object.values(p));
    });
  }, []);

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Anmelden</h1>
        <p className="text-sm text-gray-500 mt-1">
          Für Lesezeichen, Verlauf und Feedback
        </p>
      </div>
      <div className="space-y-3">
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => signIn(p.id, { callbackUrl: "/" })}
            className={`w-full rounded-md px-4 py-2 text-sm font-medium ${STYLES[p.id] ?? "border border-gray-300 hover:bg-gray-50"}`}
          >
            Mit {p.name} anmelden
          </button>
        ))}
      </div>
    </div>
  );
}
