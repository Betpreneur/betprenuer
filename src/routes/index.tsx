import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, type RecordStats } from "@/lib/api";
import { TrendingUp, ShieldCheck, Zap, BarChart3, ArrowRight, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Betpreneur — Smarter football picks, every matchday" },
      {
        name: "description",
        content:
          "Pre-match picks built on a transparent, audited model. 66%+ hit rate, +18% ROI, every pick logged before kick-off.",
      },
      { property: "og:title", content: "Betpreneur — Smarter football picks" },
      {
        property: "og:description",
        content: "Audited 90-day record. Picks posted before kick-off. Nothing deleted.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { isAuthed, loading } = useAuth();
  const [stats, setStats] = useState<RecordStats | null>(null);

  useEffect(() => {
    api
      .getRecord()
      .then((r) => setStats(r.stats))
      .catch(() => {});
  }, []);

  if (loading) return null;
  if (isAuthed) return <Navigate to="/home" />;

  return (
    <div className="space-y-12 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-brand-border bg-gradient-to-br from-primary/30 via-card to-background px-6 py-12 md:py-16 md:px-10">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/40 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-teal-accent/20 blur-3xl"
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wider text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-win-green animate-pulse" />
            Live · audited track record
          </div>
          <h1 className="mt-5 text-[34px] md:text-[46px] font-extrabold leading-[1.05] tracking-tight">
            Smarter football picks,
            <br />
            <span className="text-primary">every matchday.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] md:text-[17px] text-white/80">
            Betpreneur publishes pre-match picks before kick-off, ranked by a
            transparent confidence model. No deleted losses. No tipster theatre.
            Just an audited edge you can follow.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-md hover:opacity-90 transition-opacity"
            >
              Sign up <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 border border-white/30 hover:border-white text-white font-semibold px-5 py-3 rounded-md transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/record"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium px-2 py-3"
            >
              See the record <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Live stat strip */}
          <div className="mt-9 grid grid-cols-3 gap-3 max-w-xl">
            <StatChip
              label="Hit rate"
              value={stats ? `${stats.hit_rate.toFixed(1)}%` : "—"}
              tone="green"
            />
            <StatChip
              label="ROI flat"
              value={stats ? `+${stats.roi.toFixed(1)}%` : "—"}
              tone="teal"
            />
            <StatChip
              label="Picks logged"
              value={stats ? String(stats.total_picks) : "—"}
              tone="white"
            />
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="space-y-5">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-[22px] md:text-[26px] font-bold">
            What you get with Betpreneur
          </h2>
          <p className="text-[14px] text-muted-foreground mt-2">
            Built for bettors who care about edge, not noise.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={<TrendingUp className="h-5 w-5" />}
            title="Daily edge picks"
            body="Bankers, Value Gems, and Wildcards posted every morning, ranked by model confidence."
            tone="red"
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Fully audited"
            body="Every pick is timestamped before kick-off and auto-settled. Nothing is ever deleted."
            tone="green"
          />
          <Feature
            icon={<Zap className="h-5 w-5" />}
            title="Top Pick of the day"
            body="The single highest-confidence call, with reasoning, form, and risk flags broken down."
            tone="teal"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-2xl border border-brand-border bg-card p-6 md:p-8">
        <h2 className="text-[20px] md:text-[24px] font-bold mb-5">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            { n: 1, t: "Sign up", b: "Create an account in under a minute." },
            { n: 2, t: "Get the picks", b: "Open the app each matchday for fresh, ranked picks." },
            { n: 3, t: "Track results", b: "Every result auto-settled and added to the public record." },
          ].map((s) => (
            <li key={s.n} className="rounded-xl border border-brand-border bg-background/40 p-4">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                {s.n}
              </div>
              <h3 className="mt-3">{s.t}</h3>
              <p className="text-[13px] text-muted-foreground mt-1">{s.b}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/20 to-card p-8 text-center">
        <Trophy className="h-8 w-8 text-primary mx-auto" />
        <h2 className="mt-3 text-[22px] md:text-[26px] font-bold">
          Stop guessing. Start tracking.
        </h2>
        <p className="mt-2 text-[14px] text-white/80 max-w-md mx-auto">
          Join Betpreneur and follow an audited edge built for serious bettors.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-md hover:opacity-90"
          >
            Sign up <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/record"
            className="inline-flex items-center gap-2 border border-white/30 hover:border-white text-white font-semibold px-5 py-3 rounded-md"
          >
            <BarChart3 className="h-4 w-4" /> View record
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "teal" | "white";
}) {
  const toneClass =
    tone === "green"
      ? "text-win-green"
      : tone === "teal"
        ? "text-teal-accent"
        : "text-white";
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 backdrop-blur px-3 py-3">
      <div className={`text-[20px] md:text-[22px] font-extrabold ${toneClass}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-white/60 mt-0.5">
        {label}
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "red" | "green" | "teal";
}) {
  const ring =
    tone === "red"
      ? "bg-primary/15 text-primary"
      : tone === "green"
        ? "bg-win-green-bg/40 text-win-green"
        : "bg-teal-bg/40 text-teal-accent";
  return (
    <div className="group rounded-xl border border-brand-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${ring}`}>
        {icon}
      </div>
      <h3 className="mt-3">{title}</h3>
      <p className="text-[13px] text-muted-foreground mt-1">{body}</p>
    </div>
  );
}
