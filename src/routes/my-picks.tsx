import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Pick } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { todayLagos } from "@/lib/time";

export const Route = createFileRoute("/my-picks")({
  head: () => ({
    meta: [
      { title: "My Picks — Betpreneur" },
      { name: "description", content: "Your backed picks and performance tracked." },
    ],
  }),
  component: MyPicksPage,
});

function getStatusBadge(status: string) {
  switch (status) {
    case "win":
      return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-win-green/20 text-win-green">WIN</span>;
    case "loss":
      return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-danger-red/20 text-danger-red">LOSS</span>;
    case "void":
      return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-white/60">VOID</span>;
    default:
      return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-text/20 text-amber-text">PENDING</span>;
  }
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-4 text-center">
      <div className={`text-[28px] font-bold ${color}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}

function PickItem({ pick, date }: { pick: Pick; date: string }) {
  return (
    <Link
      to="/match/$id"
      params={{ id: String(pick.match_id || pick.id) }}
      className="block bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-3 hover:border-brand-green/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-muted-foreground">{date}</span>
        {getStatusBadge(pick.status)}
      </div>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-green/20 text-brand-green">
              {pick.tier?.replace("_", " ") || ""}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">{pick.league}</span>
          </div>
          <h3 className="text-[13px] font-medium truncate">{pick.fixture}</h3>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {pick.market} @ {Number(pick.odds).toFixed(2)}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-[16px] font-bold ${pick.status === "win" ? "text-win-green" : pick.status === "loss" ? "text-danger-red" : "text-amber-text"}`}>
            {pick.confidence?.toFixed(0)}%
          </div>
          {pick.result && (
            <div className="text-[10px] text-muted-foreground">{pick.result}</div>
          )}
        </div>
      </div>
    </Link>
  );
}

interface Stats {
  total: number;
  wins: number;
  losses: number;
  pending: number;
}

function MyPicksPage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, wins: 0, losses: 0, pending: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthed) {
      setLoading(false);
      return;
    }

    api.getMyPicks()
      .then((res) => {
        setPicks(res.picks || []);
        setStats(res.stats || { total: 0, wins: 0, losses: 0, pending: 0 });
      })
      .catch((err) => {
        console.error("Failed to load my picks:", err);
        setError("Could not load your picks. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [authLoading, isAuthed]);

  const grouped: { [key: string]: { pick: Pick; date: string }[] } = {};
  picks.forEach((pick) => {
    const dateStr = pick.created_at?.split("T")[0] || todayLagos();
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push({ pick, date: dateStr });
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (authLoading || loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-32 bg-card border border-brand-border rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-card border border-brand-border rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">🔐</div>
        <h2 className="text-[18px] font-bold">Sign in to track your picks</h2>
        <p className="text-[13px] text-muted-foreground mt-2 mb-4">
          Back picks on the dashboard to start tracking your performance.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center px-6 py-2 bg-brand-green text-primary-foreground font-medium rounded-lg hover:bg-brand-green/90 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-danger-red/30 rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-[18px] font-bold text-danger-red">Unable to load picks</h2>
        <p className="text-[13px] text-muted-foreground mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-bold">My Picks</h1>
        <p className="text-[13px] text-muted-foreground">{todayLagos()}</p>
      </header>

      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Total" value={stats.total} color="text-white" />
        <StatCard label="Wins" value={stats.wins} color="text-win-green" />
        <StatCard label="Loss" value={stats.losses} color="text-danger-red" />
        <StatCard label="Pending" value={stats.pending} color="text-amber-text" />
      </div>

      {sortedDates.length === 0 ? (
        <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h2 className="text-[18px] font-bold">No picks backed yet</h2>
          <p className="text-[13px] text-muted-foreground mt-2">
            Start backing picks on the dashboard to track your performance.
          </p>
          <Link
            to="/home"
            className="inline-flex items-center justify-center px-6 py-2 bg-brand-green text-primary-foreground font-medium rounded-lg hover:bg-brand-green/90 transition-colors mt-4"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <section key={date} className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-border/30">
                <h2 className="text-[13px] font-medium text-muted-foreground">
                  {new Date(date).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  {grouped[date].length} pick{grouped[date].length !== 1 ? "s" : ""}
                </span>
              </div>
              {grouped[date].map(({ pick }) => (
                <PickItem key={pick.id} pick={pick} date={date} />
              ))}
            </section>
          ))}
        </div>
      )}

      <Link to="/home" className="block text-center text-info-blue text-[14px] hover:underline">
        ← Back to Dashboard
      </Link>
    </div>
  );
}