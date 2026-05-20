import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type TopPickResponse, type Pick } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tierLabel } from "@/lib/stake";
import { StakeGuide } from "@/components/StakeGuide";

export const Route = createFileRoute("/top-pick")({
  head: () => ({
    meta: [
      { title: "Today's top pick � Betpreneur" },
      { name: "description", content: "The single highest-confidence football pick today." },
      { property: "og:title", content: "Today's top pick � Betpreneur" },
      { property: "og:description", content: "Highest-confidence pre-match pick. Subscribers see the full reasoning." },
    ],
  }),
  component: TopPickPage,
});

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    banker: "bg-brand-green text-primary-foreground",
    value_gem: "bg-teal-600 text-white",
    wild_card: "bg-purple-600 text-white",
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${colors[tier] || "bg-gray-600 text-white"}`}>
      {tier?.replace("_", " ") || ""}
    </span>
  );
}

function TopPickPage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const [data, setData] = useState<TopPickResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTopPick()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (authLoading || loading || !data) {
    return <div className="h-64 bg-card border border-brand-border rounded-lg animate-pulse" />;
  }

  const pick = data.pick;

  // No pick published yet
  if (!data.published || !pick) {
    return (
      <div className="space-y-5">
        <header className="bg-card border-2 border-brand-border rounded-lg p-5">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
            Top pick
          </div>
          <h1 className="!text-[20px] !leading-tight">No pick published yet</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Check back later for today's top pick.
          </p>
        </header>
      </div>
    );
  }

  // Show pick - locked for visitors, unlocked for authed users
  const showFullDetails = isAuthed;

  return (
    <div className="space-y-5">
      <header className="bg-card border-2 border-brand-green rounded-lg p-5">
        <div className="text-[11px] uppercase tracking-wide text-brand-green font-semibold mb-1">
          Best pick today
        </div>
        <h1 className="!text-[20px] !leading-tight">{pick.fixture}</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">{pick.league}</p>
        
        <div className="mt-3 inline-block bg-brand-green-light text-brand-green text-[14px] font-medium px-3 py-1.5 rounded">
          {pick.market} @ {pick.odds ? Number(pick.odds).toFixed(2) : "–"}
        </div>
        
        <div className="mt-3">
          <TierBadge tier={pick.tier} />
        </div>
        
        <div className="mt-3 text-[13px] text-muted-foreground">
          Confidence: <span className="font-medium text-brand-green">{pick.confidence?.toFixed(1)}%</span>
        </div>
      </header>

      {showFullDetails ? (
        <>
          {pick.model_verdict && (
            <div className="bg-card border border-brand-border rounded-lg p-4">
              <h3 className="text-[14px] font-medium mb-2">Model Verdict</h3>
              <p className="text-[14px] text-muted-foreground">{pick.model_verdict}</p>
            </div>
          )}

          {pick.home_recent_form && pick.home_recent_form.length > 0 && (
            <div className="bg-card border border-brand-border rounded-lg p-4">
              <h3 className="text-[14px] font-medium mb-2">Home Form</h3>
              <div className="flex gap-1">
                {pick.home_recent_form.map((r, i) => (
                  <span key={i} className={`w-6 h-6 rounded text-[11px] font-medium flex items-center justify-center ${
                    r === "W" ? "bg-win-green text-white" : r === "D" ? "bg-draw-yellow text-black" : "bg-danger-red text-white"
                  }`}>{r}</span>
                ))}
              </div>
            </div>
          )}

          {pick.away_recent_form && pick.away_recent_form.length > 0 && (
            <div className="bg-card border border-brand-border rounded-lg p-4">
              <h3 className="text-[14px] font-medium mb-2">Away Form</h3>
              <div className="flex gap-1">
                {pick.away_recent_form.map((r, i) => (
                  <span key={i} className={`w-6 h-6 rounded text-[11px] font-medium flex items-center justify-center ${
                    r === "W" ? "bg-win-green text-white" : r === "D" ? "bg-draw-yellow text-black" : "bg-danger-red text-white"
                  }`}>{r}</span>
                ))}
              </div>
            </div>
          )}

          <StakeGuide confidence={pick.confidence} />

          {pick.status && (
            <div className="bg-card border border-brand-border rounded-lg p-4 text-center">
              <span className={`text-[14px] font-medium ${
                pick.status === "win" ? "text-win-green" :
                pick.status === "loss" ? "text-danger-red" :
                pick.status === "void" ? "text-muted-foreground" :
                "text-amber-500"
              }`}>
                {pick.status === "pending" ? "? Pending" :
                 pick.status === "win" ? "? Won" :
                 pick.status === "loss" ? "? Lost" :
                 "? Voided"}
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="bg-card border border-brand-border rounded-lg p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-subtle-bg flex items-center justify-center text-brand-green text-xl">??</div>
          <h2 className="mt-3">Full analysis and stake guide</h2>
          <p className="text-[14px] text-muted-foreground mt-1">Sign up (free) to access the Top Pick page and see all picks.</p>
          <Link to="/signup" className="mt-4 inline-block w-full bg-brand-green text-primary-foreground font-medium py-3 rounded-md">
            Sign up � free
          </Link>
        </div>
      )}

      <Link to="/record" className="block text-center text-info-blue text-[14px] underline">
        See our 90-day track record ?
      </Link>
    </div>
  );
}
