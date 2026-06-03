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

function PickCard({ pick, teams }: { pick: Pick; teams?: any }) {
  // Use match_id if available, otherwise fall back to id
  const matchId = pick.match_id || String(pick.id);
  // Get logos from pick or from teams object
  const homeLogo = pick.home_logo || teams?.home?.logo;
  const awayLogo = pick.away_logo || teams?.away?.logo;
  
  return (
    <Link to="/match/$id" params={{ id: matchId }} className="block group h-full">
      <div className="
        h-full flex flex-col
        bg-card/80 backdrop-blur-sm
        border border-border/50 rounded-2xl p-4 sm:p-5
        hover:border-brand-green/40 hover:shadow-lg hover:shadow-brand-green/5
        hover:translate-y-[-2px] transition-all duration-300
      ">
        {/* Top row: tier badge + confidence */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${getTierColor(pick.tier)}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {pick.tier?.replace("_", " ")}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-lg font-black text-brand-green leading-none">
              {pick.confidence?.toFixed(0)}%
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">conf</span>
          </div>
        </div>

        {/* Fixture row: logos + team name, left aligned & consistent */}
        <div className="flex items-center gap-2.5 mt-3">
          <div className="flex items-center -space-x-1 shrink-0">
            {homeLogo && <img src={homeLogo} alt="" className="w-7 h-7 object-contain" />}
            {awayLogo && <img src={awayLogo} alt="" className="w-7 h-7 object-contain" />}
          </div>
          <div className="font-bold text-[15px] leading-snug text-foreground group-hover:text-brand-green transition-colors min-w-0">
            {pick.fixture}
          </div>
        </div>

        {/* Competition info with country flag */}
        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
          {(pick as any).country_flag && (
            <img src={(pick as any).country_flag} alt="" className="w-3 h-3 rounded-full object-contain" />
          )}
          {(pick as any).league}
        </div>

        {/* Market & Odds */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border/30">
          <span className="text-sm text-muted-foreground truncate">{pick.market}</span>
          <span className="text-base font-bold text-brand-green shrink-0">
            @{pick.odds ? Number(pick.odds).toFixed(2) : "—"}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 flex items-center justify-end text-xs text-muted-foreground">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">View Analysis</span>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isAuthed) return;
    setLoading(true);
    api.getTodayPicks()
      .then(res => {
        // Flatten picks and attach teams data from fixture
        const all = res.fixtures?.flatMap((f: any) => 
          (f.picks ?? []).map((p: any) => ({ ...p, _teams: f.teams }))
        ) ?? [];
        setPicks(all);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [authLoading, isAuthed]);

  if (authLoading || loading) {
    return <TopPicksSkeleton />;
  }

  if (error || !picks.length) {
    return null;
  }

  const bankers = picks.filter(p => p.tier === "banker");
  const gems = picks.filter(p => p.tier?.includes("gem"));
  const wildcards = picks.filter(p => p.tier?.includes("wild"));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{bankers.map(p => <PickCard key={p.id} pick={p} teams={p._teams} />)}</div>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{gems.map(p => <PickCard key={p.id} pick={p} teams={p._teams} />)}</div>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{wildcards.map(p => <PickCard key={p.id} pick={p} teams={p._teams} />)}</div>
        </section>
      )}
    </div>
  );
}