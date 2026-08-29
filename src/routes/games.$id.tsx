import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type GameDetailResponse, type GameFullContext, type MarketInfo, type Pick } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatKickoff } from "@/lib/time";
import { ArrowLeft, TrendingUp, Users, Target, Lightbulb, BarChart3, Award, CircleDot, Info, Trophy } from "lucide-react";

export const Route = createFileRoute("/games/$id")({
  head: () => ({ meta: [{ title: "Game Analysis - Betpreneur" }] }),
  component: GameAnalysisPage,
});

function GameAnalysisPage() {
  const { isAuthed, loading } = useAuth();
  const [data, setData] = useState<GameDetailResponse | null>(null);
  const [error, setError] = useState(false);
  const [loadingId, setLoadingId] = useState(true);

  const { id } = Route.useParams();

  useEffect(() => {
    const gameId = decodeURIComponent(id || "").trim();

    setLoadingId(false);
    if (!gameId) { setError(true); return; }
    if (!isAuthed) return;

    api.getGameDetail(gameId).then(setData).catch(() => setError(true));
  }, [isAuthed, id]);

  if (loading || loadingId) return <div className="p-4">Loading...</div>;
  if (error || !data) return <div className="p-4">Failed load.</div>;

  const g: GameFullContext = data.game;
  const hasPick = g.picks && g.picks.length > 0;
  const displayMarkets: (MarketInfo | Pick)[] = hasPick ? g.picks : g.markets;
  
  return (
    <div className="space-y-4 p-4">
      <Link
        to="/games"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
      <div className="flex items-center gap-2">
        {(g.competition_logo || g.league_logo) && (
          <img 
            src={g.competition_logo || g.league_logo} 
            alt="" 
            className="w-6 h-6 object-contain"
          />
        )}
        <div>
          <h1 className="text-xl font-bold">{g.match}</h1>
          <p className="text-sm text-muted-foreground">{g.league} · {formatKickoff(g.kickoff)}</p>
        </div>
      </div>
      <div className="flex justify-center items-center gap-8 py-4">
        <div className="center">{g.home_logo && <img src={g.home_logo} className="w-12 h-12"/>}<div>{g.home_team}</div></div>
        <div className="text-xl font-bold">{g.home_score??0} - {g.away_score??0}</div>
        <div className="center">{g.away_logo && <img src={g.away_logo} className="w-12 h-12"/>}<div>{g.away_team}</div></div>
      </div>
      {!hasPick && <div className="text-xs text-muted-foreground mb-2">Available Markets</div>}
      {displayMarkets?.map((p: MarketInfo | Pick, i: number) => {
        // MarketInfo has: label, odds, meaning, ev, proven
        // Pick has: market, odds, confidence
        const marketLabel = 'label' in p ? p.label : p.market;
        const marketOdds = p.odds;
        const marketMeaning = 'meaning' in p ? p.meaning : null;
        const marketConfidence = 'confidence' in p ? p.confidence : null;
        
        return (
          <div key={i} className="p-2 border my-1">
            <div className="font-medium">{marketLabel}</div>
            <div className="text-sm text-muted-foreground">
              @{marketOdds}
              {marketMeaning && <span className="ml-2">{marketMeaning}</span>}
              {marketConfidence ? ` ${marketConfidence}% confidence` : null}
            </div>
          </div>
        );
      })}

      {/* Recent Form Section */}
      {(g.home_form || g.away_form) && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" />
            <h2 className="font-semibold">Recent Form</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {g.home_form && (
              <div>
                <h3 className="text-sm font-medium mb-2">{g.home_team}</h3>
                <div className="text-xs space-y-1">
                  <div className="flex gap-1">
                    {g.home_form.form.split('').map((char, i) => (
                      <span key={i} className={`w-5 h-5 flex items-center justify-center rounded text-xs font-medium ${
                        char === 'W' ? 'bg-green-100 text-green-700' : char === 'D' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>{char}</span>
                    ))}
                  </div>
                  <p>W: {g.home_form.wins} | D: {g.home_form.draws} | L: {g.home_form.losses}</p>
                  <p>Goals: {g.home_form.avg_scored} scored · {g.home_form.avg_conceded} conceded</p>
                  <p>Clean sheets: {g.home_form.clean_sheets} · BTTS: {g.home_form.btts_rate}%</p>
                </div>
              </div>
            )}
            {g.away_form && (
              <div>
                <h3 className="text-sm font-medium mb-2">{g.away_team}</h3>
                <div className="text-xs space-y-1">
                  <div className="flex gap-1">
                    {g.away_form.form.split('').map((char, i) => (
                      <span key={i} className={`w-5 h-5 flex items-center justify-center rounded text-xs font-medium ${
                        char === 'W' ? 'bg-green-100 text-green-700' : char === 'D' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>{char}</span>
                    ))}
                  </div>
                  <p>W: {g.away_form.wins} | D: {g.away_form.draws} | L: {g.away_form.losses}</p>
                  <p>Goals: {g.away_form.avg_scored} scored · {g.away_form.avg_conceded} conceded</p>
                  <p>Clean sheets: {g.away_form.clean_sheets} · BTTS: {g.away_form.btts_rate}%</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match Context Section */}
      {g.fixture_context && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Match Context</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {g.fixture_context.home_standing && (
              <div>
                <p className="font-medium">{g.home_team}</p>
                <p className="text-muted-foreground">Rank: {g.fixture_context.home_standing.rank} · {g.fixture_context.home_standing.points} pts</p>
              </div>
            )}
            {g.fixture_context.away_standing && (
              <div>
                <p className="font-medium">{g.away_team}</p>
                <p className="text-muted-foreground">Rank: {g.fixture_context.away_standing.rank} · {g.fixture_context.away_standing.points} pts</p>
              </div>
            )}
            {g.fixture_context.home_rest_days !== undefined && g.fixture_context.away_rest_days !== undefined && (
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <p>{g.home_team} rest: {g.fixture_context.home_rest_days} days</p>
                <p>{g.away_team} rest: {g.fixture_context.away_rest_days} days</p>
              </div>
            )}
            {g.fixture_context.goal_model && (
              <div className="col-span-2 mt-2 pt-2 border-t">
                <p className="font-medium mb-1">Goal Model</p>
                {g.fixture_context.goal_model.expected_total && (
                  <p>Expected goals: {g.fixture_context.goal_model.expected_total}</p>
                )}
                {g.fixture_context.goal_model.over25_margin !== undefined && (
                  <p>Over 2.5 margin: {g.fixture_context.goal_model.over25_margin > 0 ? '+' : ''}{g.fixture_context.goal_model.over25_margin}%</p>
                )}
              </div>
            )}
            {g.fixture_context.h2h && (
              <div className="col-span-2 mt-2 pt-2 border-t">
                <p className="font-medium mb-1">Head-to-Head</p>
                <p className="text-muted-foreground">
                  Games: {g.fixture_context.h2h.games} · 
                  {g.home_team} W: {g.fixture_context.h2h.t1w} · 
                  {g.away_team} W: {g.fixture_context.h2h.t2w} · 
                  Draws: {g.fixture_context.h2h.draws} · 
                  Avg Goals: {g.fixture_context.h2h.avg_goals}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team News Section */}
      {(g.home_news || g.away_news) && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" />
            <h2 className="font-semibold">Team News</h2>
          </div>
          <div className="space-y-3 text-xs">
            {g.home_news && (
              <div>
                <h3 className="font-medium">{g.home_team}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{g.home_news}</p>
              </div>
            )}
            {g.away_news && (
              <div>
                <h3 className="font-medium">{g.away_team}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{g.away_news}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Corner Stats Section */}
      {g.corner_profile && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4" />
            <h2 className="font-semibold">Corner Stats</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {g.corner_profile.home && (
              <div>
                <h3 className="font-medium mb-2">{g.home_team}</h3>
                <p>Avg For: {g.corner_profile.home.avg_for ?? '-'}</p>
                <p>Avg Against: {g.corner_profile.home.avg_against ?? '-'}</p>
                <p>Avg Total: {g.corner_profile.home.avg_total ?? '-'}</p>
              </div>
            )}
            {g.corner_profile.away && (
              <div>
                <h3 className="font-medium mb-2">{g.away_team}</h3>
                <p>Avg For: {g.corner_profile.away.avg_for ?? '-'}</p>
                <p>Avg Against: {g.corner_profile.away.avg_against ?? '-'}</p>
                <p>Avg Total: {g.corner_profile.away.avg_total ?? '-'}</p>
              </div>
            )}
            {g.corner_profile.expected_total && (
              <p className="col-span-2 mt-2 pt-2 border-t">
                Expected total corners: {g.corner_profile.expected_total}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Key Insights Section */}
      {g.insights && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4" />
            <h2 className="font-semibold">Key Insights</h2>
          </div>
          <p className="text-sm whitespace-pre-wrap">{g.insights}</p>
        </div>
      )}

      {/* Win Probability / Prediction Section */}
      {g.prediction && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4" />
            <h2 className="font-semibold">Win Probability</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-blue-50 rounded p-2">
              <p className="font-medium">{g.home_team}</p>
              <p className="text-lg font-bold text-blue-600">{g.prediction.home_win}%</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="font-medium">Draw</p>
              <p className="text-lg font-bold text-gray-600">{g.prediction.draw}%</p>
            </div>
            <div className="bg-red-50 rounded p-2">
              <p className="font-medium">{g.away_team}</p>
              <p className="text-lg font-bold text-red-600">{g.prediction.away_win}%</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div className="flex justify-between bg-green-50 rounded p-2">
              <span>BTTS</span>
              <span className="font-medium">{g.prediction.btts}%</span>
            </div>
            <div className="flex justify-between bg-purple-50 rounded p-2">
              <span>Over 2.5</span>
              <span className="font-medium">{g.prediction.over_25}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Official Pick Section */}
      {(g.official_pick || g.official_picks) && (
        <div className="border rounded-lg p-4 bg-amber-50">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-600" />
            <h2 className="font-semibold">Official Pick</h2>
          </div>
          {(g.official_pick || g.official_picks?.[0]) && (
            <div className="text-sm">
              <p className="font-medium">{g.official_pick?.market || g.official_picks?.[0]?.market}</p>
              <p className="text-2xl font-bold">@{g.official_pick?.odds || g.official_picks?.[0]?.odds}</p>
              {g.official_pick?.confidence && (
                <p className="text-xs text-amber-700">{g.official_pick.confidence}% confidence</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Market Stats Section */}
      {(g.market_count !== undefined || g.markets_70_plus !== undefined || g.markets_65_plus !== undefined) && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CircleDot className="w-4 h-4" />
            <h2 className="font-semibold">Market Stats</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {g.market_count !== undefined && (
              <div className="bg-gray-50 rounded p-2">
                <p className="text-muted-foreground">Total Markets</p>
                <p className="text-lg font-bold">{g.market_count}</p>
              </div>
            )}
            {g.markets_70_plus !== undefined && (
              <div className="bg-green-50 rounded p-2">
                <p className="text-muted-foreground">70%+ Confidence</p>
                <p className="text-lg font-bold text-green-600">{g.markets_70_plus}</p>
              </div>
            )}
            {g.markets_65_plus !== undefined && (
              <div className="bg-blue-50 rounded p-2">
                <p className="text-muted-foreground">65%+ Confidence</p>
                <p className="text-lg font-bold text-blue-600">{g.markets_65_plus}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Squad Status (Injuries/Suspensions) */}
      {g.team_news && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4" />
            <h2 className="font-semibold">Squad Status</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {g.team_news.home && (
              <div>
                <h3 className="font-medium mb-2">{g.home_team}</h3>
                <div className="space-y-1">
                  <p>Injuries: {g.team_news.home.injuries ?? 0}</p>
                  <p>Suspended: {g.team_news.home.suspended ?? 0}</p>
                </div>
              </div>
            )}
            {g.team_news.away && (
              <div>
                <h3 className="font-medium mb-2">{g.away_team}</h3>
                <div className="space-y-1">
                  <p>Injuries: {g.team_news.away.injuries ?? 0}</p>
                  <p>Suspended: {g.team_news.away.suspended ?? 0}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Competition Info */}
      {g.competition_info && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4" />
            <h2 className="font-semibold">Competition</h2>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {g.competition_info.country_flag && (
              <img src={g.competition_info.country_flag} alt="" className="w-5 h-3 object-contain" />
            )}
            <span>{g.competition_info.name}</span>
            {g.competition_info.country && (
              <span className="text-muted-foreground">· {g.competition_info.country}</span>
            )}
          </div>
        </div>
      )}

      {/* Match Status */}
      {g.status && (
        <div className="text-center">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            g.status === 'FT' || g.status === 'Finished' ? 'bg-gray-100 text-gray-700' :
            g.status === 'Live' || g.status === 'INPLAY' ? 'bg-green-100 text-green-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {g.status}
          </span>
        </div>
      )}
    </div>
  );
}