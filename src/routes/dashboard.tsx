import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { api, type TodayPicksResponse, type PickSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tierLabel } from "@/lib/stake";
import { formatKickoff, todayLagos } from "@/lib/time";
import { Link } from "@tanstack/react-router";
import { Trophy, ChevronRight, Activity, Target, Zap } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Betpreneur" },
      { name: "description", content: "Your daily betting dashboard with all games and confidence ratings." },
    ],
  }),
  component: DashboardPage,
});

interface GameCardProps {
  pick: PickSummary;
}

function GameCard({ pick }: GameCardProps) {
  const confidenceColor = pick.confidence >= 75 ? "text-brand-green" : pick.confidence >= 60 ? "text-amber-500" : "text-red-500";
  const confidenceBg = pick.confidence >= 75 ? "bg-brand-green-light" : pick.confidence >= 60 ? "bg-amber-bg" : "bg-red-bg";
  
  return (
    <Link
      to="/match/$id"
      params={{ id: pick.id }}
      className="block bg-card border border-brand-border rounded-lg p-4 hover:border-brand-green/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{pick.league}</div>
          <h3 className="text-[15px] font-medium leading-tight mt-0.5 truncate">{pick.match}</h3>
          <div className="text-[12px] text-muted-foreground mt-1">{formatKickoff(pick.kickoff_wat)} · {pick.market_plain}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`text-[13px] font-semibold ${confidenceColor}`}>{pick.confidence.toFixed(1)}%</div>
          <div className={`text-[10px] px-2 py-0.5 rounded ${confidenceBg} ${confidenceColor}`}>
            {tierLabel(pick.tier)}
          </div>
        </div>
      </div>
      {pick.one_line_reason && (
        <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2">{pick.one_line_reason}</p>
      )}
    </Link>
  );
}

interface MarketSectionProps {
  title: string;
  icon: React.ElementType;
  picks: PickSummary[];
}

function MarketSection({ title, icon: Icon, picks }: MarketSectionProps) {
  if (picks.length === 0) return null;
  
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-brand-green" />
        <h2 className="text-[14px] font-semibold">{title}</h2>
        <span className="text-[12px] text-muted-foreground">({picks.length})</span>
      </div>
      <div className="space-y-2">
        {picks.map((p) => (
          <GameCard key={p.id} pick={p} />
        ))}
      </div>
    </section>
  );
}

function StatsSummary({ picks }: { picks: PickSummary[] }) {
  const stats = useMemo(() => {
    const total = picks.length;
    const banker = picks.filter(p => p.tier === "banker").length;
    const gem = picks.filter(p => p.tier === "gem").length;
    const wildcard = picks.filter(p => p.tier === "wildcard").length;
    const avgConfidence = total > 0 ? picks.reduce((sum, p) => sum + p.confidence, 0) / total : 0;
    return { total, banker, gem, wildcard, avgConfidence };
  }, [picks]);

  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="bg-card border border-brand-border rounded-lg p-3 text-center">
        <div className="text-[18px] font-bold text-brand-green">{stats.total}</div>
        <div className="text-[10px] text-muted-foreground">Total</div>
      </div>
      <div className="bg-card border border-brand-border rounded-lg p-3 text-center">
        <div className="text-[18px] font-bold text-brand-green">{stats.banker}</div>
        <div className="text-[10px] text-muted-foreground">Bankers</div>
      </div>
      <div className="bg-card border border-brand-border rounded-lg p-3 text-center">
        <div className="text-[18px] font-bold text-amber-500">{stats.gem}</div>
        <div className="text-[10px] text-muted-foreground">Gems</div>
      </div>
      <div className="bg-card border border-brand-border rounded-lg p-3 text-center">
        <div className="text-[18px] font-bold text-info-blue">{stats.avgConfidence.toFixed(0)}%</div>
        <div className="text-[10px] text-muted-foreground">Avg Conf.</div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { isAuthed, loading } = useAuth();
  const [data, setData] = useState<TodayPicksResponse | null>(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    api.getTodayPicks().then(setData).catch(() => setError(true));
  };

  useEffect(() => {
    if (!isAuthed) return;
    load();
  }, [isAuthed]);

  useEffect(() => {
    if (data?.status !== "live") return;
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [data?.status]);

  if (loading) return null;
  if (!isAuthed) return <Navigate to="/record" />;

  if (error) {
    return (
      <div className="text-center py-16">
        <p>Unable to load dashboard — tap to retry.</p>
        <button onClick={load} className="mt-4 px-4 py-2 bg-brand-green text-primary-foreground rounded-md">Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-card border border-brand-border rounded-lg animate-pulse" />
        <div className="h-6 w-32 bg-card border border-brand-border rounded animate-pulse" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-card border border-brand-border rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const picks = data.picks;

  if (data.status === "pending") {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-brand-border rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-green-light flex items-center justify-center">
              <Zap className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <h1 className="text-[18px] font-semibold">Dashboard</h1>
              <p className="text-[12px] text-muted-foreground">{todayLagos()}</p>
            </div>
          </div>
        </div>
        <p className="text-[14px] text-muted-foreground text-center py-8">
          Picks arrive today at 06:30 WAT.
        </p>
        <div className="space-y-3 opacity-60">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 bg-card border border-brand-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (data.status === "no_picks" || picks.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <h2>No picks today</h2>
        <p className="text-[14px] text-muted-foreground mt-2">
          The model did not find sufficient confidence. Check back tomorrow.
        </p>
      </div>
    );
  }

  // Group picks by tier
  const bankers = picks.filter(p => p.tier === "banker");
  const gems = picks.filter(p => p.tier === "gem");
  const wildcards = picks.filter(p => p.tier === "wildcard");
  const topPick = picks.find(p => p.is_top_pick);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-brand-border rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-green-light flex items-center justify-center">
              <Activity className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <h1 className="text-[18px] font-semibold">Dashboard</h1>
              <p className="text-[12px] text-muted-foreground">{data.date}</p>
            </div>
          </div>
          {topPick && (
            <Link
              to="/match/$id"
              params={{ id: topPick.id }}
              className="flex items-center gap-1 text-[13px] text-brand-green font-medium"
            >
              <Trophy className="w-4 h-4" />
              Top Pick
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsSummary picks={picks} />

      {/* Market Sections */}
      <MarketSection title="Bankers" icon={Target} picks={bankers} />
      <MarketSection title="Value Gems" icon={Zap} picks={gems} />
      <MarketSection title="Wildcards" icon={Activity} picks={wildcards} />

      {/* View All Link */}
      <Link
        to="/home"
        className="block text-center text-[14px] text-muted-foreground py-4"
      >
        View all picks →
      </Link>
    </div>
  );
}