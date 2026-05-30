import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type AlgoGamesResponse, type GameInfo } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { todayLagos } from "@/lib/time";

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

function GameCard({ game }: { game: GameInfo }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-brand-border rounded-xl overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-muted/20"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{game.league}</span>
          <span className="text-sm font-medium">{game.kickoff}</span>
        </div>

        <div className="flex justify-between items-center mt-2">
          <div className="text-center flex-1">
            {game.home_logo && <img src={game.home_logo} alt="" className="w-8 h-8 mx-auto" />}
            <div className="text-sm font-medium mt-1">{game.home_team}</div>
          </div>
          <span className="px-2 text-lg font-bold text-brand-green">
            {game.home_score != null ? `${game.home_score} - ${game.away_score}` : "vs"}
          </span>
          <div className="text-center flex-1">
            {game.away_logo && <img src={game.away_logo} alt="" className="w-8 h-8 mx-auto" />}
            <div className="text-sm font-medium mt-1">{game.away_team}</div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-border/30 flex justify-between text-xs">
          {game.pick ? (
            <span className="text-brand-green">
              {game.pick.tier?.replace("_", " ")} @ {game.pick.odds}
            </span>
          ) : game.best_market ? (
            <span className="text-muted-foreground">
              {game.best_market.selection} @ {game.best_market.odds}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          <span>{expanded ? "Hide" : "More"}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/30">
          <Link
            to="/match/$id"
            params={{ id: game.id }}
            className="block text-center text-sm text-info-blue hover:underline py-2"
          >
            View Full Analysis →
          </Link>
        </div>
      )}
    </div>
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
    return <div className="p-4 animate-pulse bg-card rounded-xl">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-center">Failed to load games.</div>;
  }

  if (!data) {
    return <div className="p-4 animate-pulse bg-card rounded-xl">Loading...</div>;
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