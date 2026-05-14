import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { api, type TodayPicksResponse, type PickSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tierLabel } from "@/lib/stake";
import { formatKickoff, todayLagos } from "@/lib/time";
import { Link } from "@tanstack/react-router";
import { Trophy, ChevronRight, Activity, Target, Zap, CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Betpreneur" },
      { name: "description", content: "Full market scorecard — all games analysed today with confidence scores across every market." },
    ],
  }),
  component: DashboardPage,
});

// Market definitions (all 20 markets)
const MARKETS = [
  { id: "dc_1x", label: "DC: 1X" },
  { id: "dc_x2", label: "DC: X2" },
  { id: "dc_12", label: "DC: 12" },
  { id: "over_1.5", label: "Over 1.5" },
  { id: "over_2.5", label: "Over 2.5" },
  { id: "under_1.5", label: "Under 1.5" },
  { id: "under_2.5", label: "Under 2.5" },
  { id: "under_3.5", label: "Under 3.5" },
  { id: "gg", label: "BTTS Yes" },
  { id: "gg_over2.5", label: "GG + Over 2.5" },
  { id: "ah_home+0.5", label: "AH Home +0.5" },
  { id: "ah_away+0.5", label: "AH Away +0.5" },
  { id: "home_win", label: "Home Win" },
  { id: "away_win", label: "Away Win" },
  { id: "dnb_home", label: "DNB Home" },
  { id: "dnb_away", label: "DNB Away" },
  { id: "home_cs", label: "Home CS" },
  { id: "away_cs", label: "Away CS" },
  { id: "draw", label: "Draw" },
  { id: "first_goal_h", label: "First to Score H" },
  { id: "first_goal_a", label: "First to Score A" },
] as const;

// Quality threshold for green checkmark
const THRESHOLD = 65;

interface GameMarket {
  market_id: string;
  market_label: string;
  confidence: number;
  cleared: boolean;
}

interface GameRow {
  id: string;
  match: string;
  kickoff_wat: string;
  league: string;
  markets: GameMarket[];
}

