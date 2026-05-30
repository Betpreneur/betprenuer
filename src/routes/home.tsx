import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type TodayPicksResponse, type Pick } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { todayLagos } from "@/lib/time";

// Routing config
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

// ============================================================
// Helper Functions
// ============================================================

function getTierColor(tier: string): string {
  switch (tier) {
    case "banker": return "bg-brand-green text-primary-foreground";
    case "value_gem": return "bg-teal-600 text-white";
    case "wild_card": return "bg-purple-600 text-white";
    default: return "bg-gray-600 text-white";
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 72) return "text-win-green";
  if (confidence >= 68) return "text-teal-accent";
  return "text-amber-text";
}

// ============================================================
// Components
// ============================================================

function PickRow({ pick }: { pick: Pick }) {
  return (
    <Link to="/match/$id" params={{ id: String(pick.id) }} className="block group">
      <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-4 hover:border-brand-green/50 hover:shadow-lg hover:shadow-brand-green/10 transition-all duration-300 hover:-translate-y-0.5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getTierColor(pick.tier)}`}>
                {pick.tier?.replace("_", " ") || ""}
              </span>
              <span className="text-[11px] text-muted-foreground">{pick.league}</span>
            </div>
            <h3 className="text-[15px] font-medium leading-tight group-hover:text-white/90 transition-colors">{pick.fixture}</h3>
          </div>
          <div className="text-right">
            <div className={`text-[18px] font-bold ${getConfidenceColor(pick.confidence)} group-hover:scale-110 transition-transform`}>
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
          <div className="text-[12px] text-muted-foreground flex items-center gap-1">
            {pick.kickoff}
            <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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
    <div className="space-y-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-card rounded animate-pulse" />
            <div className="h-4 w-16 bg-card rounded animate-pulse" />
          </div>
          <div className="h-28 bg-card border border-brand-border rounded-xl animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-2xl p-8 text-center">
      <div className="relative w-20 h-20 mx-auto mb-4">
        <div className="absolute inset-0 bg-muted-foreground/10 rounded-full animate-pulse"></div>
        <div className="relative flex items-center justify-center w-full h-full text-4xl">
          📭
        </div>
      </div>
      <h2 className="text-[20px] font-bold mb-2">No Picks Today</h2>
      <p className="text-[14px] text-muted-foreground mb-6">{message}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/record" className="px-4 py-2 bg-info-blue/10 text-info-blue rounded-lg text-[13px] font-medium hover:bg-info-blue/20 transition-colors">
          📊 View Track Record
        </Link>
        <Link to="/settings" className="px-4 py-2 bg-muted/20 text-muted-foreground rounded-lg text-[13px] font-medium hover:bg-muted/30 transition-colors">
          ⚙️ Adjust Preferences
        </Link>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
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

// ============================================================
// Main Page Component
// ============================================================

function HomePage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const [data, setData] = useState<TodayPicksResponse | null>(null);
  const [topPickData, setTopPickData] = useState<Pick | null>(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    Promise.all([
      api.getTodayPicks(),
      api.getTopPick().catch(() => null)
    ])
      .then(([picksRes, topPickRes]) => {
        setData(picksRes);
        setTopPickData(topPickRes?.pick || null);
        
        if (typeof window !== "undefined" && picksRes?.fixtures) {
          const allPicks = picksRes.fixtures.flatMap((f: any) => f.picks || []) || [];
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

  if (!data.published) {
    return (
      <div className="space-y-6">
        <header className="relative overflow-hidden bg-gradient-to-br from-card to-jet-surface-2 border-2 border-brand-border rounded-2xl p-8 text-center">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-brand-green/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-teal-accent/20 rounded-full blur-3xl animate-pulse delay-700"></div>
          </div>
          
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-text/10 text-amber-text rounded-full mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-text opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-text"></span>
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-wide">Awaiting Picks</span>
            </div>
            
            <h1 className="text-[26px] font-bold mb-2">Picks Arriving Soon</h1>
            <p className="text-[15px] text-muted-foreground mb-6 max-w-sm mx-auto">
              Our AI model is analyzing today's matches.<br />
              Daily picks go live at <span className="text-brand-green font-semibold">06:30 WAT</span>.
            </p>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[14px] font-medium text-white/80">06:30</span>
              <span className="text-[11px] text-muted-foreground">(GMT+1)</span>
            </div>
          </div>
        </header>

        <EmptyState message="Check back around 06:30 WAT for your daily picks." />
      </div>
    );
  }

  // Group picks by tier
  const fixtures = data.fixtures || [];
  const bankerPicks = fixtures.flatMap(f => f.picks?.filter((p: Pick) => p.tier === "banker") || []);
  const valuePicks = fixtures.flatMap(f => f.picks?.filter((p: Pick) => p.tier === "value_gem") || []);
  const wildPicks = fixtures.flatMap(f => f.picks?.filter((p: Pick) => p.tier === "wild_card") || []);

  const hasAnyPicks = bankerPicks.length > 0 || valuePicks.length > 0 || wildPicks.length > 0;

  if (!hasAnyPicks) {
    return (
      <div className="space-y-5">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Today's Picks</h1>
            <p className="text-sm text-muted-foreground">{todayLagos()}</p>
          </div>
        </header>
        <EmptyState message="No picks published for today. Check back tomorrow!" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Today's Picks</h1>
          <p className="text-sm text-muted-foreground">{todayLagos()}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {bankerPicks.length + valuePicks.length + wildPicks.length} picks
        </div>
      </header>

      {/* Tier Sections */}
      {bankerPicks.length > 0 && (
        <Section title="Bankers" subtitle={`${bankerPicks.length} highconfidence picks`}>
          {bankerPicks.map(pick => (
            <PickRow key={pick.id} pick={pick} />
          ))}
        </Section>
      )}

      {valuePicks.length > 0 && (
        <Section title="Value Gems" subtitle={`${valuePicks.length} upset potential`}>
          {valuePicks.map(pick => (
            <PickRow key={pick.id} pick={pick} />
          ))}
        </Section>
      )}

      {wildPicks.length > 0 && (
        <Section title="Wild Cards" subtitle={`${wildPicks.length} long shots`}>
          {wildPicks.map(pick => (
            <PickRow key={pick.id} pick={pick} />
          ))}
        </Section>
      )}
    </div>
  );
}