import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, type PublicSummary } from "@/lib/api";
import { TrendingUp, ShieldCheck, Zap, BarChart3, ArrowRight, Trophy, Target, Flame, Zap as Lightning } from "lucide-react";
import heroStadium from "@/assets/hero-stadium.jpg";
import heroAnalytics from "@/assets/hero-analytics.jpg";

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
  const [stats, setStats] = useState<PublicSummary | null>(null);

  useEffect(() => {
    api.getPublicSummary().then(setStats).catch(() => {});
  }, []);

  if (loading) return null;

  return (
    <div className="space-y-12 pb-8 px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 mx-auto w-full max-w-[1600px]">
      {/* Hero */}
      {/* Gaming/Sports Hero with entrance animation */}
      <section className="relative overflow-hidden rounded-2xl border border-brand-border min-h-[560px] md:min-h-[620px]">
        {/* Gaming grid background effect */}
        <div className="absolute inset-0 opacity-20" aria-hidden>
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
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
        {/* Enhanced glowing orbs - gaming feel */}
        <div
          aria-hidden
          className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/50 blur-3xl animate-pulse"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-teal-accent/30 blur-3xl animate-pulse delay-700"
        />
        {/* Additional accent for gaming feel */}
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-win-green/10 blur-3xl"
        />
        
        <div className="relative px-6 py-12 md:py-16 md:px-10">
          {/* Entrance badge with animation */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 backdrop-blur px-4 py-2 text-[12px] uppercase tracking-wider text-white/90 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-win-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-win-green"></span>
            </span>
            <span className="font-bold text-win-green">LIVE</span>
            <span className="text-white/60">·</span>
            <span className="text-white/80">Audited track record</span>
          </div>
          
          {/* Animated entrance for heading */}
          <h1 className="mt-6 text-[36px] md:text-[54px] font-extrabold leading-[1.05] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            Sharper picks.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-win-green via-teal-accent to-win-green bg-[length:200%_auto] bg-[length:200%]">
              Stronger bankers.
            </span>
            <br />
            <span className="text-primary drop-shadow-[0_2px_8px_rgba(232,25,44,0.5)]">
              Every matchday — Boom!
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] md:text-[17px] text-white/90">
            Betpreneur publishes pre-match picks before kick-off, ranked by a
            transparent confidence model. No deleted losses, no tipster theatre
            — just an audited edge you can follow. <span className="text-win-green font-semibold">Free while we're in beta.</span>
          </p>

          {/* Gaming-styled auth CTAs with hover glow */}
          <div className="mt-7 flex flex-col sm:flex-row flex-wrap gap-3">
            {isAuthed ? (
              <Link
                to="/home"
                className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-[16px] px-6 py-3.5 rounded-md hover:opacity-90 transition-all hover:shadow-[0_0_20px_rgba(232,25,44,0.4)] hover:scale-105"
              >
                <Lightning className="h-4 w-4 group-hover:animate-pulse" />
                Go to dashboard <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-[16px] px-6 py-3.5 rounded-md hover:opacity-90 transition-all hover:shadow-[0_0_20px_rgba(232,25,44,0.4)] hover:scale-105"
                >
                  <Flame className="h-4 w-4 group-hover:animate-pulse" />
                  Sign up — Boom! <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="group relative inline-flex items-center justify-center gap-2 bg-white text-primary font-bold text-[16px] px-6 py-3.5 rounded-md hover:bg-white/90 transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-105"
                >
                  Log in
                </Link>
              </>
            )}
            <Link
              to="/record"
              className="group inline-flex items-center justify-center gap-2 text-white/90 hover:text-white font-medium px-3 py-3 hover:bg-white/10 rounded-md transition-all"
            >
              <Target className="h-4 w-4" />
              Check the record <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Animated live stat strip with gaming style */}
          {/* Live stat strip */}
          <div className="mt-9 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
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

      {/* Final CTA - Dramatic gaming effect */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/20 via-card to-teal-accent/10 p-8 text-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-teal-accent/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>
        
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 mx-auto shadow-[0_0_30px_rgba(232,25,44,0.5)]">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="mt-4 text-[24px] md:text-[28px] font-bold leading-tight">
            Stop to <span className="text-primary">dey guess</span>. 
            <br />
            Start to <span className="text-win-green">dey cash out</span>.
          </h2>
          <p className="mt-3 text-[15px] text-white/80 max-w-md mx-auto">
            Join Betpreneur, follow audited edge wey serious punters dey ride. 
            <span className="text-win-green font-semibold">Boom!</span>
          </p>
          
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <Link
              to="/signup"
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold px-6 py-3.5 rounded-md hover:opacity-90 transition-all hover:shadow-[0_0_25px_rgba(232,25,44,0.5)] hover:scale-105"
            >
              <Flame className="h-5 w-5 group-hover:animate-pulse" />
              Sign up — Boom! 
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/record"
              className="group inline-flex items-center gap-2 border border-white/30 hover:border-white hover:bg-white/10 text-white font-semibold px-5 py-3.5 rounded-md transition-all"
            >
              <BarChart3 className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
              Check record
            </Link>
          </div>
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
  const glow =
    tone === "red"
      ? "hover:shadow-[0_0_20px_rgba(232,25,44,0.3)] hover:border-primary/40"
      : tone === "green"
        ? "hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:border-win-green/40"
        : "hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:border-teal-accent/40";
  return (
    <div className={`group rounded-xl border border-brand-border bg-card p-5 transition-all hover:-translate-y-1 ${glow}`}>
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${ring} transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="text-[13px] text-muted-foreground mt-1">{body}</p>
    </div>
  );
}
