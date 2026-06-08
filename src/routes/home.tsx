import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type AlgoGamesResponse, type GameInfo } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { todayLagos } from "@/lib/time";
import { HomePageSkeleton } from "@/components/skeletons";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Today's Games — Betpreneur" },
      { name: "description", content: "All covered games today." },
      { property: "og:title", content: "Today's Games — Betpreneur" },
      { property: "og:description", content: "All covered games with analysis." },
    ],
  }),
  component: HomePage,
});

function tierMeta(tier?: string) {
  switch (tier) {
    case "banker":
      return { label: "Banker", icon: "⭐", cls: "bg-win-green/20 text-win-green border-win-green/40" };
    case "gem":
    case "value_gem":
      return { label: "Gem", icon: "💎", cls: "bg-teal-500/20 text-teal-400 border-teal-500/40" };
    case "wild_card":
      return { label: "Wild Card", icon: "🎲", cls: "bg-amber-500/20 text-amber-400 border-amber-500/40" };
    default:
      return null;
  }
}

function confColor(c: number) {
  return c >= 80 ? "#22c55e" : c >= 70 ? "#3b82f6" : c >= 60 ? "#eab308" : "#ef4444";
}

function GameCard({ game }: { game: GameInfo }) {
  const isLive = game.status === "live" || game.home_score != null;
  const isBacked = Boolean((game as any).backed_by_me || game.official_pick?.backed_by_me);
  const tier = tierMeta(game.official_pick?.tier);

  const sel = game.official_pick?.selection || game.official_pick?.market;
  const pick = sel
    ? { label: "Official Pick", market: sel, odds: game.official_pick!.odds, confidence: game.official_pick!.confidence, accent: "text-brand-green" }
    : game.top_market
      ? { label: "Top Market", market: game.top_market.market, odds: game.top_market.odds, confidence: game.top_market.confidence, accent: "text-info-blue" }
      : null;

  return (
    <Link to="/match/$id" params={{ id: game.match_id }} className="group block">
      <article
        className={`relative h-full flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-card to-jet-surface-2 border transition-all duration-200
        ${isLive ? "border-danger-red/50 shadow-[0_0_22px_-6px_rgba(239,68,68,0.5)]" : "border-brand-border hover:border-brand-green/60 hover:shadow-[0_10px_30px_-12px_rgba(34,197,94,0.35)] hover:-translate-y-0.5"}`}
      >
        {/* Status strip */}
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-brand-green/10 text-brand-green border border-brand-green/25">
            {game.country_flag && <img src={game.country_flag} alt="" className="w-3.5 h-3.5 rounded-full object-contain" />}
            {(game.competition_logo || game.league_logo) && !game.country_flag && (
              <img src={game.competition_logo || game.league_logo || undefined} alt="" className="w-3.5 h-3.5 object-contain" />
            )}
            <span className="truncate max-w-[120px]">{game.league}</span>
          </span>
          {isLive ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-danger-red">
              <span className="w-1.5 h-1.5 rounded-full bg-danger-red animate-pulse" /> Live
            </span>
          ) : isBacked ? (
            <span className="text-[10px] font-bold uppercase text-win-green">✓ Backed</span>
          ) : tier ? (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${tier.cls}`}>
              {tier.icon} {tier.label}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-muted-foreground">{game.kickoff}</span>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <div className="flex-1 min-w-0 text-center">
            {game.home_logo && <img src={game.home_logo} alt="" className="w-11 h-11 mx-auto mb-1.5 object-contain" />}
            <div className="text-[13px] font-bold leading-tight truncate group-hover:text-brand-green transition-colors">{game.home_team}</div>
          </div>
          <div className="shrink-0 text-center">
            {game.home_score != null ? (
              <div className="text-2xl font-black tracking-wider">{game.home_score}<span className="text-muted-foreground/50 mx-1">:</span>{game.away_score}</div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand-green/10 border border-brand-green/30 flex items-center justify-center text-[11px] font-black text-brand-green">VS</div>
            )}
          </div>
          <div className="flex-1 min-w-0 text-center">
            {game.away_logo && <img src={game.away_logo} alt="" className="w-11 h-11 mx-auto mb-1.5 object-contain" />}
            <div className="text-[13px] font-bold leading-tight truncate group-hover:text-brand-green transition-colors">{game.away_team}</div>
          </div>
        </div>

        {/* Pick footer */}
        <div className="mt-auto px-4 pb-4">
          {pick ? (
            <div className="rounded-xl bg-background/40 border border-brand-border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{pick.label}</div>
                  <div className="text-[13px] font-bold truncate">{pick.market}</div>
                </div>
                <div className={`text-lg font-black shrink-0 ${pick.accent}`}>@{Number(pick.odds).toFixed(2)}</div>
              </div>
              {pick.confidence ? (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(pick.confidence, 100)}%`, backgroundColor: confColor(pick.confidence) }} />
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: confColor(pick.confidence) }}>{Number(pick.confidence).toFixed(0)}%</span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl bg-background/30 border border-brand-border p-3 text-center text-[11px] text-muted-foreground">Tap for full analysis</div>
          )}
        </div>
      </article>
    </Link>
  );
}

