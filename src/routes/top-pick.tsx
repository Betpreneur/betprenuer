import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Pick, type TodayPicksResponse } from "@/lib/api";
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

// Helper to get tier color
function getTierColor(tier: string): string {
  switch (tier) {
    case "banker": return "bg-brand-green text-primary-foreground";
    case "value_gem": return "bg-teal-600 text-white";
    case "wild_card": return "bg-purple-600 text-white";
    default: return "bg-gray-600 text-white";
  }
}

// Helper to get confidence color
function getConfidenceColor(confidence: number): string {
  if (confidence >= 72) return "text-win-green";
  if (confidence >= 68) return "text-teal-accent";
  return "text-amber-text";
}

function PickRow({ pick }: { pick: Pick }) {
  return (
    <Link to="/match/$id" params={{ id: String(pick.id) }} className="block group">
      <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-4 hover:border-brand-green/50 hover:shadow-lg hover:shadow-brand-green/10 transition-all duration-300 hover:-translate-y-0.5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getTierColor(pick.tier)}`}>
                {pick.tier?.replace("_", " ") || ""}
              </span>
              <span className="text-[11px] text-muted-foreground">{pick.league}</span>
            </div>
            <h3 className="text-[15px] font-medium leading-tight group-hover:text-white/90 transition-colors">{pick.fixture}</h3>
          </div>
          <div className="text-right">
            <div className={`text-[18px] font-bold ${getConfidenceColor(pick.confidence)} group-hover:scale-110 transition-transform`}>
              {pick.confidence?.toFixed(0)}%
            </div>
            <div className="text-[11px] text-muted-foreground">confidence</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="text-[13px]">
            <span className="text-muted-foreground">{pick.market}</span>
            <span className="text-border mx-1">@</span>
            <span className="text-win-green font-medium">{pick.odds ? Number(pick.odds).toFixed(2) : "–"}</span>
          </div>
          <div className="text-[12px] text-muted-foreground flex items-center gap-1">
            {pick.kickoff}
            <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 bg-card border border-brand-border rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function TopPickPage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const [data, setData] = useState<TodayPicksResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading || !isAuthed) return;
    api.getTodayPicks()
      .then(res => setData(res))
      .catch(() => setError(true));
  }, [authLoading, isAuthed]);

  if (authLoading) {
    return (
      <div className="space-y-5 p-4">
        <div className="h-8 w-48 bg-card border border-brand-border rounded animate-pulse" />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !data?.fixtures) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground mb-4">No picks available today.</p>
        <Link to="/home" className="text-info-blue hover:underline">← Back to today</Link>
      </div>
    );
  }

  // Flatten picks from fixtures
  const allPicks = data.fixtures?.flatMap(f => f.picks || []) || [];
  
  if (allPicks.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground mb-4">No picks available today.</p>
        <Link to="/home" className="text-info-blue hover:underline">← Back to today</Link>
      </div>
    );
  }

  const getTier = (p: Pick) => (p.tier as any as string) || "";
  const bankers = allPicks.filter((p) => getTier(p) === "banker");
  const gems = allPicks.filter((p) => getTier(p).includes("gem"));
  const wildcards = allPicks.filter((p) => getTier(p).includes("wild"));

  // Get the top pick (official gem or first pick)
  const topPick = allPicks.find(p => getTier(p).includes("gem")) ?? allPicks[0];

  return (
    <div className="space-y-6 p-4">
      {/* Stats Bar - identical to Home page */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
          </span>
          <p className="text-[13px] text-muted-foreground">
            {todayLagos()} · Picks live
          </p>
        </div>
        
        {/* Tier Summary Pills */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5">
            <span className="text-white/70">Games:</span>
            <span className="text-win-green font-bold">{allPicks.length}</span>
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-green/10">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
            <span className="text-brand-green font-medium">{bankers.length}</span>
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-teal-600/20">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
            <span className="text-teal-600 font-medium">{gems.length}</span>
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-600/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
            <span className="text-purple-600 font-medium">{wildcards.length}</span>
          </span>
        </div>
      </div>

      {data.posted_at && (
        <div className="text-[11px] text-muted-foreground/60 text-right -mt-2">
          Published {new Date(data.posted_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" })} WAT
        </div>
      )}

      {topPick && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-50"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
            </span>
            <h2 className="text-[16px] font-bold text-brand-green uppercase tracking-wide">Top Pick</h2>
            <span className="ml-auto animate-pulse">
              <svg className="w-4 h-4 text-brand-green" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </span>
          </div>
          <PickRow pick={topPick} />
        </section>
      )}

      {/* Bankers Section */}
      {bankers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[14px] font-bold text-brand-green tracking-wide">Bankers ({bankers.length})</h2>
          <div className="space-y-2">
            {bankers.map(pick => (
              <PickRow key={pick.id} pick={pick} />
            ))}
          </div>
        </section>
      )}

      {/* Value Gems Section */}
      {gems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[14px] font-bold text-teal-accent tracking-wide">Value Gems ({gems.length})</h2>
          <div className="space-y-2">
            {gems.map(pick => (
              <PickRow key={pick.id} pick={pick} />
            ))}
          </div>
        </section>
      )}

      {/* Wildcards Section */}
      {wildcards.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[14px] font-bold text-purple-500 tracking-wide">Wildcards ({wildcards.length})</h2>
          <div className="space-y-2">
            {wildcards.map(pick => (
              <PickRow key={pick.id} pick={pick} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}