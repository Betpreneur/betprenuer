// filepath: src/routes/record.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// Use proxy path via Cloudflare
const API_BASE = "";

interface ApiPick {
  id: number;
  match_date: string | null;
  fixture: string;
  league: string;
  kickoff: string;
  tier: string;
  market: string;
  confidence: number;
  odds: number;
  status: string;
}

interface ApiRecord {
  summary: {
    hit_rate: number;
    roi_flat: number;
    picks_logged: number;
    wins: number;
    losses: number;
    voids: number;
    pending: number;
  };
  records: ApiPick[];
}

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [
      { title: "Track record — Betpreneur" },
      { name: "description", content: "All Betpreneur picks from the last 90 days" },
    ],
  }),
  component: RecordPage,
});

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-brand-border rounded-lg p-4">
      <div className="text-[24px] font-bold text-win-green">{value}</div>
      <div className="text-[12px] text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function RecordPage() {
  const [data, setData] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Direct fetch - no api.ts wrapper at all
    fetch(`${API_BASE}/algo/public/record/`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log("[RECORD] SUCCESS:", data);
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("[RECORD] FAIL:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const records = data?.records ?? [];
  const stats = data?.summary;
  const hasPicks = records.length > 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[0,1,2].map(i => (
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
        <p className="text-[14px] text-muted-foreground mt-2">
          Couldn't load record. Try refreshing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Track record</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          All picks posted before kick-off.
        </p>
      </div>

      {!hasPicks ? (
        <div className="text-center py-12 bg-card border border-brand-border rounded-lg">
          <p className="text-muted-foreground">No picks yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Hit rate" value={`${stats?.hit_rate?.toFixed(1)}%`} />
            <StatCard label="ROI" value={`+${stats?.roi_flat?.toFixed(1)}%`} />
            <StatCard label="Picks" value={`${stats?.picks_logged}`} />
          </div>

          <div className="bg-card border border-brand-border rounded-lg overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-subtle-bg text-muted-foreground text-[11px] uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-left px-3 py-2">Match</th>
                  <th className="text-left px-3 py-2">Market</th>
                  <th className="text-right px-3 py-2">Odds</th>
                  <th className="text-right px-3 py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 20).map((pick) => (
                  <tr key={pick.id} className="border-t border-brand-border">
                    <td className="px-3 py-2 text-muted-foreground">
                      {pick.match_date}
                    </td>
                    <td className="px-3 py-2">{pick.fixture}</td>
                    <td className="px-3 py-2">{pick.market}</td>
                    <td className="px-3 py-2 text-right">{pick.odds}</td>
                    <td className="px-3 py-2 text-right uppercase text-[12px]">{pick.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}