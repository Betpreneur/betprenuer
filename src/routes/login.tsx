import { createFileRoute, Link, Navigate, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Betpreneur" },
      { name: "description", content: "Log in to your Betpreneur account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { isAuthed, loading, refresh } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (isAuthed) return <Navigate to="/home" />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError("Enter your username/email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await api.login(identifier.trim(), password);
      await refresh();
      router.navigate({ to: "/home" });
    } catch {
      setError("Could not log you in. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1>Welcome back</h1>
      <p className="text-[14px] text-muted-foreground mt-1 mb-6">
        Log in to see today's picks.
      </p>
      <form onSubmit={onSubmit} className="space-y-4 bg-card border border-brand-border rounded-lg p-5">
        <label className="block">
          <span className="block text-[13px] font-medium text-foreground mb-1">Username or email</span>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="input"
            autoComplete="username"
            required
          />
        </label>
        <label className="block">
          <span className="block text-[13px] font-medium text-foreground mb-1">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <div className="bg-danger-bg text-danger-red text-[13px] p-3 rounded-md">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-md disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
        <p className="text-[12px] text-muted-foreground text-center">
          Not subscribed yet?{" "}
          <Link to="/signup" className="text-info-blue underline">
            Create an account
          </Link>
        </p>
      </form>
      <style>{`
        .input { display:block; width:100%; padding:10px 12px; border:1px solid var(--brand-border); border-radius:6px; font-size:15px; background:var(--jet-surface-2); color:var(--pure-white); }
        .input:focus { outline:2px solid var(--primary); outline-offset:1px; }
      `}</style>
    </div>
  );
}