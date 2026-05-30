import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/games")({
  component: Page,
});

function Page() {
  const { isAuthed, loading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const pathname = window.location.pathname;
    const match = pathname.match(/\/games\/(\d+)/);
    const gameId = match ? match[1] : null;
    if (!gameId || !isAuthed) return;
    api.getGameDetail(gameId).then(setData).catch(() => setError(true));
  }, [isAuthed]);

  if (loading || !data) return <div>Loading...</div>;
  const g = data.game;
  return (
    <div className="p-4">
      <h1>{g.match}</h1>
      <p>{g.league} - {g.kickoff}</p>
      <div style={{display:"flex",justifyContent:"center",gap:20,padding:20}}>
        <div>{g.home_logo&&<img src={g.home_logo}width={48}/>}<div>{g.home_team}</div></div>
        <strong style={{fontSize:24}}>{g.home_score??0}-{g.away_score??0}</strong>
        <div>{g.away_logo&&<img src={g.away_logo}width={48}/>}<div>{g.away_team}</div></div>
      </div>
      {g.picks?.map((p,i)=><div key={i}>{p.market} @ {p.odds}</div>)}
    </div>
  );
}