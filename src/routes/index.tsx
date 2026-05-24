import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, type PublicSummary } from "@/lib/api";
import { TrendingUp, ShieldCheck, Zap, BarChart3, ArrowRight, Trophy } from "lucide-react";
import heroStadium from "@/assets/hero-stadium.jpg";
import heroAnalytics from "@/assets/hero-analytics.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Betpreneur — Daily football picks we dey share" },
      {
        name: "description",
        content:
          "Football picks wey our algorithm vet. Posted before 06:30 WAT daily. Bankers 80%+, Gems 70-79%, Wildcards 60-69%. 90-day record wey no go lie.",
      },
      { property: "og:title", content: "Betpreneur — Football picks we get confidence" },
      {
        property: "og:description",
        content: "90 days record wey no go lie una. Every pick don publish before match start.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { isAuthed, loading } = useAuth();
  const [stats, setStats] = useState<PublicSummary | null>(null);

  useEffect(() => {
    api.getPublicSummary().then(setStats).catch(() => {});
  }, []);

  if (loading) return null;

  return (
    <div className="space-y-12 pb-8 px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 mx-auto w-full max-w-[1600px]">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-brand-border min-h-[560px] md:min-h-[620px]">
        {/* Background image */}
        <img
          src={heroStadium}
          alt=""
          aria-hidden
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Overlays */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/75 to-primary/40"
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/40 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-teal-accent/20 blur-3xl"
        />
        <div className="relative px-6 py-12 md:py-16 md:px-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-wider text-white/90">
            <span className="h-1.5 w-1.5 rounded-full bg-win-green animate-pulse" />
            Boom · audited track record
          </div>
          <h1 className="mt-5 text-[34px] md:text-[52px] font-extrabold leading-[1.05] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            Sharper picks. Stronger bankers.
            <br />
            <span className="text-primary">Every matchday — Boom!</span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] md:text-[17px] text-white/90">
            Betpreneur publishes pre-match picks before kick-off, ranked by a
            transparent confidence model. Bankers, Gems and Wildcards every matchday. Records go update by 06:30 WAT wen matches don finish.
            — just an audited edge you can follow. Free while we're in beta.
          </p>

          {/* Primary auth CTAs — always visible */}
          <div className="mt-7 flex flex-col sm:flex-row flex-wrap gap-3">
            {isAuthed ? (
              <Link
                to="/home"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-[16px] px-6 py-3.5 rounded-md hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
              >
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-[16px] px-6 py-3.5 rounded-md hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
                >
                  Sign up — Boom! <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold text-[16px] px-6 py-3.5 rounded-md hover:bg-white/90 transition-colors shadow-lg"
                >
                  Log in
                </Link>
              </>
            )}
            <Link
              to="/record"
              className="inline-flex items-center justify-center gap-2 text-white/90 hover:text-white font-medium px-2 py-3"
            >
              Check the record <ArrowRight className="h-4 w-4" />
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
              value={stats ? `+${stats.roi_flat.toFixed(1)}%` : "—"}
              tone="teal"
            />
            <StatChip
              label="Picks logged"
              value={stats ? String(stats.picks_logged) : "—"}
              tone="white"
            />
          </div>
        </div>
      </section>

      {/* Visual band */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-brand-border min-h-[200px] md:min-h-[260px]">
          <img
            src={heroAnalytics}
            alt="Audited performance trending upward"
            loading="lazy"
            width={1024}
            height={1024}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-5">
            <div className="text-[11px] uppercase tracking-wider text-teal-accent font-semibold">Proof, not promises</div>
            <h3 className="text-[20px] font-bold mt-1">90 days of audited results</h3>
            <p className="text-[13px] text-white/80 mt-1">Wins, losses, voids — all logged, all visible.</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-brand-border min-h-[200px] md:min-h-[260px]">
          <img
            src={heroStadium}
            alt="Football match under stadium lights"
            loading="lazy"
            width={1920}
            height={1080}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-5">
            <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">Pre-match · before kick-off</div>
            <h3 className="text-[20px] font-bold mt-1">Picks posted by 06:30 WAT</h3>
            <p className="text-[13px] text-white/80 mt-1">Bankers, Value Gems and Wildcards — every matchday.</p>
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
            Built for bettors who want a real edge, not noise.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={<TrendingUp className="h-5 w-5" />}
            title="Daily edge picks"
            body="Bankers, Value Gems and Wildcards posted every morning, ranked by model confidence."
            tone="red"
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Fully audited"
            body="Every pick is timestamped before kick-off and auto-settled. Losses are never deleted."
            tone="green"
          />
          <Feature
            icon={<Zap className="h-5 w-5" />}
            title="Top Pick of the day"
            body="The single highest-confidence call, with reasoning, form and risk flags broken down."
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
            { n: 3, t: "Track results", b: "Every result is auto-settled and added to the public record." },
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
          Stop to dey guess. Start to dey cash out.
        </h2>
        <p className="mt-2 text-[14px] text-white/80 max-w-md mx-auto">
          Join Betpreneur, follow audited edge wey serious punters dey ride. Boom!
        </p>
        <div className="mt-5 flex flex-wrap gap-3 justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-md hover:opacity-90"
          >
            Sign up — Boom! <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/record"
            className="inline-flex items-center gap-2 border border-white/30 hover:border-white text-white font-semibold px-5 py-3 rounded-md"
          >
            <BarChart3 className="h-4 w-4" /> Check record
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
