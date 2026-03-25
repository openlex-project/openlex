"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/useT";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const t = useT();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (session) fetch("/api/profile").then((r) => r.json()).then((d) => setSettings(d.settings ?? {}));
  }, [session]);

  if (status === "loading") return <div className="max-w-xl mx-auto px-4 py-8"><p style={{ color: "var(--text-tertiary)" }}>…</p></div>;
  if (!session) return <div className="max-w-xl mx-auto px-4 py-8"><p style={{ color: "var(--text-secondary)" }}>{t("profile.login")}</p></div>;

  const toggleSetting = async (key: string) => {
    const value = settings[key] === "true" ? "false" : "true";
    setSettings((s) => ({ ...s, [key]: value }));
    await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
  };

  const downloadData = async () => {
    const res = await fetch("/api/profile");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "openlex-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const deleteAccount = async () => {
    setDeleting(true);
    await fetch("/api/profile", { method: "DELETE" });
    signOut({ callbackUrl: "/" });
  };

  const confirmPhrase = t("profile.deleteConfirmPhrase");

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <h1 className="text-xl sm:text-2xl font-bold">{t("profile.title")}</h1>

      {/* User info */}
      <section className="rounded-lg border p-4 space-y-2" style={{ borderColor: "var(--border)", background: "var(--surface-secondary)" }}>
        <div className="flex items-center gap-3">
          {session.user?.image && <img src={session.user.image} alt="" className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />}
          <div>
            <div className="font-medium" style={{ color: "var(--text-primary)" }}>{session.user?.name}</div>
            <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>{session.user?.email}</div>
          </div>
        </div>
      </section>

      {/* Settings */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("profile.settings")}</h2>
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>{t("profile.historyEnabled")}</span>
          <button
            onClick={() => toggleSetting("history_enabled")}
            className="relative w-10 h-6 rounded-full transition-colors"
            style={{ background: settings.history_enabled !== "false" ? "var(--color-brand-600)" : "var(--text-tertiary)" }}
            role="switch"
            aria-checked={settings.history_enabled !== "false"}
            aria-label={t("profile.historyEnabled")}
          >
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: settings.history_enabled !== "false" ? "translateX(16px)" : "none" }} />
          </button>
        </label>
      </section>

      {/* GDPR Art. 15 — Data export */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("profile.dataExport")}</h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("profile.dataExportDesc")}</p>
        <button onClick={downloadData} className="text-sm px-4 py-2 rounded-lg border transition-colors" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
          {t("profile.downloadData")}
        </button>
      </section>

      {/* GDPR Art. 17 — Account deletion */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--color-danger, #dc2626)" }}>{t("profile.dangerZone")}</h2>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} className="text-sm px-4 py-2 rounded-lg border transition-colors" style={{ borderColor: "var(--color-danger, #dc2626)", color: "var(--color-danger, #dc2626)" }}>
            {t("profile.deleteAccount")}
          </button>
        ) : (
          <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: "var(--color-danger, #dc2626)" }}>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>{t("profile.deleteWarning")}</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {t("profile.deleteConfirm", { phrase: confirmPhrase })}
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text-primary)" }}
              placeholder={confirmPhrase}
              aria-label={t("profile.deleteConfirm", { phrase: confirmPhrase })}
            />
            <div className="flex gap-2">
              <button
                onClick={deleteAccount}
                disabled={deleteInput !== confirmPhrase || deleting}
                className="text-sm px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-40"
                style={{ background: "var(--color-danger, #dc2626)" }}
              >
                {deleting ? "…" : t("profile.deleteAccountFinal")}
              </button>
              <button onClick={() => { setShowDelete(false); setDeleteInput(""); }} className="text-sm px-4 py-2 rounded-lg border transition-colors" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                {t("profile.cancel")}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