// Generate mock scorecard data (would come from API in production)
function generateMockScorecard(): GameRow[] {
  const games: GameRow[] = [
    {
      id: "g1",
      match: "Aston Villa vs Liverpool",
      kickoff_wat: new Date().setHours(20, 0, 0, 0).toString(),
      league: "Premier League",
      markets: [
        { market_id: "dc_12", market_label: "DC: 12", confidence: 82, cleared: true },
        { market_id: "over_1.5", market_label: "Over 1.5", confidence: 74, cleared: true },
        { market_id: "under_3.5", market_label: "Under 3.5", confidence: 69, cleared: true },
        { market_id: "dc_x2", market_label: "DC: X2", confidence: 68, cleared: true },
        { market_id: "ah_away+0.5", market_label: "AH Away +0.5", confidence: 68, cleared: true },
        { market_id: "dc_1x", market_label: "DC: 1X", confidence: 65, cleared: true },
        { market_id: "ah_home+0.5", market_label: "AH Home +0.5", confidence: 65, cleared: true },
        { market_id: "first_goal_h", market_label: "First to Score H", confidence: 64, cleared: false },
        { market_id: "away_win", market_label: "Away Win", confidence: 63, cleared: false },
        { market_id: "dnb_away", market_label: "DNB Away", confidence: 63, cleared: false },
        { market_id: "home_win", market_label: "Home Win", confidence: 60, cleared: false },
        { market_id: "dnb_home", market_label: "DNB Home", confidence: 60, cleared: false },
        { market_id: "over_2.5", market_label: "Over 2.5", confidence: 56, cleared: false },
        { market_id: "gg", market_label: "BTTS Yes", confidence: 52, cleared: false },
        { market_id: "gg_over2.5", market_label: "GG + Over 2.5", confidence: 29, cleared: false },
        { market_id: "first_goal_a", market_label: "First to Score A", confidence: 26, cleared: false },
        { market_id: "under_1.5", market_label: "Under 1.5", confidence: 26, cleared: false },
        { market_id: "home_cs", market_label: "Home CS", confidence: 12, cleared: false },
        { market_id: "away_cs", market_label: "Away CS", confidence: 12, cleared: false },
        { market_id: "draw", market_label: "Draw", confidence: 5, cleared: false },
      ],
    },
    {
      id: "g2",
      match: "CF Pachuca vs U.N.A.M. - Pumas",
      kickoff_wat: new Date().setHours(2, 0, 0, 0).toString(),
      league: "Liga MX",
      markets: [
        { market_id: "over_1.5", market_label: "Over 1.5", confidence: 87, cleared: true },
        { market_id: "dc_12", market_label: "DC: 12", confidence: 82, cleared: true },
        { market_id: "over_2.5", market_label: "Over 2.5", confidence: 71, cleared: true },
        { market_id: "gg", market_label: "BTTS Yes", confidence: 62, cleared: false },
        { market_id: "under_3.5", market_label: "Under 3.5", confidence: 61, cleared: false },
        { market_id: "dc_x2", market_label: "DC: X2", confidence: 61, cleared: false },
        { market_id: "ah_away+0.5", market_label: "AH Away +0.5", confidence: 61, cleared: false },
        { market_id: "home_cs", market_label: "Home CS", confidence: 60, cleared: false },
        { market_id: "away_win", market_label: "Away Win", confidence: 56, cleared: false },
        { market_id: "dnb_away", market_label: "DNB Away", confidence: 56, cleared: false },
        { market_id: "dc_1x", market_label: "DC: 1X", confidence: 50, cleared: false },
        { market_id: "ah_home+0.5", market_label: "AH Home +0.5", confidence: 50, cleared: false },
        { market_id: "home_win", market_label: "Home Win", confidence: 45, cleared: false },
        { market_id: "dnb_home", market_label: "DNB Home", confidence: 45, cleared: false },
        { market_id: "gg_over2.5", market_label: "GG + Over 2.5", confidence: 44, cleared: false },
        { market_id: "first_goal_h", market_label: "First to Score H", confidence: 43, cleared: false },
        { market_id: "away_cs", market_label: "Away CS", confidence: 40, cleared: false },
        { market_id: "first_goal_a", market_label: "First to Score A", confidence: 39, cleared: false },
        { market_id: "under_2.5", market_label: "Under 2.5", confidence: 29, cleared: false },
        { market_id: "under_1.5", market_label: "Under 1.5", confidence: 13, cleared: false },
        { market_id: "draw", market_label: "Draw", confidence: 5, cleared: false },
      ],
    },
    {
      id: "g3",
      match: "Real Madrid vs Barcelona",
      kickoff_wat: new Date().setHours(21, 0, 0, 0).toString(),
      league: "La Liga",
      markets: [
        { market_id: "over_1.5", market_label: "Over 1.5", confidence: 91, cleared: true },
        { market_id: "gg", market_label: "BTTS Yes", confidence: 84, cleared: true },
        { market_id: "over_2.5", market_label: "Over 2.5", confidence: 78, cleared: true },
        { market_id: "dc_12", market_label: "DC: 12", confidence: 72, cleared: true },
        { market_id: "gg_over2.5", market_label: "GG + Over 2.5", confidence: 68, cleared: true },
        { market_id: "dc_x2", market_label: "DC: X2", confidence: 66, cleared: true },
        { market_id: "dc_1x", market_label: "DC: 1X", confidence: 64, cleared: false },
        { market_id: "first_goal_h", market_label: "First to Score H", confidence: 62, cleared: false },
        { market_id: "home_win", market_label: "Home Win", confidence: 58, cleared: false },
        { market_id: "dnb_home", market_label: "DNB Home", confidence: 58, cleared: false },
        { market_id: "under_3.5", market_label: "Under 3.5", confidence: 52, cleared: false },
        { market_id: "away_win", market_label: "Away Win", confidence: 48, cleared: false },
        { market_id: "dnb_away", market_label: "DNB Away", confidence: 48, cleared: false },
        { market_id: "ah_home+0.5", market_label: "AH Home +0.5", confidence: 58, cleared: false },
        { market_id: "ah_away+0.5", market_label: "AH Away +0.5", confidence: 48, cleared: false },
        { market_id: "home_cs", market_label: "Home CS", confidence: 42, cleared: false },
        { market_id: "away_cs", market_label: "Away CS", confidence: 28, cleared: false },
        { market_id: "under_2.5", market_label: "Under 2.5", confidence: 22, cleared: false },
        { market_id: "first_goal_a", market_label: "First to Score A", confidence: 21, cleared: false },
        { market_id: "under_1.5", market_label: "Under 1.5", confidence: 9, cleared: false },
        { market_id: "draw", market_label: "Draw", confidence: 8, cleared: false },
      ],
    },
  ];
  return games;
}

