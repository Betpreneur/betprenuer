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
  // Use match_id if available, otherwise fall back to id
  const matchId = pick.match_id || String(pick.id);
  return (
    <Link to="/match/$id" params={{ id: matchId }} className="block group">
      <div className="bg-card border border-brand-border rounded-xl p-4 hover:border-brand-green/50 transition-colors">
        <div className="flex justify-between">
          <div>
            <span className={`text-xs px-2 py-0.5 rounded ${getTierColor(pick.tier)}`}>
              {pick.tier?.replace("_", " ")}
            </span>
            <div className="font-medium mt-1">{pick.fixture}</div>
            <div className="text-sm text-muted-foreground">
              {pick.market} @ {pick.odds ? Number(pick.odds).toFixed(2) : "—"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-brand-green">
              {pick.confidence?.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">confidence</div>
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

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="text-xl font-bold">Today's Picks</h1>
        <p className="text-sm text-muted-foreground">{todayLagos()}</p>
      </header>

      {bankers.length > 0 && (
        <section>
          <h2 className="font-bold text-brand-green mb-2">Bankers ({bankers.length})</h2>
          <div className="space-y-2">{bankers.map(p => <PickCard key={p.id} pick={p} />)}</div>
        </section>
      )}

      {gems.length > 0 && (
        <section>
          <h2 className="font-bold text-teal-600 mb-2">Value Gems ({gems.length})</h2>
          <div className="space-y-2">{gems.map(p => <PickCard key={p.id} pick={p} />)}</div>
        </section>
      )}

      {wildcards.length > 0 && (
        <section>
          <h2 className="font-bold text-purple-600 mb-2">Wildcards ({wildcards.length})</h2>
          <div className="space-y-2">{wildcards.map(p => <PickCard key={p.id} pick={p} />)}</div>
        </section>
      )}
    </div>
  );
}