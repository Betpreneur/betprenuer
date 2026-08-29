import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type GameDetailResponse, type GameFullContext, type MarketInfo, type Pick } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatKickoff } from "@/lib/time";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/games/$id")({
  head: () => ({ meta: [{ title: "Game Analysis - Betpreneur" }] }),
  component: GameAnalysisPage,
});

function GameAnalysisPage() {
  const { isAuthed, loading } = useAuth();
  const [data, setData] = useState<GameDetailResponse | null>(null);
  const [error, setError] = useState(false);
  const [loadingId, setLoadingId] = useState(true);

  const { id } = Route.useParams();

  useEffect(() => {
    const gameId = decodeURIComponent(id || "").trim();

    setLoadingId(false);
    if (!gameId) { setError(true); return; }
    if (!isAuthed) return;

    api.getGameDetail(gameId).then(setData).catch(() => setError(true));
  }, [isAuthed, id]);

  if (loading || loadingId) return <div className="p-4">Loading...</div>;
  if (error || !data) return <div className="p-4">Failed load.</div>;

  const g: GameFullContext = data.game;
  const hasPick = g.picks && g.picks.length > 0;
  const displayMarkets: (MarketInfo | Pick)[] = hasPick ? g.picks : g.markets;
  
  return (
    <div className="space-y-4 p-4">
      <Link
        to="/games"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
      <div className="flex items-center gap-2">
        {(g.competition_logo || g.league_logo) && (
          <img 
            src={g.competition_logo || g.league_logo} 
            alt="" 
            className="w-6 h-6 object-contain"
          />
        )}
        <div>
          <h1 className="text-xl font-bold">{g.match}</h1>
          <p className="text-sm text-muted-foreground">{g.league} · {formatKickoff(g.kickoff)}</p>
        </div>
      </div>
      <div className="flex justify-center items-center gap-8 py-4">
        <div className="center">{g.home_logo && <img src={g.home_logo} className="w-12 h-12"/>}<div>{g.home_team}</div></div>
        <div className="text-xl font-bold">{g.home_score??0} - {g.away_score??0}</div>
        <div className="center">{g.away_logo && <img src={g.away_logo} className="w-12 h-12"/>}<div>{g.away_team}</div></div>
      </div>
      {!hasPick && <div className="text-xs text-muted-foreground mb-2">Available Markets</div>}
      {displayMarkets?.map((p: MarketInfo | Pick, i: number) => {
        // MarketInfo has: label, odds, meaning, ev, proven
        // Pick has: market, odds, confidence
        const marketLabel = 'label' in p ? p.label : p.market;
        const marketOdds = p.odds;
        const marketMeaning = 'meaning' in p ? p.meaning : null;
        const marketConfidence = 'confidence' in p ? p.confidence : null;
        
        return (
          <div key={i} className="p-2 border my-1">
            <div className="font-medium">{marketLabel}</div>
            <div className="text-sm text-muted-foreground">
              @{marketOdds}
              {marketMeaning && <span className="ml-2">{marketMeaning}</span>}
              {marketConfidence ? ` ${marketConfidence}% confidence` : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}