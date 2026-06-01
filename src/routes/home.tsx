import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type AlgoGamesResponse, type GameInfo } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { todayLagos } from "@/lib/time";
import { HomePageSkeleton } from "@/components/skeletons";
import { StakeGuide } from "@/components/StakeGuide";
import { useBackedPicks } from "@/hooks/useBackedPicks";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Today's Games — Betpreneur" },
      { name: "description", content: "All covered games today." },
      { property: "og:title", content: "Today's Games — Betpreneur" },
      { property: "og:description", content: "All covered games with analysis." },
    ],
  }),
  component: HomePage,
});

// Bento Grid GameCard - Modern Apple-style with glass touches
// League color mappings for visual distinction
const LEAGUE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Premier League": { bg: "from-red-500/20 to-red-500/5", text: "text-red-400", border: "border-red-500/30" },
  "La Liga": { bg: "from-yellow-500/20 to-yellow-500/5", text: "text-yellow-400", border: "border-yellow-500/30" },
  "Bundesliga": { bg: "from-red-600/20 to-red-600/5", text: "text-red-500", border: "border-red-600/30" },
  "Serie A": { bg: "from-blue-500/20 to-blue-500/5", text: "text-blue-400", border: "border-blue-500/30" },
  "Ligue 1": { bg: "from-indigo-500/20 to-indigo-500/5", text: "text-indigo-400", border: "border-indigo-500/30" },
  "Champions League": { bg: "from-purple-500/20 to-purple-500/5", text: "text-purple-400", border: "border-purple-500/30" },
  "Europa League": { bg: "from-amber-500/20 to-amber-500/5", text: "text-amber-400", border: "border-amber-500/30" },
  "Conference": { bg: "from-teal-500/20 to-teal-500/5", text: "text-teal-400", border: "border-teal-500/30" },
  "FA Cup": { bg: "from-blue-600/20 to-blue-600/5", text: "text-blue-500", border: "border-blue-600/30" },
  "EFL": { bg: "from-emerald-500/20 to-emerald-500/5", text: "text-emerald-400", border: "border-emerald-500/30" },
};

function getLeagueStyle(league: string) {
  // Try to find a matching league or use defaults
  for (const [key, style] of Object.entries(LEAGUE_COLORS)) {
    if (league.toLowerCase().includes(key.toLowerCase())) {
      return style;
    }
  }
  return { bg: "from-brand-green/20 to-brand-green/5", text: "text-brand-green", border: "border-brand-green/30" };
}

