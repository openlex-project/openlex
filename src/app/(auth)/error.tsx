"use client";

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Login error</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>{error.message || "An unexpected error occurred."}</p>
        <button onClick={reset} className="px-4 py-2 rounded-md text-sm font-medium text-white" style={{ background: "var(--color-brand-600)" }}>
          Try again
        </button>
      </div>
    </main>
  );
}
