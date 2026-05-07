import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";

type Search = { token?: string; user_id?: string };

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    token: typeof s.token === "string" ? s.token : undefined,
    user_id: typeof s.user_id === "string" ? s.user_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Set a new password — Betpreneur" },
      { name: "description", content: "Choose a new password for your Betpreneur account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token, user_id } = Route.useSearch();
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState(token ?? "");
  const [userIdInput, setUserIdInput] = useState(user_id ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await api.resetPassword(tokenInput.trim(), password, userIdInput.trim());
      setDone(true);
      setTimeout(() => router.navigate({ to: "/login" }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password. The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1>Set a new password</h1>
      <p className="text-[14px] text-muted-foreground mt-1 mb-6">
        Choose a strong password you haven't used before.
      </p>
      <form onSubmit={onSubmit} className="space-y-4 bg-card border border-brand-border rounded-lg p-5">
        {!token && (
          <label className="block">
            <span className="block text-[13px] font-medium text-foreground mb-1">Reset code</span>
            <input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="input"
              maxLength={6}
              required
            />
          </label>
        )}
        {!user_id && (
          <label className="block">
            <span className="block text-[13px] font-medium text-foreground mb-1">User ID (from email)</span>
            <input
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="input"
              required
            />
          </label>
        )}
        <label className="block">
          <span className="block text-[13px] font-medium text-foreground mb-1">New password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>
        <label className="block">
          <span className="block text-[13px] font-medium text-foreground mb-1">Confirm password</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>

        {error && (
          <div className="bg-danger-bg text-danger-red text-[13px] p-3 rounded-md">{error}</div>
        )}
        {done && (
          <div className="bg-jet-surface-2 text-info-blue text-[13px] p-3 rounded-md border border-brand-border">
            Password updated. Redirecting to log in…
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || done}
          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-md disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Update password"}
        </button>
        <p className="text-[12px] text-muted-foreground text-center">
          <Link to="/login" className="text-info-blue underline">Back to log in</Link>
        </p>
      </form>
      <style>{`
        .input { display:block; width:100%; padding:10px 12px; border:1px solid var(--brand-border); border-radius:6px; font-size:15px; background:var(--jet-surface-2); color:var(--pure-white); }
        .input:focus { outline:2px solid var(--primary); outline-offset:1px; }
      `}</style>
    </div>
  );
}