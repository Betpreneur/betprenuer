import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/games/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Game ${params.id} - Betpreneur` }],
  }),
  component: GamePage,
});

function GamePage({ params }: { params: { id: string } }) {
  const { isAuthed, loading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isAuthed || !params?.id) return;
    api.getGameDetail(params.id).then(setData).catch(() => setError(true));
  }, [isAuthed, params?.id]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error || !data) return <div className="p-4">Load failed.</div>;

  const g = data.game;
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">{g.match}</h1>
      <p className="text-sm text-muted-foreground">{g.league} · {g.kickoff}</p>
      
      <div className="flex justify-center gap-8 py-4">
        <div className="text-center">
          {g.home_logo && <img src={g.home_logo} alt="" className="w-12 h-12 mx-auto" />}
          <div className="font-medium">{g.home_team}</div>
        </div>
        <div className="text-2xl font-bold text-brand-green">
          {g.home_score ?? 0} - {g.away_score ?? 0}
        </div>
        <div className="text-center">
          {g.away_logo && <img src={g.away_logo} alt="" className="w-12 h-12 mx-auto" />}
          <div className="font-medium">{g.away_team}</div>
        </div>
      </div>

      {g.picks?.length > 0 && (
        <section>
          <h2 className="font-bold">Picks</h2>
          {g.picks.map((p: any, i: number) => (
            <div key={i} className="p-3 bg-card rounded border border-brand-border">
              <div>{p.market}</div>
              <div className="font-bold text-brand-green">{p.odds}</div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}