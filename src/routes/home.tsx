import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type TodayPicksResponse, type Pick } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { todayLagos } from "@/lib/time";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Today's picks — Betpreneur" },
      { name: "description", content: "Today's pre-match picks." },
      { property: "og:title", content: "Today's picks — Betpreneur" },
      { property: "og:description", content: "Daily football picks with confidence levels." },
    ],
  }),
  component: HomePage,
});

// Helper to get tier color
function getTierColor(tier: string): string {
  switch (tier) {
    case "banker": return "bg-brand-green text-primary-foreground";
    case "value_gem": return "bg-teal-600 text-white";
    case "wild_card": return "bg-purple-600 text-white";
    default: return "bg-gray-600 text-white";
  }
}

// Helper to get confidence color
function getConfidenceColor(confidence: number): string {
  if (confidence >= 72) return "text-win-green";
  if (confidence >= 68) return "text-teal-accent";
  return "text-amber-text";
}

function PickRow({ pick }: { pick: Pick }) {
  return (
    <Link to="/match/$id" params={{ id: String(pick.id) }} className="block">
      <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-4 hover:border-brand-green/50 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getTierColor(pick.tier)}`}>
                {pick.tier?.replace("_", " ") || ""}
              </span>
              <span className="text-[11px] text-muted-foreground">{pick.league}</span>
            </div>
            <h3 className="text-[15px] font-medium leading-tight">{pick.fixture}</h3>
          </div>
          <div className="text-right">
            <div className={`text-[18px] font-bold ${getConfidenceColor(pick.confidence)}`}>
              {pick.confidence?.toFixed(0)}%
            </div>
            <div className="text-[11px] text-muted-foreground">confidence</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="text-[13px]">
            <span className="text-muted-foreground">{pick.market}</span>
            <span className="text-border mx-1">@</span>
            <span className="text-win-green font-medium">{pick.odds ? Number(pick.odds).toFixed(2) : "–"}</span>
          </div>
          <div className="text-[12px] text-muted-foreground">
            {pick.kickoff}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-bold">{title}</h2>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 bg-card border border-brand-border rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-8 text-center">
      <div className="text-4xl mb-3">📭</div>
      <h2 className="text-[18px] font-bold">No picks today</h2>
      <p className="text-[13px] text-muted-foreground mt-2">{message}</p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  // Updated: force redeploy timestamp
  return (
    <div className="bg-gradient-to-br from-danger-bg to-card border border-danger-red/30 rounded-xl p-8 text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <h2 className="text-[18px] font-bold text-danger-red">Unable to load picks</h2>
      <p className="text-[13px] text-muted-foreground mt-2 mb-4">Something went wrong. Please try again.</p>
      <button 
        onClick={onRetry} 
        className="px-6 py-2 bg-brand-green text-primary-foreground font-medium rounded-lg hover:bg-brand-green/90 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function HomePage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const [data, setData] = useState<TodayPicksResponse | null>(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    api.getTodayPicks()
      .then((res) => {
        setData(res);
        // Cache today's picks for detail page lookup
        if (typeof window !== "undefined" && res?.fixtures) {
          const allPicks = res.fixtures.flatMap((f: any) => f.picks || []) || [];
          localStorage.setItem("todaysPicks", JSON.stringify(allPicks));
        }
      })
      .catch(() => setError(true));
  };

  useEffect(() => {
    if (!isAuthed) return;
    load();
  }, [isAuthed]);

  useEffect(() => {
    if (!data?.published) return;
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [data?.published]);

  if (authLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 bg-card border border-brand-border rounded animate-pulse" />
        <LoadingSkeleton />
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/record" />;
  }

  if (error) {
    return (
      <div className="space-y-5">
        <ErrorState onRetry={load} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 bg-card border border-brand-border rounded animate-pulse" />
        <LoadingSkeleton />
      </div>
    );
  }

  // Not published yet
  if (!data.published) {
    return (
      <div className="space-y-5">
        <header className="bg-gradient-to-br from-card to-jet-surface-2 border-2 border-brand-border rounded-xl p-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-text/10 text-amber-text rounded-full mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-text animate-pulse"></span>
            <span className="text-[12px] font-medium">Awaiting picks</span>
          </div>
          <h1 className="text-[22px] font-bold">Picks arriving soon</h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            Our model is analyzing today's matches.<br />Picks go live at 06:30 WAT.
          </p>
        </header>
        
        <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-6">
          <h2 className="text-[14px] font-medium mb-3">How it works</h2>
          <div className="space-y-2 text-[13px] text-muted-foreground">
            <p><span className="text-win-green font-medium">Bankers</span> — 72%+ confidence</p>
            <p><span className="text-teal-accent font-medium">Value Gems</span> — 68-72% confidence</p>
            <p><span className="text-amber-text font-medium">Wildcards</span> — 62-68% confidence</p>
          </div>
        </div>
      </div>
    );
  }

  // Flatten picks from fixtures
  const allPicks = data.fixtures?.flatMap(f => f.picks || []) || [];
  
  if (allPicks.length === 0) {
    return (
      <div className="space-y-5">
        <EmptyState message="The model didn't find sufficient confidence today. Check back tomorrow." />
        
        <Link to="/record" className="block text-center text-info-blue text-[14px] hover:underline">
          📊 See our 90-day track record →
        </Link>
      </div>
    );
  }

  // Categorize picks by tier (cast to string to accommodate data format)
  const t = (p: Pick) => p.tier as unknown as string;
  const topPick = allPicks.find((p) => t(p) === "value_gem" || t(p) === "gem") ?? allPicks[0];
  
  const bankers = allPicks.filter((p) => t(p) === "banker");
  const gems = allPicks.filter((p) => t(p) === "value_gem" || t(p) === "gem");
  const wildcards = allPicks.filter((p) => t(p) === "wild_card" || t(p) === "wildcard");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-muted-foreground">
            {todayLagos()} · Picks live · {data.posted_at || "06:30 WAT"}
          </p>
        </div>
        <div className="text-[12px] text-muted-foreground">
          {data.summary?.selected_pick_count || allPicks.length} picks
        </div>
      </div>

      {topPick && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
            <h2 className="text-[16px] font-bold text-brand-green">Top Pick</h2>
          </div>
          <Link to="/top-pick" className="block" onClick={(e) => { e.preventDefault(); window.location.href = '/top-pick'; }}>
          <button type="button" className="w-full text-left bg-gradient-to-br from-card to-jet-surface-2 border border-brand-green/50 rounded-xl p-4 hover:border-brand-green transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getTierColor(topPick.tier)}`}>
                    {topPick.tier?.replace("_", " ") || ""}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{topPick.league}</span>
                </div>
                <h3 className="text-[15px] font-medium leading-tight">{topPick.fixture}</h3>
              </div>
              <div className="text-right">
                <div className={`text-[18px] font-bold ${getConfidenceColor(topPick.confidence)}`}>
                  {topPick.confidence?.toFixed(0)}%
                </div>
                <div className="text-[11px] text-muted-foreground">confidence</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="text-[13px]">
                <span className="text-muted-foreground">{topPick.market}</span>
                <span className="text-border mx-1">@</span>
                <span className="text-win-green font-medium">{topPick.odds ? Number(topPick.odds).toFixed(2) : "–"}</span>
              </div>
              <div className="text-[12px] text-muted-foreground">
                {topPick.kickoff}
              </div>
            </div>
          </button>
        </Link>
        </section>
      )}

      {bankers.length > 0 && (
        <Section title="Bankers" subtitle="72%+ confidence">
          {bankers.slice(0, 3).map((pick) => (
            <PickRow key={pick.id} pick={pick} />
          ))}
        </Section>
      )}

      {gems.length > 0 && (
        <Section title="Value Gems" subtitle="68-72% confidence">
          {gems.slice(0, 3).map((pick) => (
            <PickRow key={pick.id} pick={pick} />
          ))}
        </Section>
      )}

      {wildcards.length > 0 && (
        <Section title="Wildcards" subtitle="62-68% confidence">
          {wildcards.slice(0, 3).map((pick) => (
            <PickRow key={pick.id} pick={pick} />
          ))}
        </Section>
      )}

      <Link to="/record" className="block text-center text-info-blue text-[14px] hover:underline">
        📊 See our 90-day track record →
      </Link>
    </div>
  );
}