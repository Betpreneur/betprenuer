import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type AlgoGamesResponse, type GameInfo, type Pick } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { todayLagos } from "@/lib/time";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Today's Games — Betpreneur" },
      { name: "description", content: "All covered games with picks and analysis." },
      { property: "og:title", content: "Today's Games — Betpreneur" },
      { property: "og:description", content: "Browse today's covered matches with AI analysis and picks." },
    ],
  }),
  component: HomePage,
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

function PickRow({ pick, index = 0 }: { pick: Pick; index?: number }) {
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

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-bold">{title}</h2>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-card rounded animate-pulse" />
            <div className="h-4 w-16 bg-card rounded animate-pulse" />
          </div>
          <div className="h-28 bg-card border border-brand-border rounded-xl animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-2xl p-8 text-center">
      {/* Animated icon container */}
      <div className="relative w-20 h-20 mx-auto mb-4">
        <div className="absolute inset-0 bg-muted-foreground/10 rounded-full animate-pulse"></div>
        <div className="relative flex items-center justify-center w-full h-full text-4xl">
          📭
        </div>
      </div>
      <h2 className="text-[20px] font-bold mb-2">No Picks Today</h2>
      <p className="text-[14px] text-muted-foreground mb-6">{message}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/record" className="px-4 py-2 bg-info-blue/10 text-info-blue rounded-lg text-[13px] font-medium hover:bg-info-blue/20 transition-colors">
          📊 View Track Record
        </Link>
        <Link to="/settings" className="px-4 py-2 bg-muted/20 text-muted-foreground rounded-lg text-[13px] font-medium hover:bg-muted/30 transition-colors">
          ⚙️ Adjust Preferences
        </Link>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-gradient-to-br from-danger-bg to-card border border-danger-red/30 rounded-xl p-8 text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <h2 className="text-[18px] font-bold text-danger-red">Unable to load picks</h2>
      <p className="text-[13px] text-muted-foreground mt-2 mb-4">Something went wrong. Please try again.</p>
      <button 
        onClick={onRetry} 
        className="px-6 py-2 bg-brand-green text-primary-foreground font-medium rounded-lg hover:bg-brand-green/90 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function AwaitingState() {
  return (
    <div className="bg-gradient-to-br from-card to-jet-surface-2 border-2 border-brand-border rounded-2xl p-8 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-text/10 text-amber-text rounded-full mb-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-text opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-text"></span>
        </span>
        <span className="text-[12px] font-semibold uppercase tracking-wide">Awaiting Picks</span>
      </div>
      <h1 className="text-[26px] font-bold mb-2">Picks Arriving Soon</h1>
      <p className="text-[15px] text-muted-foreground mb-6">
        Daily picks go live at <span className="text-brand-green font-semibold">06:30 WAT</span>
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
        <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-[14px] font-medium text-white/80">06:30</span>
        <span className="text-[11px] text-muted-foreground">(GMT+1)</span>
      </div>
    </div>
  );
}

