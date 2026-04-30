import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type TodayPicksResponse, type PickSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { todayLagos } from "@/lib/time";
import { PickCard } from "@/components/PickCard";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Today's picks — Terminal" },
      { name: "description", content: "Today's pre-match picks." },
    ],
  }),
  component: HomePage,
});

function Section({ title, subtitle, picks }: { title: string; subtitle: string; picks: PickSummary[] }) {
  if (picks.length === 0) return null;
  return (
    <section className="space-y-3">
      <div>
        <h2>{title}</h2>
        <p className="text-[12px] text-muted-foreground">{subtitle}</p>
      </div>
      {picks.map((p) => (
        <PickCard key={p.id} pick={p} />
      ))}
    </section>
  );
}

function HomePage() {
  const { isAuthed, loading } = useAuth();
  const [data, setData] = useState<TodayPicksResponse | null>(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    api.getTodayPicks().then(setData).catch(() => setError(true));
  };

  useEffect(() => {
    if (!isAuthed) return;
    load();
  }, [isAuthed]);

  useEffect(() => {
    if (data?.status !== "pending") return;
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [data?.status]);

  if (loading) return null;
  if (!isAuthed) return <Navigate to="/record" />;

  if (error) {
    return (
      <div className="text-center py-16">
        <p>Unable to load picks — tap to retry.</p>
        <button onClick={load} className="mt-4 px-4 py-2 bg-brand-green text-primary-foreground rounded-md">Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 bg-white border border-brand-border rounded animate-pulse" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 bg-white border border-brand-border rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.status === "pending") {
    return (
      <div>
        <p className="text-[14px] text-muted-foreground mb-4">
          Picks arrive today at 06:30 WAT.
        </p>
        <div className="space-y-3 opacity-60">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 bg-white border border-brand-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (data.status === "no_picks" || data.picks.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <h2>No picks today</h2>
        <p className="text-[14px] text-muted-foreground mt-2">
          The model did not find sufficient confidence. Check back tomorrow.
        </p>
      </div>
    );
  }

  const top = data.picks.find((p) => p.is_top_pick);
  const bankers = data.picks.filter((p) => p.tier === "banker" && !p.is_top_pick);
  const gems = data.picks.filter((p) => p.tier === "gem");
  const wildcards = data.picks.filter((p) => p.tier === "wildcard");

  return (
    <div className="space-y-6">
      <p className="text-[13px] text-muted-foreground">
        {todayLagos()} · Picks live · 06:30 WAT
      </p>
      {top && <PickCard pick={top} top />}
      <Section title="Bankers" subtitle="72%+ confidence" picks={bankers} />
      <Section title="Value Gems" subtitle="68–72% confidence" picks={gems} />
      <Section title="Wildcards" subtitle="62–68% confidence" picks={wildcards} />
    </div>
  );
}