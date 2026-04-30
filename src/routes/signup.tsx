import { createFileRoute, Link, Navigate, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Subscribe — Terminal" },
      { name: "description", content: "Subscribe to Terminal for ₦3,000/month and get daily picks." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { isAuthed, loading, refresh } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("+234");
  const [bankroll, setBankroll] = useState("50000");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (isAuthed) return <Navigate to="/home" />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !whatsapp.trim() || !bankroll) {
      setError("Please fill in all fields.");
      return;
    }
    const bankrollN = Number(bankroll);
    if (!Number.isFinite(bankrollN) || bankrollN <= 0) {
      setError("Bankroll must be a positive number.");
      return;
    }
    setSubmitting(true);
    try {
      await api.signup({ name: name.trim(), email: email.trim(), whatsapp: whatsapp.trim(), bankroll: bankrollN });
      await refresh();
      router.navigate({ to: "/home" });
    } catch {
      setError("Could not complete signup. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1>Subscribe to Terminal</h1>
      <p className="text-[14px] text-muted-foreground mt-1 mb-6">
        ₦3,000/month. Daily picks posted by 06:30 WAT. Cancel anytime.
      </p>
      <form onSubmit={onSubmit} className="space-y-4 bg-white border border-brand-border rounded-lg p-5">
        <Field label="Full name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            autoComplete="name"
            required
          />
        </Field>
        <Field label="Email address">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="WhatsApp number">
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="input"
            required
          />
        </Field>
        <Field label="Starting bankroll (₦)" hint="The amount you're comfortable staking with overall. We use this to recommend stake sizes.">
          <input
            type="number"
            min={1000}
            step={1000}
            value={bankroll}
            onChange={(e) => setBankroll(e.target.value)}
            className="input"
            required
          />
        </Field>

        {error && (
          <div className="bg-danger-bg text-danger-red text-[13px] p-3 rounded-md">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-green text-primary-foreground font-medium py-3 rounded-md disabled:opacity-60"
        >
          {submitting ? "Processing…" : "Subscribe — ₦3,000/month"}
        </button>
        <p className="text-[12px] text-muted-foreground text-center">
          Already a subscriber?{" "}
          <Link to="/record" className="text-info-blue underline">
            View record
          </Link>
        </p>
      </form>
      <style>{`
        .input { display:block; width:100%; padding:10px 12px; border:1px solid var(--brand-border); border-radius:6px; font-size:15px; background:white; color:var(--body-text); }
        .input:focus { outline:2px solid var(--brand-green); outline-offset:1px; }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-body-text mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[12px] text-muted-foreground mt-1">{hint}</span>}
    </label>
  );
}