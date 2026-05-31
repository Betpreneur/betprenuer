import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/games/$id")({
  head: () => ({ meta: [{ title: "Game Analysis - Betpreneur" }] }),
  component: GameAnalysisPage,
});

function GameAnalysisPage() {
  const { isAuthed, loading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);
  const [loadingId, setLoadingId] = useState(true);

  useEffect(() => {
    // Get ID from URL path: games/1234567 -> 1234567
    const pathname = window.location.pathname;
    const match = pathname.match(/\/games\/(\d+)/);
    const gameId = match ? match[1] : null;

    setLoadingId(false);
    if (!gameId) { setError(true); return; }
    if (!isAuthed) return;

    api.getGameDetail(gameId).then(setData).catch(() => setError(true));
  }, [isAuthed]);

  if (loading || loadingId) return <div className="p-4">Loading...</div>;
  if (error || !data) return <div className="p-4">Failed load.</div>;

  const g = data.game;
  const hasPick = g.picks && g.picks.length > 0;
  const displayMarkets = hasPick ? g.picks : g.markets;
  
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">{g.match}</h1>
      <p className="text-sm text-muted-foreground">{g.league} · {g.kickoff}</p>
      <div className="flex justify-center items-center gap-8 py-4">
        <div className="center">{g.home_logo && <img src={g.home_logo} className="w-12 h-12"/>}<div>{g.home_team}</div></div>
        <div className="text-xl font-bold">{g.home_score??0} - {g.away_score??0}</div>
        <div className="center">{g.away_logo && <img src={g.away_logo} className="w-12 h-12"/>}<div>{g.away_team}</div></div>
      </div>
      {!hasPick && <div className="text-xs text-muted-foreground mb-2">Available Markets</div>}
      {displayMarkets?.map((p: any, i: number) => (
        <div key={i} className="p-2 border my-1">
          <div className="font-medium">{p.market}</div>
          <div className="text-sm text-muted-foreground">
            @{p.odds} {p.confidence ? `${p.confidence}% confidence` : null}
          </div>
        </div>
      ))}
    </div>
  );
}