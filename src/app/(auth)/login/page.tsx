"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";

type Provider = { id: string; name: string };

export default function LoginPage() {
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    getProviders().then((p) => { if (p) setProviders(Object.values(p)); });
  }, []);

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <Logo size={40} className="mx-auto mb-3 text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]" />
        <h1 className="text-2xl font-bold">Anmelden</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Für Lesezeichen, Verlauf und Feedback
        </p>
      </div>
      <div className="space-y-3">
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => signIn(p.id, { callbackUrl: "/" })}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            style={{ background: "var(--surface-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          >
            Mit {p.name} anmelden
          </button>
        ))}
      </div>
    </div>
  );
}