function GameCard({ game }: { game: GameInfo }) {
  const [expanded, setExpanded] = useState(false);
  const leagueStyle = getLeagueStyle(game.league);
  const isLive = game.status === "live" || game.home_score != null;
  const backedPicks = useBackedPicks();
  const isBacked = backedPicks.some(p => p.id === Number(game.match_id));
  
  const tierColors: Record<string, string> = {
    banker: "bg-win-green/20 text-win-green border-win-green/30 shadow-[0_0_12px_rgba(34,197,94,0.4)]",
    gem: "bg-teal-500/20 text-teal-500 border-teal-500/30 shadow-[0_0_12px_rgba(20,184,166,0.4)]",
    wild_card: "bg-amber-500/20 text-amber-500 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.4)]",
  };

  return (
    <Link 
      to="/match/$id" 
      params={{ id: game.match_id }}
      className="group block w-full"
    >
      <div className={`
        w-full box-border
        bg-gradient-to-br from-card via-card to-card/80
        border border-border/50 rounded-2xl 
        overflow-hidden transition-all duration-300
        hover:border-brand-green/60 hover:shadow-[0_8px_30px_rgba(34,197,94,0.15)] hover:translate-y-[-2px]
        ${isLive ? 'ring-2 ring-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : ''}
      `}>
        {/* Shimmer gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
        {/* Pulsing live indicator */}
        {isLive && (
          <div className="relative">
            <div className="
              px-4 py-1.5 text-xs font-semibold tracking-wide uppercase flex items-center gap-2
              bg-gradient-to-r from-red-500/20 to-red-500/5 text-red-400 border-b border-red-500/30
            ">
              <span className="animate-pulse">🔴</span>
              🔥 LIVE
            </div>
          </div>
        )}
        
        {/* Backed indicator - show when game is already backed */}
        {isBacked && !isLive && (
          <div className="px-4 py-1.5 text-xs font-semibold tracking-wide uppercase bg-win-green/20 text-win-green border-b border-win-green/30">
            ✓ Backed
          </div>
        )}
        
        {/* Tier indicator */}
        {!isLive && !isBacked && game.official_pick?.tier && (
          <div className={`
            px-4 py-1.5 text-xs font-semibold tracking-wide uppercase flex items-center gap-2
            ${tierColors[game.official_pick.tier] || "bg-muted/50"}
            border-b border-transparent
          `}>
            <span className="animate-pulse">
              {game.official_pick.tier === 'banker' ? '⭐' : game.official_pick.tier === 'gem' ? '💎' : '🎲'}
            </span>
            {game.official_pick.tier?.replace("_", " ")}
          </div>
        )}
        
        
        
        <div className="p-5">
          {/* League Tag - Color Coded */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              {(game.competition_logo || game.league_logo) && (
                <img 
                  src={game.competition_logo || game.league_logo} 
                  alt="" 
                  className="w-5 h-5 object-contain"
                />
              )}
              <span className={`
                text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md
                bg-gradient-to-r ${leagueStyle.bg} ${leagueStyle.text} border ${leagueStyle.border}
              `}>
                {game.league}
              </span>
            </div>
            <span className="text-sm font-semibold text-foreground/60">
              {game.kickoff}
            </span>
          </div>

          {/* Teams Matchup - Centered Layout */}
          <div className="flex items-center justify-center gap-2 md:gap-4 mb-4">
            <div className="flex-1 text-center min-w-0">
              {game.home_logo && (
                <img src={game.home_logo} alt="" className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2" />
              )}
              <div className="text-sm font-bold truncate text-foreground group-hover:text-brand-green transition-colors">
                {game.home_team}
              </div>
            </div>
            
            <div className="text-center shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center border border-violet-500/30">
                <span className="text-sm font-bold text-violet-400">
                  {game.home_score != null ? "-" : "VS"}
                </span>
              </div>
            </div>
            
            <div className="flex-1 text-center min-w-0">
              {game.away_logo && (
                <img src={game.away_logo} alt="" className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2" />
              )}
              <div className="text-sm font-bold truncate text-foreground group-hover:text-brand-green transition-colors">
                {game.away_team}
              </div>
            </div>
          </div>

          {/* Score display (when live/finished) */}
          {game.home_score != null && (
            <div className="text-center py-2 mb-3">
              <span className="text-2xl md:text-3xl font-black tracking-wider">
                {game.home_score} <span className="text-muted-foreground/50 mx-1 md:mx-2">:</span> {game.away_score}
              </span>
            </div>
          )}

          {/* Pick Preview Card - Embedded with confidence bar */}
          {game.official_pick?.selection ? (
            <div className="
              relative overflow-hidden bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-transparent 
              rounded-xl p-3 border border-violet-500/30
            ">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <div className="flex items-center justify-between relative">
                <div>
                  <div className="text-lg font-bold text-foreground">{game.official_pick.selection}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xl font-black text-violet-400">@{Number(game.official_pick.odds).toFixed(2)}</span>
                    {game.official_pick.confidence ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min(game.official_pick.confidence, 100)}%`,
                            backgroundColor: game.official_pick.confidence >= 80 ? '#22c55e' : game.official_pick.confidence >= 70 ? '#3b82f6' : game.official_pick.confidence >= 60 ? '#eab308' : '#ef4444'
                          }} />
                        </div>
                        <span className="text-xs font-bold" style={{
                          color: game.official_pick.confidence >= 80 ? '#22c55e' : game.official_pick.confidence >= 70 ? '#3b82f6' : game.official_pick.confidence >= 60 ? '#eab308' : '#ef4444'
                        }}>{game.official_pick.confidence.toFixed(0)}%</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="
                  px-3 py-1.5 rounded-full
                  bg-violet-500/20 text-violet-400 
                  text-sm font-bold
                  border border-violet-500/30
                ">→</div>
              </div>
            </div>
          ) : game.top_market ? (
            <div className="
              relative overflow-hidden bg-gradient-to-r from-blue-500/10 to-cyan-500/5
              rounded-xl p-3 border border-blue-500/30
            ">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-blue-400 mb-1">📊 Top Market</div>
                  <div className="text-lg font-bold text-foreground">{game.top_market.market}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xl font-black text-blue-400">@{Number(game.top_market.odds).toFixed(2)}</span>
                    {game.top_market.confidence ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min(game.top_market.confidence, 100)}%`,
                            backgroundColor: game.top_market.confidence >= 80 ? '#22c55e' : game.top_market.confidence >= 70 ? '#3b82f6' : game.top_market.confidence >= 60 ? '#eab308' : '#ef4444'
                          }} />
                        </div>
                        <span className="text-xs font-bold" style={{
                          color: game.top_market.confidence >= 80 ? '#22c55e' : game.top_market.confidence >= 70 ? '#3b82f6' : game.top_market.confidence >= 60 ? '#eab308' : '#ef4444'
                        }}>{game.top_market.confidence}%</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="
                  px-3 py-1.5 rounded-full
                  bg-blue-500/20 text-blue-400
                  text-sm font-bold
                  border border-blue-500/30
                ">→</div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Hover reveal footer */}
      </div>
    </Link>
  );
}

function HomePage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const [data, setData] = useState<AlgoGamesResponse | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("All");

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
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [data?.published]);

  if (authLoading) {
    return <HomePageSkeleton />;
  }

  if (error) {
    return <div className="p-4 text-center">Failed to load games.</div>;
  }

  if (!data) {
    return <HomePageSkeleton />;
  }

  const games = data.games || [];
  
  if (!data.published) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Waiting for Games</h1>
        <p className="text-muted-foreground">Games announced soon</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold mb-2">No Games Today</h1>
        <p className="text-muted-foreground">Check back later</p>
      </div>
    );
  }

  const leagues = [...new Set(games.map(g => g.league))];
  const filters = ["All", ...leagues];
  const filteredGames = filter === "All" ? games : games.filter(g => g.league === filter);

  return (
    <div className="space-y-4 p-4">
      {/* Enhanced Header with gaming vibe */}
      <header className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-red-500/10 via-transparent to-transparent rounded-2xl -z-10 blur-xl" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-foreground to-red-400 bg-clip-text text-transparent flex items-center gap-2">
              ⚽ Today's Games
            </h1>
            <p className="text-sm text-muted-foreground">{todayLagos()}</p>
          </div>
          <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30">
            <span className="animate-pulse">🎯</span>
            <span className="text-xs font-bold text-red-400">{games.length}⚡matches</span>
          </div>
        </div>
      </header>

      {/* Styled Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filter === f
                ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_4px_15px_rgba(239,68,68,0.4)] scale-105"
                : "bg-card/80 border border-red-500/30 text-red-400 hover:border-red-500/60 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:scale-105"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredGames.map(game => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}