// Confidence filter ranges
const CONFIDENCE_RANGES = [
  { label: "80%+", min: 80, max: 100 },
  { label: "70-79%", min: 70, max: 79 },
  { label: "65-69%", min: 65, max: 69 },
  { label: "Below 65%", min: 0, max: 64 },
];

type FilterType = "league" | "market" | "confidence";

function HomePage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const [data, setData] = useState<AlgoGamesResponse | null>(null);
  const [error, setError] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("league");
  const [filterValue, setFilterValue] = useState("All");

  const load = () => {
    setError(false);
    api.getAlgoGames().then(setData).catch(() => setError(true));
  };

  useEffect(() => {
    if (!isAuthed) return;
    load();
  }, [isAuthed]);

  useEffect(() => {
    if (!data?.published) return;
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [data?.published]);

  if (authLoading || !data) return <HomePageSkeleton />;
  if (error) return <div className="p-8 text-center text-muted-foreground">Failed to load games.</div>;

  const games = data.games || [];

  if (!data.published) {
    return (
      <div className="p-10 text-center">
        <div className="text-4xl mb-3">⏳</div>
        <h1 className="text-xl font-black mb-1">Waiting for Games</h1>
        <p className="text-muted-foreground">Games announced soon</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="p-10 text-center">
        <div className="text-4xl mb-3">⚽</div>
        <h1 className="text-xl font-black mb-1">No Games Today</h1>
        <p className="text-muted-foreground">Check back later</p>
      </div>
    );
  }

  // Extract unique leagues
  const leagues = ["All", ...new Set(games.map((g) => g.league))];

  // Extract unique markets from API
  const markets = ["All", ...new Set(games.flatMap((g) => {
    const m: string[] = [];
    if (g.official_pick?.market) m.push(g.official_pick.market);
    if (g.top_market?.market && g.official_pick?.market !== g.top_market.market) m.push(g.top_market.market);
    return m;
  }))];

  // Confidence filter options
  const confidenceFilters = ["All", ...CONFIDENCE_RANGES.map((r) => r.label)];

  // Determine current filter options based on type
  const currentFilters = filterType === "league" ? leagues : filterType === "market" ? markets : confidenceFilters;

  // Apply filtering
  const filteredGames = games.filter((g) => {
    if (filterValue === "All") return true;
    if (filterType === "league") return g.league === filterValue;
    if (filterType === "market") {
      const gameMarkets = [];
      if (g.official_pick?.market) gameMarkets.push(g.official_pick.market);
      if (g.top_market?.market) gameMarkets.push(g.top_market.market);
      return gameMarkets.includes(filterValue);
    }
    if (filterType === "confidence") {
      const confRange = CONFIDENCE_RANGES.find((r) => r.label === filterValue);
      if (!confRange) return true;
      const conf = g.official_pick?.confidence ?? g.top_market?.confidence ?? 0;
      return conf >= confRange.min && conf <= confRange.max;
    }
    return true;
  });

  const liveCount = games.filter((g) => g.status === "live" || g.home_score != null).length;

  return (
    <div className="space-y-5">
      {/* Hero header */}
      <header className="relative overflow-hidden rounded-2xl border border-brand-border bg-gradient-to-br from-card via-card to-brand-green/10 p-5">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-brand-green/10 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">⚽ Today's Games</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">{todayLagos()}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-brand-green/15 text-brand-green border border-brand-green/30">
              🎯 {games.length} matches
            </span>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-danger-red/15 text-danger-red border border-danger-red/30">
                <span className="w-1.5 h-1.5 rounded-full bg-danger-red animate-pulse" /> {liveCount} live
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Filter row with single dropdown */}
      <div className="flex items-center gap-3">
        {/* Single dynamic filter dropdown */}
        <Select.Root value={`${filterType}:${filterValue}`} onValueChange={(v) => {
          const [type, value] = v.split(":");
          setFilterType(type as FilterType);
          setFilterValue(value);
        }}>
          <Select.Trigger className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold bg-card border border-brand-border text-foreground hover:border-brand-green/50 transition-colors min-w-[120px]">
            <Select.Value placeholder="Filter" />
            <Select.Icon asChild>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="overflow-hidden bg-popover border rounded-lg shadow-lg z-50 max-h-[400px]">
              <Select.Viewport className="p-1">
                {/* League section */}
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-muted-foreground">League</div>
                {leagues.map((f) => (
                  <Select.Item key={`league:${f}`} value={`league:${f}`} className="relative flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer select-none outline-none hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                    <Select.ItemText className="flex items-center gap-2">
                      {f !== "All" ? (() => {
                        const lg = games.find((g) => g.league === f);
                        const logo = lg?.competition_logo || lg?.league_logo;
                        const flag = lg?.country_flag;
                        return (
                          <>
                            {flag && <img src={flag} alt="" className="w-4 h-4 rounded-full object-contain" />}
                            {logo && !flag && <img src={logo} alt="" className="w-4 h-4 rounded-full object-contain" />}
                            {f}
                          </>
                        );
                      })() : f}
                    </Select.ItemText>
                    <Select.ItemIndicator className="ml-auto">
                      <Check className="w-3.5 h-3.5 text-brand-green" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
                {/* Market section */}
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-muted-foreground">Market</div>
                {markets.map((f) => (
                  <Select.Item key={`market:${f}`} value={`market:${f}`} className="relative flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer select-none outline-none hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                    <Select.ItemText>{f}</Select.ItemText>
                    <Select.ItemIndicator className="ml-auto">
                      <Check className="w-3.5 h-3.5 text-brand-green" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
                {/* Confidence section */}
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-muted-foreground">Confidence</div>
                {confidenceFilters.map((f) => (
                  <Select.Item key={`confidence:${f}`} value={`confidence:${f}`} className="relative flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer select-none outline-none hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                    <Select.ItemText>{f}</Select.ItemText>
                    <Select.ItemIndicator className="ml-auto">
                      <Check className="w-3.5 h-3.5 text-brand-green" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        {/* Filter chips scroll */}
        <div className="flex-1 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {currentFilters.map((f) => {
            const active = filterValue === f;
            return (
              <button
                key={f}
                onClick={() => setFilterValue(f)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all",
                  active
                    ? "bg-brand-green text-primary-foreground shadow-[0_4px_14px_-4px_rgba(34,197,94,0.6)]"
                    : "bg-card border border-brand-border text-muted-foreground hover:border-brand-green/50 hover:text-foreground"
                )}
              >
                {filterType === "league" && f !== "All" ? (
                  (() => {
                    const lg = games.find((g) => g.league === f);
                    const logo = lg?.competition_logo || lg?.league_logo;
                    const flag = lg?.country_flag;
                    return (
                      <>
                        {flag && <img src={flag} alt="" className="w-4 h-4 rounded-full object-contain" />}
                        {logo && !flag && <img src={logo} alt="" className="w-4 h-4 rounded-full object-contain" />}
                        {f}
                      </>
                    );
                  })()
                ) : (
                  f
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Games grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
