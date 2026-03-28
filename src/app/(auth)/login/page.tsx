"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ProviderIcon } from "@/components/provider-icon";
import { useT } from "@/lib/i18n/useT";

type Provider = { id: string; name: string };

export default function LoginPage() {
  const t = useT();
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    getProviders().then((p) => { if (p) setProviders(Object.values(p)); });
  }, []);

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <Logo size={40} className="mx-auto mb-3 text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]" />
        <h1 className="text-2xl font-bold">{t("login.title")}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{t("login.subtitle")}</p>
      </div>
      {providers.length === 0 ? (
        <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>{t("login.none")}</p>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => (
            <button type="button"
              key={p.id}
              onClick={() => signIn(p.id, { callbackUrl: "/" })}
              className="w-full flex items-center justify-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ background: "var(--surface-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              <ProviderIcon id={p.id} size="w-5 h-5" />
              {t("login.with", { name: p.name })}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
