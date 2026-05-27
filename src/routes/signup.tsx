import { createFileRoute, Link, Navigate, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (isAuthed) return <Navigate to="/home" />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password || !email.trim()) {
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
        username: username.trim(),
        password,
        email: email.trim()
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
      {/* Header with visual interest */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 mb-4 shadow-[0_0_30px_rgba(232,25,44,0.3)]">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1a7 7 0 11-14 0v-1z" />
          </svg>
        </div>
        <h1 className="text-[28px] font-bold">Create your account</h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          Free while we're in beta. <span className="text-win-green">Daily picks posted by 06:30 WAT.</span>
        </p>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-5 bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-2xl p-6">
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
        <Field label="Password" hint="At least 6 characters.">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-10"
              autoComplete="new-password"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
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