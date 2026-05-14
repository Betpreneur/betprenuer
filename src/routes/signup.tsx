import { createFileRoute, Link, Navigate, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Betpreneur" },
      { name: "description", content: "Create your free Betpreneur account and get daily audited football picks." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { isAuthed, loading, refresh } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("+234");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (isAuthed) return <Navigate to="/dashboard" />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !username.trim() || !password || !email.trim() || !whatsapp.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await api.signup({
        name: name.trim(),
        username: username.trim(),
        password,
        email: email.trim(),
        whatsapp: whatsapp.trim(),
      });
      router.navigate({ to: "/verify-email", search: { email: email.trim() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete signup. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1>Create your account</h1>
      <p className="text-[14px] text-muted-foreground mt-1 mb-6">
        Free while we're in beta. Daily picks posted by 06:30 WAT.
      </p>
      <form onSubmit={onSubmit} className="space-y-4 bg-card border border-brand-border rounded-lg p-5">
        <Field label="Full name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            autoComplete="name"
            required
          />
        </Field>
        <Field label="Username" hint="You'll use this to log in. Letters, numbers, and underscores.">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            autoComplete="username"
            minLength={3}
            maxLength={30}
            required
          />
        </Field>
        <Field label="Password" hint="At least 6 characters.">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="new-password"
            minLength={6}
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

        {error && (
          <div className="bg-danger-bg text-danger-red text-[13px] p-3 rounded-md">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-md disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Sign up — free"}
        </button>
        <p className="text-[12px] text-muted-foreground text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-info-blue underline">
            Log in
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-foreground mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[12px] text-muted-foreground mt-1">{hint}</span>}
    </label>
  );
}