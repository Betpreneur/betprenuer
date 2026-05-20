import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api, type RecordResponse, type Pick } from "@/lib/api";

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [
      { title: "Track record � Betpreneur" },
      { name: "description", content: "All Betpreneur picks from the last 90 days. Auto-settled. Nothing deleted." },
      { property: "og:title", content: "Betpreneur � 90-day track record" },
      { property: "og:description", content: "66.3% hit rate. +18.4% ROI. 358 picks." },
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

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    banker: "bg-brand-green text-primary-foreground",
    value_gem: "bg-teal-600 text-white",
    wild_card: "bg-purple-600 text-white",
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${colors[tier] || "bg-gray-600 text-white"}`}>
      {tier?.replace("_", " ") || ""}
    </span>
  );
}

function ResultBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    won: "text-win-green",
    loss: "text-danger-red",
    void: "text-muted-foreground",
    pending: "text-amber-500",
  };
  return (
    <span className={`text-[12px] font-medium ${styles[status] || "text-muted-foreground"}`}>
      {status?.toUpperCase() || ""}
    </span>
  );
}

function RecordPage() {
  const [data, setData] = useState<RecordResponse | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const load = () => {
    setLoading(true);
    setError(false);
    api.getRecord()
      .then((response) => {
        console.log('Record response:', response);
        setData(response);
      })
      .catch((err) => {
        console.error('Record error:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const picksArray = (data as any)?.records ?? (data as any)?.picks ?? (data as any)?.results ?? [];
  console.log('data:', data, 'picksArray:', picksArray);
  const filtered = useMemo(() => {
    if (!picksArray) return [];
    return picksArray.filter((p: Pick) => {
      if (resultFilter !== "all" && p.status !== resultFilter) return false;
      return true;
    });
  }, [data, resultFilter, picksArray]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = data?.summary;
  const hasPicks = picksArray && Array.isArray(picksArray) && picksArray.length > 0;

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-body-text">Unable to load record.</p>
        <button onClick={load} className="mt-4 px-4 py-2 bg-brand-green text-primary-foreground rounded-md">
          Tap to retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Track record</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          All picks posted before kick-off. Results auto-settled.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 bg-card border border-brand-border rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ) : !hasPicks ? (
        <div className="text-center py-12 bg-card border border-brand-border rounded-lg">
          <p className="text-muted-foreground">Record building � picks will appear here soon.</p>
          <Link to="/signup" className="mt-4 inline-block text-brand-green underline">
            Sign up to get started ?
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Hit rate" value={stats ? `${stats.hit_rate.toFixed(1)}%` : "�"} />
            <StatCard label="ROI flat" value={stats ? `${stats.roi_flat >= 0 ? "+" : ""}${stats.roi_flat.toFixed(1)}%` : "�"} />
            <StatCard label="Picks logged" value={stats ? String(stats.picks_logged) : "�"} />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "won", "loss", "void", "pending"] as const).map((r) => (
              <button
                key={r}
                onClick={() => { setResultFilter(r); setPage(1); }}
                className={`px-3 py-2 rounded-md text-[13px] border ${
                  resultFilter === r
                    ? "bg-brand-green text-primary-foreground border-brand-green"
                    : "bg-card border-brand-border text-body-text"
                }`}
              >
                {r === "all" ? "All" : r[0].toUpperCase() + r.slice(1)}
                {r !== "all" && stats && (
                  <span className="ml-1.5 opacity-70">
                    ({r === "won" ? stats.wins : r === "loss" ? stats.losses : r === "void" ? stats.voids : stats.pending})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="bg-card border border-brand-border rounded-lg overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-subtle-bg text-muted-foreground text-[11px] uppercase">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Date</th>
                  <th className="text-left px-3 py-2 font-medium">Match</th>
                  <th className="text-left px-3 py-2 font-medium">Market</th>
                  <th className="text-left px-3 py-2 font-medium">Tier</th>
                  <th className="text-right px-3 py-2 font-medium">Odds</th>
                  <th className="text-right px-3 py-2 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((pick: Pick) => (
                  <tr key={pick.id} className="border-t border-brand-border">
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {pick.match_date ? new Date(pick.match_date).toLocaleDateString() : "�"}
                    </td>
                    <td className="px-3 py-2">
                      <Link to={`/match/${pick.id}`} className="hover:text-brand-green">
                        {pick.fixture}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{pick.market}</td>
                    <td className="px-3 py-2">
                      <TierBadge tier={pick.tier} />
                    </td>
                    <td className="px-3 py-2 text-right">{pick.odds ? Number(pick.odds).toFixed(2) : "–"}</td>
                    <td className="px-3 py-2 text-right">
                      <ResultBadge status={pick.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-[13px]">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-2 rounded-md border border-brand-border bg-card disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-muted-foreground">Page {page} of {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-2 rounded-md border border-brand-border bg-card disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
