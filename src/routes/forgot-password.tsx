import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Betpreneur" },
      { name: "description", content: "Request a password reset link for your Betpreneur account." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Enter the email tied to your account.");
      return;
    }
    setSubmitting(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch {
      setError("Couldn't send a reset link. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1>Reset your password</h1>
      <p className="text-[14px] text-muted-foreground mt-1 mb-6">
        Enter your email and we'll send you a link to set a new password.
      </p>
      {sent ? (
        <div className="bg-card border border-brand-border rounded-lg p-5 space-y-4">
          <p className="text-[14px]">
            If an account exists for <span className="font-medium">{email}</span>, a reset
            link is on its way. Check your inbox (and spam folder).
          </p>
          <Link
            to="/reset-password"
            search={{ token: "demo-token" }}
            className="block text-center w-full bg-primary text-primary-foreground font-semibold py-3 rounded-md"
          >
            Continue to reset (demo)
          </Link>
          <Link to="/login" className="block text-center text-info-blue underline text-[13px]">
            Back to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 bg-card border border-brand-border rounded-lg p-5">
          <label className="block">
            <span className="block text-[13px] font-medium text-foreground mb-1">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              autoComplete="email"
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
            {submitting ? "Sending…" : "Send reset link"}
          </button>
          <p className="text-[12px] text-muted-foreground text-center">
            Remembered it?{" "}
            <Link to="/login" className="text-info-blue underline">
              Back to log in
            </Link>
          </p>
        </form>
      )}
      <style>{`
        .input { display:block; width:100%; padding:10px 12px; border:1px solid var(--brand-border); border-radius:6px; font-size:15px; background:var(--jet-surface-2); color:var(--pure-white); }
        .input:focus { outline:2px solid var(--primary); outline-offset:1px; }
      `}</style>
    </div>
  );
}