import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Search = { email?: string };

export const Route = createFileRoute("/verify-email")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify your email — Betpreneur" },
      { name: "description", content: "Confirm your email to activate your Betpreneur account." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email } = Route.useSearch();
  const router = useRouter();
  const { refresh } = useAuth();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code we sent you.");
      return;
    }
    setSubmitting(true);
    try {
      await api.verifyEmail(email ?? "", code.trim());
      await refresh();
      router.navigate({ to: "/home" });
    } catch {
      setError("That code didn't match. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setError(null);
    try {
      await api.resendVerification(email ?? "");
      setResent(true);
    } catch {
      setError("Couldn't resend the code. Try again in a moment.");
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1>Verify your email</h1>
      <p className="text-[14px] text-muted-foreground mt-1 mb-6">
        We sent a 6-digit verification code to{" "}
        <span className="text-foreground font-medium">{email ?? "your email"}</span>.
        Enter it below to activate your account.
      </p>
      <form onSubmit={onSubmit} className="space-y-4 bg-card border border-brand-border rounded-lg p-5">
        <label className="block">
          <span className="block text-[13px] font-medium text-foreground mb-1">Verification code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            className="input tracking-[0.4em] text-center text-lg"
            required
          />
          <span className="block text-[12px] text-muted-foreground mt-1">
            Demo code: <code>123456</code>
          </span>
        </label>

        {error && (
          <div className="bg-danger-bg text-danger-red text-[13px] p-3 rounded-md">{error}</div>
        )}
        {resent && !error && (
          <div className="bg-success-bg text-success-green text-[13px] p-3 rounded-md">
            New code sent. Check your inbox.
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-md disabled:opacity-60"
        >
          {submitting ? "Verifying…" : "Verify email"}
        </button>
        <div className="flex items-center justify-between text-[12px]">
          <button type="button" onClick={onResend} className="text-info-blue underline">
            Resend code
          </button>
          <Link to="/login" className="text-muted-foreground underline">
            Back to log in
          </Link>
        </div>
      </form>
      <style>{`
        .input { display:block; width:100%; padding:10px 12px; border:1px solid var(--brand-border); border-radius:6px; font-size:15px; background:var(--jet-surface-2); color:var(--pure-white); }
        .input:focus { outline:2px solid var(--primary); outline-offset:1px; }
      `}</style>
    </div>
  );
}