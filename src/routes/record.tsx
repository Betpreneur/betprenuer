import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api, type RecordResponse } from "@/lib/api";
import { shortDate } from "@/lib/time";
import { tierLabel } from "@/lib/stake";

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [
      { title: "Track record — Betpreneur" },
      { name: "description", content: "All Betpreneur picks from the last 90 days. Auto-settled. Nothing deleted." },
      { property: "og:title", content: "Betpreneur — 90-day track record" },
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

function RecordPage() {
  const [data, setData] = useState<RecordResponse | null>(null);
  const [error, setError] = useState(false);
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const load = () => {
    setError(false);
    api
      .getRecord()
      .then(setData)
      .catch(() => setError(true));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.history.filter((h) => {
      if (marketFilter !== "all" && h.market !== marketFilter) return false;
      if (resultFilter !== "all" && h.result !== resultFilter) return false;
      return true;
    });
  }, [data, marketFilter, resultFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-body-text">Unable to load record — tap to retry.</p>
        <button onClick={load} className="mt-4 px-4 py-2 bg-brand-green text-primary-foreground rounded-md">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Track record — last 90 days.</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          All picks posted before kick-off. Results auto-settled. Nothing deleted.
        </p>
      </div>

      {!data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 bg-card border border-brand-border rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="h-40 bg-card border border-brand-border rounded-lg animate-pulse" />
        </div>
      ) : data.history.length === 0 ? (
        <p className="text-body-text">Record building — first picks posted soon.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Hit rate" value={`${data.stats.hit_rate.toFixed(1)}%`} />
            <StatCard label="ROI flat" value={`+${data.stats.roi.toFixed(1)}%`} />
            <StatCard label="Total picks" value={String(data.stats.total_picks)} />
          </div>

          <section>
            <h2 className="mb-2">By market</h2>
            <div className="bg-card border border-brand-border rounded-lg overflow-hidden">
              <table className="w-full text-[14px]">
                <thead className="bg-subtle-bg text-muted-foreground text-[12px] uppercase">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Market</th>
                    <th className="text-right px-4 py-2 font-medium">Picks</th>
                    <th className="text-right px-4 py-2 font-medium">Hit rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_market.map((m) => (
                    <tr key={m.market} className="border-t border-brand-border align-top">
                      <td className="px-4 py-3">
                        <div className="font-medium text-body-text">{m.market}</div>
                        {m.status === "paused" && m.note && (
                          <div className="mt-1 text-[12px] text-amber-text bg-amber-bg inline-block px-2 py-0.5 rounded">
                            {m.note}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-body-text">{m.picks}</td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        m.hit_rate >= 65 ? "text-win-green" : "text-danger-red"
                      }`}>
                        {m.hit_rate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-2">Pick history</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              <select
                value={marketFilter}
                onChange={(e) => { setMarketFilter(e.target.value); setPage(1); }}
                className="bg-card border border-brand-border rounded-md px-3 py-2 text-[13px]"
              >
                <option value="all">All markets</option>
                {[...new Set(data.history.map((h) => h.market))].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {(["all", "won", "lost", "void"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => { setResultFilter(r); setPage(1); }}
                  className={`px-3 py-2 rounded-md text-[13px] border ${
                    resultFilter === r
                      ? "bg-brand-green text-primary-foreground border-brand-green"
                      : "bg-card border-brand-border text-body-text"
                  }`}
                >
                  {r === "all" ? "All results" : r[0].toUpperCase() + r.slice(1)}
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
                  {visible.map((h, i) => (
                    <tr key={i} className="border-t border-brand-border">
                      <td className="px-3 py-2 whitespace-nowrap">{shortDate(h.date)}</td>
                      <td className="px-3 py-2">{h.match}</td>
                      <td className="px-3 py-2">{h.market}</td>
                      <td className="px-3 py-2">{tierLabel(h.tier)}</td>
                      <td className="px-3 py-2 text-right">{h.odds.toFixed(2)}</td>
                      <td className={`px-3 py-2 text-right font-medium ${
                        h.result === "won" ? "text-win-green"
                        : h.result === "lost" ? "text-danger-red"
                        : "text-muted-foreground"
                      }`}>
                        {h.result.toUpperCase()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 text-[13px]">
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
          </section>
        </>
      )}
    </div>
  );
}