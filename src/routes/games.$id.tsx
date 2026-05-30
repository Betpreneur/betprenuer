import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type GameDetailResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/games/$id")({
  getStaticParams: () => [],
  head: ({ params }) => ({
    meta: [
      { title: `Game ${params.id} - Betpreneur` },
      { name: "description", content: "Game analysis" },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const [data, setData] = useState<GameDetailResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isAuthed) return;
    api.getGameDetail(Route.useParams().id)
      .then(setData)
      .catch(() => setError(true));
  }, [isAuthed]);

  if (authLoading) return <div className="p-4">Loading...</div>;
  if (error || !data) return <div className="p-4">Failed to load game.</div>;

  const g = data.game;
  return (
    <div className="space-y-4 p-4">
      <header>
        <h1 className="text-xl font-bold">{g.match}</h1>
        <p className="text-sm text-muted-foreground">{g.league} · {g.kickoff}</p>
      </header>
      
      <div className="flex justify-center gap-8">
        <div className="text-center">
          {g.home_logo && <img src={g.home_logo} alt="" className="w-12 h-12 mx-auto" />}
          <div className="font-medium mt-1">{g.home_team}</div>
        </div>
        <div className="text-center text-2xl font-bold text-brand-green">
          {g.home_score ?? "-"} - {g.away_score ?? "-"}
        </div>
        <div className="text-center">
          {g.away_logo && <img src={g.away_logo} alt="" className="w-12 h-12 mx-auto" />}
          <div className="font-medium mt-1">{g.away_team}</div>
        </div>
      </div>

      {g.picks && g.picks.length > 0 && (
        <section>
          <h2 className="font-bold mb-2">Official Picks</h2>
          {g.picks.map((p: any) => (
            <div key={p.id} className="p-3 bg-card rounded border border-brand-border">
              <div className="text-sm font-medium">{p.market}</div>
              <div className="text-lg font-bold text-brand-green">
                {p.odds} @ odds
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {p.tier?.replace("_", " ")} - {p.confidence?.toFixed(0)}% confidence
              </div>
            </div>
          ))}
        </section>
      )}

      {g.insights && (
        <section>
          <h2 className="font-bold mb-2">Insights</h2>
          <div className="p-3 bg-card rounded border border-brand-border text-sm">
            {g.insights}
          </div>
        </section>
      )}
    </div>
  );
}