function HomePage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const [data, setData] = useState<AlgoGamesResponse | null>(null);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const load = () => {
    setError(false);
    api.getAlgoGames()
      .then(setData)
      .catch(() => setError(true));
  };

  useEffect(() => {
    if (!isAuthed) return;
    load();
  }, [isAuthed]);

  useEffect(() => {
    if (!data?.published) return;
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [data?.published]);

  // Derived: extract unique leagues for filter tabs
  const leagues = data?.games 
    ? [...new Set(data.games.map(g => g.league))]
    : [];
  const filters = ["All", ...leagues];

  // Derived: filter games by active league
  const filteredGames = data?.games 
    ? activeFilter === "All" 
      ? data.games 
      : data.games.filter(g => g.league === activeFilter)
    : [];

  if (authLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  if (!data) {
    return <LoadingSkeleton />;
  }

  // Not published yet
  if (!data.published) {
    return <AwaitingState />;
  }

  return (
    <div className="space-y-4">
      {/* Header with date */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Today's Games</h1>
          <p className="text-[13px] text-muted-foreground">{todayLagos()}</p>
        </div>
        <div className="text-[12px] text-muted-foreground">
          {filteredGames.length} game{filteredGames.length !== 1 ? "s" : ""}
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
              activeFilter === filter
                ? "bg-brand-green text-primary-foreground"
                : "bg-card border border-brand-border text-muted-foreground hover:border-brand-green/50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      {filteredGames.length === 0 ? (
        <EmptyState message="No games found for this filter." />
      ) : (
        <div className="grid gap-3">
          {filteredGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}

// Component: single game card
function GameCard({ game }: { game: GameInfo }) {
  const [expanded, setExpanded] = useState(false);
  const hasPick = !!game.pick;
  const hasBestMarket = !!game.best_market;

  return (
    <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl overflow-hidden">
      {/* Main card row - always visible */}
      <div 
        className="p-4 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          {/* League + Time */}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-muted-foreground mb-1 truncate">{game.league}</div>
            <div className="text-[13px] font-medium">{game.kickoff}</div>
          </div>

          {/* Teams Grid */}
          <div className="flex-1 flex items-center justify-center gap-2 text-center">
            {/* Home Team */}
            <div className="flex flex-col items-center min-w-0">
              {game.home_logo && (
                <img src={game.home_logo} alt="" className="w-8 h-8 object-contain mb-1" />
              )}
              <span className="text-[13px] font-medium truncate max-w-[80px]">{game.home_team}</span>
            </div>
            
            {/* Score or VS */}
            <div className="px-2">
              {game.status === "FT" || game.home_score !== null ? (
                <span className="text-[16px] font-bold text-brand-green">
                  {game.home_score} - {game.away_score}
                </span>
              ) : (
                <span className="text-[12px] text-muted-foreground">vs</span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center min-w-0">
              {game.away_logo && (
                <img src={game.away_logo} alt="" className="w-8 h-8 object-contain mb-1" />
              )}
              <span className="text-[13px] font-medium truncate max-w-[80px]">{game.away_team}</span>
            </div>
          </div>

          {/* Best Market / Pick indicator */}
          <div className="flex-1 min-w-0 text-right">
            {hasPick && (
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getTierColor(game.pick!.tier)}`}>
                  {game.pick!.tier?.replace("_", " ") || ""}
                </span>
                <span className="text-win-green font-bold text-[14px]">
                  {game.pick!.odds ? Number(game.pick!.odds).toFixed(2) : "–"}
                </span>
              </div>
            )}
            {!hasPick && hasBestMarket && (
              <div className="text-right">
                <span className="text-[11px] text-muted-foreground block truncate max-w-[80px]">
                  {game.best_market!.selection}
                </span>
                <span className="text-win-green font-medium">@ {game.best_market!.odds}</span>
              </div>
            )}
            {!hasPick && !hasBestMarket && (
              <span className="text-[11px] text-muted-foreground">—</span>
            )}
          </div>
        </div>

        {/* Expand arrow */}
        <div className="flex justify-center mt-2">
          <svg 
            className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded section - markets and pick */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-3">
          {/* Best Market */}
          {hasBestMarket && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">Best Market</span>
              <span>
                <span className="font-medium">{game.best_market!.selection}</span>
                <span className="text-muted-foreground mx-1">@</span>
                <span className="text-win-green font-bold">{game.best_market!.odds}</span>
              </span>
            </div>
          )}

          {/* Official Pick */}
          {hasPick && (
            <Link 
              to="/match/$id" 
              params={{ id: game.pick!.id }}
              className="block"
            >
              <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-green/40 rounded-lg p-3 hover:border-brand-green hover:shadow-lg hover:shadow-brand-green/10 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getTierColor(game.pick!.tier)}`}>
                      {game.pick!.tier?.replace("_", " ") || ""}
                    </span>
                    <div className="text-[14px] font-medium mt-1">{game.pick!.market}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[18px] font-bold ${getConfidenceColor(game.pick!.confidence)}`}>
                      {game.pick!.confidence?.toFixed(0)}%
                    </div>
                    <div className="text-[11px] text-muted-foreground">confidence</div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* View Details Link */}
          <Link 
            to="/match/$id" 
            params={{ id: game.id }}
            className="block text-center text-[12px] text-info-blue hover:underline py-2"
          >
            View Full Analysis →
          </Link>
        </div>
      )}
    </div>
  );
}

// Component: filter tabs loading skeleton
        }
      })
      .catch(() => setError(true));
  };

  useEffect(() => {
    if (!isAuthed) return;
    load();
  }, [isAuthed]);

  useEffect(() => {
    if (!data?.published) return;
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [data?.published]);

  if (authLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 bg-card border border-brand-border rounded animate-pulse" />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <ErrorState onRetry={load} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 bg-card border border-brand-border rounded animate-pulse" />
        <LoadingSkeleton />
      </div>
    );
  }

  // Not published yet - Enhanced awaiting state with animation
  if (!data.published) {
    return (
      <div className="space-y-6">
        <header className="relative overflow-hidden bg-gradient-to-br from-card to-jet-surface-2 border-2 border-brand-border rounded-2xl p-8 text-center">
          {/* Animated background effect */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-brand-green/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-teal-accent/20 rounded-full blur-3xl animate-pulse delay-700"></div>
          </div>
          
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-text/10 text-amber-text rounded-full mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-text opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-text"></span>
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-wide">Awaiting Picks</span>
            </div>
            
            <h1 className="text-[26px] font-bold mb-2">Picks Arriving Soon</h1>
            <p className="text-[15px] text-muted-foreground mb-6 max-w-sm mx-auto">
              Our AI model is analyzing today's matches.<br />
              Daily picks go live at <span className="text-brand-green font-semibold">06:30 WAT</span>.
            </p>
            
            {/* Pulsing clock indicator */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[14px] font-medium text-white/80">06:30</span>
              <span className="text-[11px] text-muted-foreground">(GMT+1)</span>
            </div>
          </div>
        </header>
        
        {/* How It Works - Enhanced */}
        <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-2xl p-6">
          <h2 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-teal-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            How It Works
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-brand-green/5 rounded-xl border border-brand-green/20">
              <span className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center text-[12px] font-bold">72+</span>
              <div>
                <p className="text-[13px] font-medium text-brand-green">Bankers</p>
                <p className="text-[11px] text-muted-foreground">Highest confidence picks</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-teal-accent/5 rounded-xl border border-teal-accent/20">
              <span className="w-6 h-6 rounded-full bg-teal-accent flex items-center justify-center text-[12px] font-bold text-black">68+</span>
              <div>
                <p className="text-[13px] font-medium text-teal-accent">Value Gems</p>
                <p className="text-[11px] text-muted-foreground">Underrated undervalued picks</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-text/5 rounded-xl border border-amber-text/20">
              <span className="w-6 h-6 rounded-full bg-amber-text flex items-center justify-center text-[12px] font-bold text-black">62+</span>
              <div>
                <p className="text-[13px] font-medium text-amber-text">Wildcards</p>
                <p className="text-[11px] text-muted-foreground">Higher risk, higher reward</p>
              </div>
            </div>
          </div>
        </div>
        
        <Link to="/record" className="flex items-center justify-center gap-2 text-info-blue text-[14px] hover:underline py-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          See Our 90-Day Track Record →
        </Link>
      </div>
    );
  }

  // Flatten picks from fixtures
  const allPicks = data.fixtures?.flatMap(f => f.picks || []) || [];
  
  if (allPicks.length === 0) {
    return (
      <div className="space-y-5">
        <EmptyState message="The model didn't find sufficient confidence today. Check back tomorrow." />
        
        <Link to="/record" className="block text-center text-info-blue text-[14px] hover:underline">
          📊 See our 90-day track record →
        </Link>
      </div>
    );
  }

  // Categorize picks by tier - use official top pick from API first
  const getTier = (p: Pick) => (p.tier as any as string) || "";
  
  // Use the official top pick from API, or fallback to same logic as top-pick page
  const topPick = topPickData 
    || (() => {
      const officialTop = allPicks.find((p) => 
        p.tier === "value_gem" || getTier(p).includes("gem")
      );
      return officialTop ?? allPicks[0];
    })();
  
  const bankers = allPicks.filter((p) => getTier(p) === "banker");
  const gems = allPicks.filter((p) => getTier(p).includes("gem"));
  const wildcards = allPicks.filter((p) => getTier(p).includes("wild"));

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Bar */}
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
          {/* Total Games - show as text instead of dot */}
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5">
            <span className="text-white/70">Games:</span>
            <span className="text-win-green font-bold">{allPicks.length}</span>
          </span>
          {/* Banker - RED brand */}
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-green/10">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
            <span className="text-brand-green font-medium">{bankers.length}</span>
          </span>
          {/* Value Gem - TEAL */}
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-teal-600/20">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
            <span className="text-teal-600 font-medium">{gems.length}</span>
          </span>
          {/* Wildcard - PURPLE */}
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
            {/* Glow dot */}
            <span className="ml-auto animate-pulse">
              <svg className="w-4 h-4 text-brand-green" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </span>
          </div>
          <Link to="/top-pick" className="block" onClick={(e) => { e.preventDefault(); window.location.href = '/top-pick'; }}>
          {/* Enhanced top pick card with glow effect */}
          <div className="relative group">
            {/* Glow background effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-green via-teal-accent to-brand-green rounded-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur"></div>
            
            <button type="button" className="relative w-full text-left bg-gradient-to-br from-card to-jet-surface-2 border border-brand-green/40 rounded-xl p-4 hover:border-brand-green hover:shadow-lg hover:shadow-brand-green/10 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getTierColor(topPick.tier)}`}>
                      {topPick.tier?.replace("_", " ") || ""}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{topPick.league}</span>
                  </div>
                  <h3 className="text-[17px] font-semibold leading-tight group-hover:text-white/90 transition-colors">{topPick.fixture}</h3>
                </div>
                <div className="text-right">
                  <div className={`text-[22px] font-bold ${getConfidenceColor(topPick.confidence)} group-hover:scale-105 transition-transform`}>
                    {topPick.confidence?.toFixed(0)}%
                  </div>
                  <div className="text-[11px] text-muted-foreground">confidence</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-brand-green/20">
                <div className="text-[14px]">
                  <span className="text-muted-foreground">{topPick.market}</span>
                  <span className="text-border mx-2">@</span>
                  <span className="text-win-green font-bold text-lg">{topPick.odds ? Number(topPick.odds).toFixed(2) : "–"}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  {topPick.kickoff}
                  <svg className="w-4 h-4 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </Link>
        </section>
      )}

      {bankers.length > 0 && (
        <Section title="Bankers" subtitle="72%+ confidence">
          {bankers.map((pick) => (
            <PickRow key={pick.id} pick={pick} />
          ))}
        </Section>
      )}

      {gems.length > 0 && (
        <Section title="Value Gems" subtitle="68-72% confidence">
          {gems.map((pick) => (
            <PickRow key={pick.id} pick={pick} />
          ))}
        </Section>
      )}

      {wildcards.length > 0 && (
        <Section title="Wildcards" subtitle="62-68% confidence">
          {wildcards.map((pick) => (
            <PickRow key={pick.id} pick={pick} />
          ))}
        </Section>
      )}

      <Link to="/record" className="flex items-center justify-center gap-2 text-info-blue text-[14px] hover:underline py-4 mt-4 group">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        📊 See Our 90-Day Track Record
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}