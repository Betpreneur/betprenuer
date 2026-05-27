import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { type Pick } from "@/lib/api";
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

// Generate last 3 dates: today, yesterday, 2 days ago
function getDateOptions() {
  const dates: { value: string; label: string }[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const label = i === 0 ? "Today" : i === 1 ? "Yesterday" : `${i} days ago`;
    dates.push({ value: iso, label });
  }
  return dates;
}

function getStatusBadge(status: string) {
  const styles = {
    win: "bg-win-green/20 text-win-green border-win-green/30",
    loss: "bg-danger-red/20 text-danger-red border-danger-red/30",
    void: "bg-white/10 text-white/60 border-white/10",
    pending: "bg-amber-text/20 text-amber-text border-amber-text/30",
  };
  const labels = { win: "WIN", loss: "LOSS", void: "VOID", pending: "PENDING" };
  const colors = styles[status as keyof typeof styles] || styles.pending;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors}`}>
      {labels[status as keyof typeof labels] || "PENDING"}
    </span>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-3 text-center hover:border-brand-green/30 transition-colors">
      <div className={`text-[24px] font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
    </div>
  );
}

function PickItem({ pick, clickable = true }: { pick: Pick; clickable?: boolean }) {
  // Use pick.id for linking to match details - this is the correct match ID
  const matchId = pick.id; // Use the pick ID directly
  
  const content = (
    <div className={`group relative bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-4 hover:border-brand-green/50 transition-all hover:shadow-xl hover:shadow-brand-green/10 hover:-translate-y-1 cursor-pointer`}>
      {/* Status indicator - left side with glow */}
      <div className={`absolute left-0 top-4 w-1 h-10 rounded-r-full ${
        pick.status === "win" ? "bg-win-green shadow-[0_0_10px_rgba(34,197,94,0.5)]" :
        pick.status === "loss" ? "bg-danger-red shadow-[0_0_10px_rgba(220,38,38,0.5)]" :
        "bg-amber-text shadow-[0_0_10px_rgba(251,191,36,0.5)]"
      }`} />
      
      {/* League + Date */}
      <div className="flex items-center justify-between mb-2 pl-3">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 9l4-4m0 0l4 4m-4-4v12" />
          </svg>
          {pick.league}
          <span className="text-white/40">·</span>
          {pick.match_date}
        </span>
        {getStatusBadge(pick.status)}
      </div>
      
      {/* Match fixture */}
      <h3 className="text-[15px] font-semibold truncate pl-3 group-hover:text-win-green transition-colors">{pick.fixture}</h3>
      
      {/* Market & Odds - bottom row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30 pl-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">{pick.market}</span>
          <span className="text-border">@</span>
          <span className="text-[14px] font-bold text-win-green">{Number(pick.odds).toFixed(2)}</span>
        </div>
        {/* Confidence badge */}
        <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${
          pick.status === "win" ? "bg-win-green/10" :
          pick.status === "loss" ? "bg-danger-red/10" :
          "bg-amber-text/10"
        }`}>
          <span className={`text-[13px] font-bold ${
            pick.status === "win" ? "text-win-green" :
            pick.status === "loss" ? "text-danger-red" :
            "text-amber-text"
          }`}>
            {pick.confidence?.toFixed(0)}%
          </span>
          {/* Arrow that shows on hover */}
          <svg className="w-4 h-4 text-win-green opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      
      {/* PnL indicator for settled picks */}
      {pick.pnl !== undefined && pick.pnl !== null && (
        <div className={`absolute top-4 right-14 text-[12px] font-bold ${
          pick.pnl > 0 ? "text-win-green" : pick.pnl < 0 ? "text-danger-red" : "text-muted-foreground"
        }`}>
          {pick.pnl > 0 ? "+" : ""}{pick.pnl.toFixed(0)}
        </div>
      )}
    </div>
  );

  if (!clickable || !matchId) {
    return <div>{content}</div>;
  }

  return (
    <Link
      to="/match/$id"
      params={{ id: String(matchId) }}
      className="block"
    >
      {content}
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
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const dateOptions = getDateOptions();

  const loadPicks = (date: string) => {
    setLoading(true);
    setError(null);

    fetch(`https://backend.betpreneur.ng/api/algo/picks/backed?date=${date}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("terminal.token")}` }
    })
      .then(res => res.json())
      .then((res: any) => {
        const arr = Array.isArray(res) ? res : (res.results || res.data || res.picks || []);
        setPicks(arr);
        setStats({
          total: arr.length,
          wins: arr.filter((p: any) => p.status === "win").length,
          losses: arr.filter((p: any) => p.status === "loss").length,
          pending: arr.filter((p: any) => p.status === "pending").length,
        });
      })
      .catch((err) => {
        console.error("Failed to load picks:", err);
        setError("Could not load your picks.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && isAuthed) {
      loadPicks(selectedDate);
    }
  }, [authLoading, isAuthed, selectedDate]);

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-card border border-brand-border rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-16 bg-card border border-brand-border rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-bold">My Picks</h1>
        <p className="text-[13px] text-muted-foreground">{todayLagos()}</p>
      </header>

      {/* Date Toggles */}
      <div className="flex gap-1">
        {dateOptions.map(d => (
          <button
            key={d.value}
            onClick={() => setSelectedDate(d.value)}
            className={`flex-1 py-2 px-2 text-[12px] font-medium rounded-lg transition-colors ${
              selectedDate === d.value
                ? "bg-brand-green text-primary-foreground"
                : "bg-card border border-brand-border text-muted-foreground hover:border-brand-green/50"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Total" value={stats.total} color="text-white" />
        <StatCard label="Wins" value={stats.wins} color="text-win-green" />
        <StatCard label="Loss" value={stats.losses} color="text-danger-red" />
        <StatCard label="Pending" value={stats.pending} color="text-amber-text" />
      </div>

      {/* Picks List */}
      {error ? (
        <div className="bg-danger-red/10 border border-danger-red/30 rounded-xl p-4 text-center text-danger-red">
          {error}
        </div>
      ) : picks.length === 0 ? (
        <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">🎯</div>
          <p className="text-muted-foreground">No picks backed on this date</p>
        </div>
      ) : (
        <div className="space-y-2">
          {picks.map(pick => (<PickItem key={pick.id} pick={pick} clickable={selectedDate === dateOptions[0].value} />))}
        </div>
      )}

      <Link to="/home" className="block text-center text-info-blue text-[14px]">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
