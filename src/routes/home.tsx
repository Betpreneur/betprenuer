import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type AlgoGamesResponse, type GameInfo } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { todayLagos } from "@/lib/time";
import { HomePageSkeleton } from "@/components/skeletons";
import { StakeGuide } from "@/components/StakeGuide";

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
  
  const tierColors: Record<string, string> = {
    banker: "bg-win-green/20 text-win-green border-win-green/30",
    gem: "bg-teal-500/20 text-teal-500 border-teal-500/30",
    wild_card: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  };

  return (
    <Link 
      to="/match/$id" 
      params={{ id: game.match_id }}
      className="group block w-full"
    >
      <div className="
        w-full box-border
        bg-card/80 backdrop-blur-sm 
        border border-border/50 rounded-2xl 
        overflow-hidden transition-all duration-300
        hover:border-brand-green/40 hover:shadow-lg hover:shadow-brand-green/5
        hover:translate-y-[-2px]
      ">
        {/* Pulsing live indicator */}
        {isLive && (
          <div className="relative">
            <div className="
              px-4 py-1.5 text-xs font-semibold tracking-wide uppercase flex items-center gap-2
              bg-gradient-to-r from-red-500/20 to-red-500/5 text-red-400 border-b border-red-500/30
            ">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
              </span>
              LIVE
            </div>
          </div>
        )}
        
        {/* Tier indicator */}
        {!isLive && game.pick?.tier && (
          <div className={`
            px-4 py-1.5 text-xs font-semibold tracking-wide uppercase flex items-center gap-2
            ${tierColors[game.pick.tier] || "bg-muted/50"}
            border-b border-transparent
          `}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {game.pick.tier?.replace("_", " ")}
          </div>
        )}
        
        
        
        <div className="p-5">
          {/* League Tag - Color Coded */}
          <div className="flex justify-between items-center mb-4">
            <span className={`
              text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md
              bg-gradient-to-r ${leagueStyle.bg} ${leagueStyle.text} border ${leagueStyle.border}
            `}>
              {game.league}
            </span>
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
              <div className="text-xs text-muted-foreground mb-1">vs</div>
              <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
                <span className="text-sm font-bold text-muted-foreground">
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

          {/* Pick Preview Card - Embedded */}
          {game.pick?.selection ? (
            <div className="
              bg-gradient-to-r from-muted/30 to-muted/10 
              rounded-xl p-3 border border-border/30
            ">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {game.pick.selection}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {Number(game.pick.odds).toFixed(2)} odds
                    {game.pick.confidence ? ` · ${game.pick.confidence.toFixed(0)}% confidence` : null}
                  </div>
                </div>
                <div className="
                  px-3 py-1.5 rounded-lg
                  bg-brand-green/20 text-brand-green 
                  text-sm font-bold
                  border border-brand-green/30
                ">
                  →
                </div>
              </div>
            </div>
          ) : game.top_market ? (
            <div className="
              bg-gradient-to-r from-muted/30 to-muted/10 
              rounded-xl p-3 border border-border/30
            ">
              <div className="text-xs text-muted-foreground mb-2">
                Official picks not available
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {game.top_market.selection}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {Number(game.top_market.odds).toFixed(2)} odds · {game.top_market.label}
                  </div>
                </div>
                <div className="
                  px-3 py-1.5 rounded-lg
                  bg-muted/50 text-muted-foreground
                  text-sm font-bold
                  border border-border
                ">
                  →
                </div>
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
      <header>
        <h1 className="text-xl font-bold">Today's Games</h1>
        <p className="text-sm text-muted-foreground">{todayLagos()}</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              filter === f
                ? "bg-brand-green text-white"
                : "bg-card border border-brand-border text-muted-foreground hover:border-brand-green/50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filteredGames.map(game => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}