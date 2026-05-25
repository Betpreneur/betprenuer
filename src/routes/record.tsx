// filepath: src/routes/record.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const API_BASE = "";

interface ApiPick {
  id: number;
  posted_at: string;
  match_date: string;
  fixture: string;
  home_team: string;
  away_team: string;
  league: string;
  kickoff: string;
  tier: string;
  market: string;
  pick: string;
  confidence: number;
  odds: number;
  stake: number;
  status: string;
  score: string;
  pnl: number | null;
  settled_at: string | null;
}

interface ApiSummary {
  hit_rate: number;
  roi_flat: number;
  picks_logged: number;
  wins: number;
  losses: number;
  voids: number;
  pending: number;
  window_days: number;
}

interface ApiRecord {
  summary: ApiSummary;
  records: ApiPick[];
}

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [{ title: "Track record — Betpreneur" }],
  }),
  component: RecordPage,
});

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="bg-card border border-brand-border rounded-lg p-4">
      <div className={`text-[24px] font-bold ${highlight || "text-win-green"}`}>{value}</div>
      <div className="text-[12px] text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function StatusBadge({ status, score, pnl }: { status: string; score?: string; pnl?: number | null }) {
  const colors: Record<string, string> = {
    win: "text-win-green",
    loss: "text-danger-red",
    void: "text-muted-foreground",
    pending: "text-amber-500",
  };
  if (status === "win" && pnl !== null && pnl !== undefined) {
    return (
      <span className="flex flex-col items-end">
        <span className={`text-[12px] font-medium ${colors[status]}`}>WIN</span>
        <span className="text-[11px] text-win-green">+{pnl.toFixed(0)}</span>
      </span>
    );
  }
  if (status === "loss" && pnl !== null && pnl !== undefined) {
    return (
      <span className="flex flex-col items-end">
        <span className={`text-[12px] font-medium ${colors[status]}`}>LOSS</span>
        <span className="text-[11px] text-danger-red">{pnl.toFixed(0)}</span>
      </span>
    );
  }
  if (status === "void") {
    return <span className={`text-[12px] font-medium ${colors[status]}`}>VOID</span>;
  }
  return <span className={`text-[12px] font-medium ${colors[status] || "text-muted-foreground"}`}>{status?.toUpperCase() || "PENDING"}</span>;
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    banker: "bg-brand-green text-primary-foreground",
    value_gem: "bg-teal-600 text-white",
    wild_card: "bg-purple-600 text-white",
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded ${colors[tier] || "bg-gray-600 text-white"}`}>{tier}</span>;
}

function RecordPage() {
  const [data, setData] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    // Direct call to backend to bypass Worker proxy issues
    fetch(`https://backend.betpreneur.ng/api/algo/public/record/`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const records = data?.records ?? [];
  const stats = data?.summary;

  const filtered = filter === "all" ? records : records.filter(r => r.status === filter);

  // Show message when no records yet
  if (!loading && !error && records.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1>Track record</h1>
          <p className="text-[14px] text-muted-foreground mt-1">All picks posted before kick-off. Results auto-settled.</p>
        </div>
        <div className="text-center py-16 bg-card border border-brand-border rounded-lg">
          <p className="text-muted-foreground">No picks recorded yet.</p>
          <p className="text-[14px] text-muted-foreground mt-2">Check back after the next matchday.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-20 bg-card border border-brand-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-card border border-brand-border rounded-lg">
        <p className="text-danger-red">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Track record</h1>
        <p className="text-[14px] text-muted-foreground mt-1">All picks posted before kick-off. Results auto-settled.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Hit rate" value={`${stats?.hit_rate?.toFixed(1)}%`} />
        <StatCard label="ROI (90d)" value={`+${stats?.roi_flat?.toFixed(1)}%`} highlight={stats && stats.roi_flat > 0 ? "text-win-green" : "text-danger-red"} />
        <StatCard label="Wins" value={`${stats?.wins}`} highlight="text-win-green" />
        <StatCard label="Picks" value={`${stats?.picks_logged}`} />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="bg-card border border-brand-border rounded-lg px-3 py-2">
          <span className="text-win-green font-semibold">{stats?.wins}</span>
          <span className="text-[12px] text-muted-foreground ml-1">W</span>
        </div>
        <div className="bg-card border border-brand-border rounded-lg px-3 py-2">
          <span className="text-danger-red font-semibold">{stats?.losses}</span>
          <span className="text-[12px] text-muted-foreground ml-1">L</span>
        </div>
        <div className="bg-card border border-brand-border rounded-lg px-3 py-2">
          <span className="text-muted-foreground font-semibold">{stats?.voids}</span>
          <span className="text-[12px] text-muted-foreground ml-1">V</span>
        </div>
        <div className="bg-card border border-brand-border rounded-lg px-3 py-2">
          <span className="text-amber-500 font-semibold">{stats?.pending}</span>
          <span className="text-[12px] text-muted-foreground ml-1">P</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "win", "loss", "void", "pending"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-md text-[13px] border ${
              filter === f ? "bg-brand-green text-primary-foreground border-brand-green" : "bg-card border-brand-border"
            }`}>
            {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
            {f !== "all" && <span className="ml-1.5 opacity-70">({records.filter(r => r.status === f).length})</span>}
          </button>
        ))}
      </div>

      <div className="bg-card border border-brand-border rounded-lg overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-subtle-bg text-muted-foreground text-[11px] uppercase">
            <tr>
              <th className="text-left px-3 py-2">Date</th>
              <th className="text-left px-3 py-2">Match</th>
              <th className="text-left px-3 py-2">Pick</th>
              <th className="text-left px-3 py-2">Tier</th>
              <th className="text-right px-3 py-2">Stake</th>
              <th className="text-right px-3 py-2">Odds</th>
              <th className="text-right px-3 py-2">Conf</th>
              <th className="text-right px-3 py-2">Score</th>
              <th className="text-right px-3 py-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(pick => (
              <tr key={pick.id} className="border-t border-brand-border">
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{pick.match_date}</td>
                <td className="px-3 py-2 max-w-[180px] truncate">{pick.fixture}</td>
                <td className="px-3 py-2">{pick.pick || pick.market}</td>
                <td className="px-3 py-2"><TierBadge tier={pick.tier} /></td>
                <td className="px-3 py-2 text-right">₦{pick.stake?.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{pick.odds}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{pick.confidence}%</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{pick.score || "-"}</td>
                <td className="px-3 py-2 text-right"><StatusBadge status={pick.status} score={pick.score} pnl={pick.pnl} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}