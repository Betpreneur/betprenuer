import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type TopPickResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tierLabel } from "@/lib/stake";
import { formatKickoff } from "@/lib/time";
import { StakeGuide } from "@/components/StakeGuide";

export const Route = createFileRoute("/top-pick")({
  head: () => ({
    meta: [
      { title: "Today's top pick — Terminal" },
      { name: "description", content: "The single highest-confidence football pick today." },
      { property: "og:title", content: "Today's top pick — Terminal" },
      { property: "og:description", content: "Highest-confidence pre-match pick. Subscribers see the full reasoning." },
    ],
  }),
  component: TopPickPage,
});

function TopPickPage() {
  const { loading } = useAuth();
  const [data, setData] = useState<TopPickResponse | null>(null);

  useEffect(() => {
    api.getTopPick().then(setData).catch(() => setData(null));
  }, []);

  if (loading || !data) {
    return <div className="h-64 bg-white border border-brand-border rounded-lg animate-pulse" />;
  }

  if (data.locked) {
    return (
      <div className="space-y-5">
        <header className="bg-white border-2 border-brand-green rounded-lg p-5">
          <div className="text-[11px] uppercase tracking-wide text-brand-green font-semibold mb-1">
            Best pick today
          </div>
          <h1 className="!text-[20px] !leading-tight">{data.match}</h1>
          <div className="text-[13px] text-muted-foreground mt-1">{formatKickoff(data.kickoff_wat)}</div>
          <div className="mt-3 inline-block bg-brand-green-light text-brand-green text-[14px] font-medium px-3 py-1.5 rounded">
            {data.market_plain}
          </div>
          <div className="mt-3 text-[13px] text-muted-foreground">
            Confidence: <span className="font-medium text-brand-green">{data.confidence.toFixed(1)}%</span>
          </div>
        </header>

        <div className="bg-white border border-brand-border rounded-lg p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-subtle-bg flex items-center justify-center text-brand-green text-xl">🔒</div>
          <h2 className="mt-3">Full analysis and stake guide</h2>
          <p className="text-[14px] text-muted-foreground mt-1">Subscribers only.</p>
          <Link
            to="/signup"
            className="mt-4 inline-block w-full bg-brand-green text-primary-foreground font-medium py-3 rounded-md"
          >
            Subscribe — ₦3,000/month
          </Link>
        </div>

        <Link to="/record" className="block text-center text-info-blue text-[14px] underline">
          See our 90-day track record before subscribing →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="bg-white border-2 border-brand-green rounded-lg p-5">
        <div className="text-[11px] uppercase tracking-wide text-brand-green font-semibold mb-1">
          Best pick today
        </div>
        <h1 className="!text-[20px] !leading-tight">{data.match}</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">{data.league} · {formatKickoff(data.kickoff_wat)}</p>
        <div className="mt-3 inline-block bg-brand-green-light text-brand-green text-[14px] font-medium px-3 py-1.5 rounded">
          {data.market_plain}
        </div>
        <p className="italic text-[14px] text-body-text mt-3">{data.one_line_reason}</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-2 bg-subtle-bg rounded-full overflow-hidden">
            <div className="h-full bg-brand-green" style={{ width: `${Math.min(100, data.confidence)}%` }} />
          </div>
          <span className="text-brand-green font-medium">{data.confidence.toFixed(1)}%</span>
        </div>
        <div className="mt-3 text-[12px] text-muted-foreground">{tierLabel(data.tier)} · Odds {data.odds.toFixed(2)}</div>
      </header>

      <section className="bg-white border border-brand-border rounded-lg p-5">
        <h2 className="mb-3">Why this pick</h2>
        <ul className="space-y-2 text-[14px] text-body-text">
          {data.goals_profile.map((g, i) => (
            <li key={i} className="flex gap-2"><span className="text-brand-green">•</span><span>{g}</span></li>
          ))}
        </ul>
      </section>

      {data.risk_flag && (
        <div className="bg-amber-bg rounded-lg p-4">
          <div className="text-[12px] uppercase tracking-wide text-amber-text font-semibold mb-1">Watch out</div>
          <p className="text-[14px] text-amber-text">{data.risk_flag}</p>
        </div>
      )}

      <section className="bg-info-bg rounded-lg p-5">
        <h2 className="mb-2 !text-info-blue">Model verdict</h2>
        <p className="italic text-[14px] text-info-blue">{data.model_verdict}</p>
      </section>

      <StakeGuide odds={data.odds} highlight={data.tier} />

      <Link
        to="/match/$id"
        params={{ id: data.id }}
        className="block text-center bg-brand-green text-primary-foreground font-medium py-3 rounded-md"
      >
        Open full match card
      </Link>
    </div>
  );
}