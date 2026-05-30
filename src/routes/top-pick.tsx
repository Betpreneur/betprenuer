import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Pick } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { todayLagos } from "@/lib/time";

export const Route = createFileRoute("/top-pick")({
  head: () => ({
    meta: [
      { title: "All Picks - Betpreneur" },
      { name: "description", content: "All picks by tier." },
    ],
  }),
  component: TopPickPage,
});

function getTierColor(tier: string): string {
  switch (tier) {
    case "banker": return "bg-brand-green text-primary-foreground";
    case "value_gem": return "bg-teal-600 text-white";
    case "wild_card": return "bg-purple-600 text-white";
    default: return "bg-gray-600 text-white";
  }
}

function PickCard({ pick }: { pick: Pick }) {
  return (
    <Link to="/match/$id" params={{ id: String(pick.id) }} className="block group">
      <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border/50 rounded-xl p-4 hover:border-brand-green/60 hover:shadow-md hover:shadow-brand-green/10 transition-all duration-200">
        <div className="flex justify-between items-center gap-3">
          <div className="flex-1 min-w-0">
            <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${getTierColor(pick.tier)}`}>
              {pick.tier?.replace("_", " ")}
            </span>
            <div className="font-semibold mt-1.5 truncate">{pick.fixture}</div>
            <div className="text-sm text-muted-foreground">
              {pick.market} @ {pick.odds ? Number(pick.odds).toFixed(2) : "—"}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-brand-green">
              {pick.confidence?.toFixed(0)}%
            </div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide">confidence</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function TopPickPage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading || !isAuthed) return;
    api.getTodayPicks()
      .then(res => {
        const all = res.fixtures?.flatMap((f: any) => f.picks ?? []) ?? [];
        setPicks(all);
      })
      .catch(() => setError(true));
  }, [authLoading, isAuthed]);

  if (authLoading) {
    return <div className="p-4 animate-pulse bg-card rounded-xl">Loading...</div>;
  }

  if (error || !picks.length) {
    return <div className="p-4">No picks available today.</div>;
  }

  const bankers = picks.filter(p => p.tier === "banker");
  const gems = picks.filter(p => p.tier?.includes("gem"));
  const wildcards = picks.filter(p => p.tier?.includes("wild"));
  const totalPicks = picks.length;

  return (
    <div className="space-y-5 p-4">
      {/* Header with stats */}
      <header className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border/50 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold">Today's Picks</h1>
            <p className="text-sm text-muted-foreground">{todayLagos()} · Picks live</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Published 00:05 WAT
          </div>
        </div>
        {/* Games stat pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-3 py-1.5 bg-muted/50 rounded-full font-medium">
            Games: <span className="text-brand-green font-bold">{totalPicks}</span>
          </span>
          <span className="text-xs px-3 py-1.5 bg-brand-green/10 text-brand-green rounded-full font-medium">
            {bankers.length}
          </span>
          <span className="text-xs px-3 py-1.5 bg-teal-600/10 text-teal-accent rounded-full font-medium">
            {gems.length}
          </span>
          <span className="text-xs px-3 py-1.5 bg-purple-600/10 text-purple-500 rounded-full font-medium">
            {wildcards.length}
          </span>
        </div>
      </header>

      {bankers.length > 0 && (
        <section className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border/50 rounded-xl p-5 shadow-sm">
          <h2 className="text-[14px] font-semibold text-brand-green mb-3 tracking-wide">Bankers ({bankers.length})</h2>
          <div className="space-y-2">{bankers.map(p => <PickCard key={p.id} pick={p} />)}</div>
        </section>
      )}

      {gems.length > 0 && (
        <section className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border/50 rounded-xl p-5 shadow-sm">
          <h2 className="text-[14px] font-semibold text-teal-accent mb-3 tracking-wide">Value Gems ({gems.length})</h2>
          <div className="space-y-2">{gems.map(p => <PickCard key={p.id} pick={p} />)}</div>
        </section>
      )}

      {wildcards.length > 0 && (
        <section className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border/50 rounded-xl p-5 shadow-sm">
          <h2 className="text-[14px] font-semibold text-purple-500 mb-3 tracking-wide">Wildcards ({wildcards.length})</h2>
          <div className="space-y-2">{wildcards.map(p => <PickCard key={p.id} pick={p} />)}</div>
        </section>
      )}
    </div>
  );
}