import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { api, type TodayPicksResponse, type PickSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tierLabel } from "@/lib/stake";
import { formatKickoff, todayLagos } from "@/lib/time";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, ChevronRight, TrendingUp, Activity, Calendar } from "lucide-react";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Dashboard — Betpreneur" },
      { name: "description", content: "Full market scorecard — all games analysed today with confidence scores across every market." },
    ],
  }),
  component: DashboardPage,
});

// Quality thresholds
const HIGH_THRESHOLD = 70;
const LOW_THRESHOLD = 50;
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

// Generate mock scorecard data
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
    {
      id: "g4",
      match: " PSG vs Monaco",
      kickoff_wat: new Date().setHours(20, 45, 0, 0).toString(),
      league: "Ligue 1",
      markets: [
        { market_id: "gg", market_label: "BTTS Yes", confidence: 89, cleared: true },
        { market_id: "over_1.5", market_label: "Over 1.5", confidence: 85, cleared: true },
        { market_id: "over_2.5", market_label: "Over 2.5", confidence: 73, cleared: true },
        { market_id: "dc_12", market_label: "DC: 12", confidence: 70, cleared: true },
        { market_id: "home_win", market_label: "Home Win", confidence: 66, cleared: true },
        { market_id: "dnb_home", market_label: "DNB Home", confidence: 66, cleared: true },
        { market_id: "first_goal_h", market_label: "First to Score H", confidence: 64, cleared: false },
        { market_id: "gg_over2.5", market_label: "GG + Over 2.5", confidence: 61, cleared: false },
        { market_id: "ah_home-1.5", market_label: "AH Home -1.5", confidence: 58, cleared: false },
        { market_id: "under_3.5", market_label: "Under 3.5", confidence: 55, cleared: false },
        { market_id: "dc_x2", market_label: "DC: X2", confidence: 52, cleared: false },
        { market_id: "dc_1x", market_label: "DC: 1X", confidence: 48, cleared: false },
        { market_id: "away_win", market_label: "Away Win", confidence: 42, cleared: false },
        { market_id: "dnb_away", market_label: "DNB Away", confidence: 42, cleared: false },
        { market_id: "home_cs", market_label: "Home CS", confidence: 38, cleared: false },
        { market_id: "away_cs", market_label: "Away CS", confidence: 18, cleared: false },
        { market_id: "under_2.5", market_label: "Under 2.5", confidence: 27, cleared: false },
        { market_id: "first_goal_a", market_label: "First to Score A", confidence: 18, cleared: false },
        { market_id: "under_1.5", market_label: "Under 1.5", confidence: 15, cleared: false },
        { market_id: "draw", market_label: "Draw", confidence: 12, cleared: false },
      ],
    },
  ];
  return games;
}

function ConfidenceBar({ confidence, cleared }: { confidence: number; cleared: boolean }) {
  let barColor = "bg-muted";
  let textColor = "text-muted-foreground";
  let glow = "";
  
  if (confidence >= HIGH_THRESHOLD) {
    barColor = "bg-green-500";
    textColor = "text-green-400";
    glow = "shadow-[0_0_8px_rgba(34,197,94,0.4)]";
  } else if (confidence >= THRESHOLD) {
    barColor = "bg-brand-green";
    textColor = "text-brand-green";
  } else if (confidence >= LOW_THRESHOLD) {
    barColor = "bg-amber-500";
    textColor = "text-amber-400";
  } else {
    barColor = "bg-red-500/60";
    textColor = "text-red-400/70";
  }
  
  return (
    <div className="flex items-center gap-2 min-w-[100px] md:min-w-[140px]">
      <div className="flex-1 h-1.5 md:h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColor} rounded-full transition-all duration-500 ${glow}`} 
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className={`text-[10px] md:text-[11px] font-semibold ${textColor} w-8 md:w-10 text-right`}>
        {confidence}%
      </span>
    </div>
  );
}