function ConfidenceBar({ confidence, cleared }: { confidence: number; cleared: boolean }) {
  const filled = Math.round(confidence / 10);
  const empty = 10 - filled;
  const bar = "█".repeat(filled) + "■".repeat(empty);
  const colorClass = cleared 
    ? "text-brand-green" 
    : confidence >= 50 
      ? "text-amber-500" 
      : "text-muted-foreground/40";
  
  return (
    <span className={`text-[10px] font-mono ${colorClass}`}>
      {bar}
      <span className="text-[9px] ml-0.5">{confidence}%</span>
    </span>
  );
}

function GameCard({ game }: { game: GameRow }) {
  // Group markets into rows of 2 for display
  const marketRows: GameMarket[][] = [];
  for (let i = 0; i < game.markets.length; i += 2) {
    marketRows.push(game.markets.slice(i, i + 2));
  }
  
  return (
    <div className="bg-card border border-brand-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-subtle-bg px-3 py-2 border-b border-brand-border">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] font-medium">{game.match}</span>
            <span className="text-[11px] text-muted-foreground ml-2">{formatKickoff(game.kickoff_wat)}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{game.league}</span>
        </div>
      </div>
      
      {/* Markets grid */}
      <div className="p-3 space-y-1">
        {marketRows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-4">
            {row.map((m) => (
              <div key={m.market_id} className="flex items-center gap-1 flex-1 min-w-0">
                {m.cleared ? (
                  <CheckCircle2 className="w-3 h-3 text-brand-green flex-shrink-0" />
                ) : (
                  <Circle className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
                )}
                <span className="text-[10px] text-muted-foreground truncate">{m.market_label}</span>
                <ConfidenceBar confidence={m.confidence} cleared={m.cleared} />
              </div>
            ))}
            {row.length === 1 && <div className="flex-1" />}
          </div>
        ))}
      </div>
      
      {/* View picks link */}
      <div className="border-t border-brand-border px-3 py-2">
        <Link
          to="/match/$id"
          params={{ id: game.id }}
          className="text-[11px] text-brand-green hover:underline flex items-center gap-1"
        >
          View picks for this match <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { isAuthed, loading } = useAuth();
  const [games] = useState<GameRow[]>(generateMockScorecard); // Would fetch from API
  
  if (loading) return null;
  if (!isAuthed) return <Navigate to="/record" />;

  const clearedCount = games.reduce((sum, g) => sum + g.markets.filter(m => m.cleared).length, 0);
  const totalMarkets = games.length * 20;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card border border-brand-border rounded-lg p-4">
        <h1 className="text-[16px] font-semibold">FULL MARKET SCORECARD</h1>
        <p className="text-[12px] text-muted-foreground mt-1">
          All games analysed today — {games.length} fixtures, {totalMarkets} markets
        </p>
        <p className="text-[11px] text-muted-foreground mt-2">
          Markets highlighted with <CheckCircle2 className="w-3 h-3 inline text-brand-green" /> have cleared 
          their quality threshold ({THRESHOLD}%). Use this section to do your own research.
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
        <span>{clearedCount}/{totalMarkets} markets cleared threshold</span>
        <span>·</span>
        <span>Updated: {todayLagos()}</span>
      </div>

      {/* Games list */}
      <div className="space-y-4">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {/* Footer */}
      <p className="text-[11px] text-muted-foreground text-center py-4">
        This scorecard is provided for transparency — you can see exactly how each game was evaluated by the algorithm.
      </p>
    </div>
  );
}