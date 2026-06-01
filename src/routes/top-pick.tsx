import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Pick } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { todayLagos } from "@/lib/time";
import { TopPicksSkeleton } from "@/components/skeletons";

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
      <div className="
        bg-card/80 backdrop-blur-sm
        border border-border/50 rounded-2xl p-5 
        hover:border-brand-green/40 hover:shadow-lg hover:shadow-brand-green/5
        hover:translate-y-[-2px] transition-all duration-300
      ">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Tier Badge */}
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${getTierColor(pick.tier)}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {pick.tier?.replace("_", " ")}
            </span>
            
            {/* Team Logos & Fixture */}
            <div className="flex items-center gap-3 mt-3">
              {pick.home_logo && (
                <img src={pick.home_logo} alt="" className="w-8 h-8 object-contain" />
              )}
              <div className="font-bold text-lg leading-tight text-foreground group-hover:text-brand-green transition-colors flex-1">
                {pick.fixture}
              </div>
              {pick.away_logo && (
                <img src={pick.away_logo} alt="" className="w-8 h-8 object-contain" />
              )}
            </div>
            
            {/* Market & Odds */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">{pick.market}</span>
              <span className="text-muted-foreground/40">@</span>
              <span className="text-base font-bold text-brand-green">
                {pick.odds ? Number(pick.odds).toFixed(2) : "—"}
              </span>
            </div>
          </div>
          
          {/* Confidence Badge */}
          <div className="
            w-16 h-16 rounded-2xl 
            bg-gradient-to-br from-brand-green/20 to-brand-green/5
            border border-brand-green/30
            flex flex-col items-center justify-center
          ">
            <div className="text-xl font-black text-brand-green">
              {pick.confidence?.toFixed(0)}%
            </div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
              conf
            </div>
          </div>
        </div>
        
        {/* Hover Arrow */}
        <div className="
          mt-3 pt-3 border-t border-border/30
          flex items-center justify-end
          text-xs text-muted-foreground
          opacity-0 group-hover:opacity-100 transition-opacity
        ">
          <span>View Analysis</span>
          <svg className="w-4 h-4 ml-1 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
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
    return <TopPicksSkeleton />;
  }

  if (error || !picks.length) {
    return <div className="p-4">No picks available today.</div>;
  }

  const bankers = picks.filter(p => p.tier === "banker");
  const gems = picks.filter(p => p.tier?.includes("gem"));
  const wildcards = picks.filter(p => p.tier?.includes("wild"));

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-brand-green/10 border border-brand-green/30 p-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-10 h-10 rounded-xl bg-brand-green/20 flex items-center justify-center border border-brand-green/30">
              <svg className="w-6 h-6 text-brand-green" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </span>
            <h1 className="text-xl font-bold">Today's Picks</h1>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {todayLagos()}
          </p>
        </div>
      </header>

      {bankers.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 font-bold text-brand-green mb-3">
            <span className="w-6 h-6 rounded-lg bg-brand-green/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-green" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </span>
            Bankers ({bankers.length})
          </h2>
          <div className="grid gap-3">{bankers.map(p => <PickCard key={p.id} pick={p} />)}</div>
        </section>
      )}

      {gems.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 font-bold text-teal-500 mb-3">
            <span className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </span>
            Value Gems ({gems.length})
          </h2>
          <div className="grid gap-3">{gems.map(p => <PickCard key={p.id} pick={p} />)}</div>
        </section>
      )}

      {wildcards.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 font-bold text-purple-500 mb-3">
            <span className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </span>
            Wildcards ({wildcards.length})
          </h2>
          <div className="grid gap-3">{wildcards.map(p => <PickCard key={p.id} pick={p} />)}</div>
        </section>
      )}
    </div>
  );
}