function GameCard({ game, isLast }: { game: GameRow; isLast: boolean }) {
  const marketRows: GameMarket[][] = [];
  for (let i = 0; i < game.markets.length; i += 2) {
    marketRows.push(game.markets.slice(i, i + 2));
  }
  
  const leagueColors: Record<string, string> = {
    "Premier League": "#37003c",
    "La Liga": "#ffce00",
    "Liga MX": "#00ff87",
    "Ligue 1": "#091f3c",
    "Serie A": "#024494",
    "Bundesliga": "#d20515",
  };
  const leagueColor = leagueColors[game.league] || "#22c55e";
  
  return (
    <div className={`group bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-brand-green/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] ${!isLast ? 'mb-3 md:mb-4' : ''}`}>
      <div 
        className="px-3 md:px-6 py-3 md:py-4 border-b border-[#1a1a1a] flex items-center justify-between"
        style={{ background: `linear-gradient(90deg, ${leagueColor}15 0%, transparent 100%)` }}
      >
        <div className="flex items-center gap-2 md:gap-4">
          <div 
            className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[9px] md:text-[11px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: `${leagueColor}25`, color: leagueColor }}
          >
            <span className="hidden md:inline">{game.league}</span>
            <span className="md:hidden">{game.league.split(' ')[0]}</span>
          </div>
          <div>
            <h3 className="text-[14px] md:text-[17px] font-semibold text-white">{game.match}</h3>
            <p className="text-[11px] md:text-[12px] text-muted-foreground">{formatKickoff(game.kickoff_wat)}</p>
          </div>
        </div>
        <Link
          to="/match/$id"
          params={{ id: game.id }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-green hover:underline flex items-center gap-1 text-[11px] md:text-[12px]"
        >
          <span className="hidden sm:inline">View picks</span> <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="p-3 md:p-5 bg-[#0a0a0a]/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-8 gap-y-2 md:gap-y-3">
          {marketRows.map((row, rowIdx) => (
            <div key={rowIdx} className="contents">
              {row.map((m) => (
                <div key={m.market_id} className="flex items-center gap-2 md:gap-3 py-1">
                  {m.cleared ? (
                    <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-brand-green flex-shrink-0" />
                  ) : (
                    <Circle className="w-3 h-3 md:w-4 md:h-4 text-[#333] flex-shrink-0" />
                  )}
                  <span className="text-[11px] md:text-[12px] text-muted-foreground w-20 md:w-28 truncate">{m.market_label}</span>
                  <ConfidenceBar confidence={m.confidence} cleared={m.cleared} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { isAuthed, loading } = useAuth();
  const [games] = useState<GameRow[]>(generateMockScorecard);
  
  if (loading) return null;
  if (!isAuthed) return <Navigate to="/record" />;

  const totalMarkets = games.reduce((sum, g) => sum + g.markets.length, 0);
  const clearedCount = games.reduce((sum, g) => sum + g.markets.filter(m => m.cleared).length, 0);
  const highConfCount = games.reduce((sum, g) => sum + g.markets.filter(m => m.confidence >= HIGH_THRESHOLD).length, 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 via-transparent to-amber-500/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-green/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />
        
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-brand-green" />
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  FULL MARKET SCORECARD
                </h1>
              </div>
              <p className="text-muted-foreground text-[12px] md:text-[14px]">
                Every fixture analysed today with confidence across all markets
              </p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-[11px] md:text-[13px]">
              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">{todayLagos()}</span>
              <span className="sm:hidden">{todayLagos().split(' ').slice(0,3).join(' ')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
            <div className="bg-[#111] border border-[#222] rounded-lg md:rounded-xl p-3 md:p-5">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{games.length}</div>
              <div className="text-[10px] md:text-[12px] text-muted-foreground uppercase tracking-wide">Fixtures</div>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-lg md:rounded-xl p-3 md:p-5">
              <div className="text-2xl md:text-3xl font-bold text-brand-green mb-1">{totalMarkets}</div>
              <div className="text-[10px] md:text-[12px] text-muted-foreground uppercase tracking-wide">Markets</div>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-lg md:rounded-xl p-3 md:p-5">
              <div className="text-2xl md:text-3xl font-bold text-green-400 mb-1">{highConfCount}</div>
              <div className="text-[10px] md:text-[12px] text-muted-foreground uppercase tracking-wide">70%+</div>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-lg md:rounded-xl p-3 md:p-5">
              <div className="text-2xl md:text-3xl font-bold text-amber-400 mb-1">{clearedCount}</div>
              <div className="text-[10px] md:text-[12px] text-muted-foreground uppercase tracking-wide">65%+</div>
            </div>
          </div>

          <div className="bg-[#111] border border-[#222] rounded-lg md:rounded-xl p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-3">
            <Activity className="w-4 h-4 md:w-5 md:h-5 text-brand-green flex-shrink-0" />
            <p className="text-[11px] md:text-[13px] text-muted-foreground leading-relaxed">
              <span className="text-brand-green font-medium">Green</span> = cleared threshold (65%).
              <span className="text-green-400 font-medium ml-1 md:ml-2">Glow</span> = 70%+ conf.
              <span className="text-red-400/70 font-medium ml-1 md:ml-2">Red</span> = below 50%.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 md:px-6 pb-12 md:pb-16">
        <div className="space-y-2">
          {games.map((game, idx) => (
            <GameCard key={game.id} game={game} isLast={idx === games.length - 1} />
          ))}
        </div>
      </div>
    </div>
  );
}