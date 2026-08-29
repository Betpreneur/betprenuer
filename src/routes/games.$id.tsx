import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type GameDetailResponse, type GameFullContext, type MarketInfo, type Pick, type TopMarketInfo } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatKickoff } from "@/lib/time";
import { ArrowLeft, TrendingUp, Users, Target, Lightbulb, BarChart3, Award, CircleDot, Info, Trophy, MapPin, User, CloudSun, PenLine } from "lucide-react";

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
            src={g.competition_logo || g.league_logo || undefined} 
            alt="" 
            className="w-6 h-6 object-contain"
          />
        )}
        <div>
          <h1 className="text-xl font-bold">{g.match}</h1>
          <p className="text-sm text-muted-foreground">
            {g.league}{g.round ? ` · Round ${g.round}` : ''}{g.country ? ` · ${g.country}` : ''} · {formatKickoff(g.kickoff)}
          </p>
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

      {/* Top Market Section */}
      {g.top_market && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold">Top Market</h2>
            {g.top_market.display_score != null && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                Score: {g.top_market.display_score}
              </span>
            )}
          </div>
          <div className="text-sm">
            <p className="font-medium">{g.top_market.market}</p>
            <p className="text-2xl font-bold">@{g.top_market.odds}</p>
            <p className="text-xs text-blue-700">{g.top_market.confidence}% confidence</p>
            {g.top_market.ev !== null && g.top_market.ev !== undefined && (
              <p className="text-xs text-green-700">EV: {g.top_market.ev}</p>
            )}
            {g.top_market.meaning && (
              <p className="text-xs text-muted-foreground mt-1">{g.top_market.meaning}</p>
            )}
          </div>
          {/* Odds Meta - Best/Worst/Avg */}
          {g.top_market.odds_meta && (
            <div className="mt-2 pt-2 border-t border-blue-100">
              <p className="text-xs font-medium text-blue-800 mb-1">Odds Comparison</p>
              <div className="grid grid-cols-4 gap-1 text-xs">
                {g.top_market.odds_meta.best_odds != null && (
                  <div className="text-center">
                    <p className="text-muted-foreground">Best</p>
                    <p className="font-medium text-green-600">@{g.top_market.odds_meta.best_odds}</p>
                  </div>
                )}
                {g.top_market.odds_meta.worst_odds != null && (
                  <div className="text-center">
                    <p className="text-muted-foreground">Worst</p>
                    <p className="font-medium text-red-600">@{g.top_market.odds_meta.worst_odds}</p>
                  </div>
                )}
                {g.top_market.odds_meta.avg_odds != null && (
                  <div className="text-center">
                    <p className="text-muted-foreground">Avg</p>
                    <p className="font-medium">@{g.top_market.odds_meta.avg_odds}</p>
                  </div>
                )}
                {g.top_market.odds_meta.bookmaker_count != null && (
                  <div className="text-center">
                    <p className="text-muted-foreground">Books</p>
                    <p className="font-medium">{g.top_market.odds_meta.bookmaker_count}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Analysis Summary */}
          {g.top_market.analysis_summary && (
            <div className="mt-2 pt-2 border-t border-blue-100">
              <p className="text-xs font-medium text-blue-800 mb-1">Analysis</p>
              <p className="text-xs text-muted-foreground">{g.top_market.analysis_summary}</p>
            </div>
          )}
          {/* Positive Evidence */}
          {g.top_market.positive_evidence && g.top_market.positive_evidence.length > 0 && (
            <div className="mt-2 pt-2 border-t border-blue-100">
              <p className="text-xs font-medium text-green-700 mb-1">✓ Positive Factors</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {g.top_market.positive_evidence.map((evidence, i) => (
                  <li key={i}>• {evidence}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Risk Evidence */}
          {g.top_market.risk_evidence && g.top_market.risk_evidence.length > 0 && (
            <div className="mt-2 pt-2 border-t border-blue-100">
              <p className="text-xs font-medium text-amber-700 mb-1">⚠ Risk Factors</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {g.top_market.risk_evidence.map((evidence, i) => (
                  <li key={i}>• {evidence}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Risk Flags */}
          {g.top_market.risk_flags && g.top_market.risk_flags.length > 0 && (
            <div className="mt-2">
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                Risk: {g.top_market.risk_flags.join(', ')}
              </span>
            </div>
          )}
          {/* Model Verdict / Reasoning from Top Market */}
          {(g.top_market.reasoning || g.top_market.model_verdict) && (
            <div className="mt-3 pt-3 border-t border-blue-100">
              <p className="text-xs font-medium text-blue-800 mb-1">Why this pick?</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{g.top_market.reasoning || g.top_market.model_verdict}</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Form Section - uses home_recent_form and away_recent_form */}
      {((g.home_recent_form || g.away_recent_form) || (g.home_form || g.away_form) || (g.form_home || g.form_away) || (g.recent_form_home || g.recent_form_away) || (g.form) || (g.home_form_last5 || g.away_form_last5)) && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" />
            <h2 className="font-semibold">Recent Form</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(g.home_recent_form || g.home_form || g.form_home || g.recent_form_home) && (
              <div>
                <h3 className="text-sm font-medium mb-2">{g.home_team}</h3>
                <div className="text-xs space-y-1">
                  {/* Handle form array from API */}
                  {(() => {
                    const formData = g.home_recent_form || g.home_form || g.form_home || g.recent_form_home;
                    // Check if formData is an object (RecentFormStats) with form property
                    if (formData && typeof formData === 'object' && 'form' in formData) {
                      const formArray = (formData as any).form;
                      if (Array.isArray(formArray)) {
                        return (
                          <div className="flex gap-1">
                            {formArray.slice(0, 10).map((char, i) => (
                              <span key={i} className={`w-5 h-5 flex items-center justify-center rounded text-xs font-medium ${
                                char === 'W' ? 'bg-green-100 text-green-700' : char === 'D' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                              }`}>{char}</span>
                            ))}
                          </div>
                        );
                      }
                      // Handle string form property
                      if (typeof formArray === 'string') {
                        return (
                          <div className="flex gap-1">
                            {formArray.split('').slice(0, 10).map((char, i) => (
                              <span key={i} className={`w-5 h-5 flex items-center justify-center rounded text-xs font-medium ${
                                char === 'W' ? 'bg-green-100 text-green-700' : char === 'D' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                              }`}>{char}</span>
                            ))}
                          </div>
                        );
                      }
                    }
                    // Handle plain string form
                    if (typeof formData === 'string') {
                      return (
                        <div className="flex gap-1">
                          {formData.split('').slice(0, 10).map((char, i) => (
                            <span key={i} className={`w-5 h-5 flex items-center justify-center rounded text-xs font-medium ${
                              char === 'W' ? 'bg-green-100 text-green-700' : char === 'D' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>{char}</span>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {(g.home_recent_form || g.home_form) && (
                    <>
                      <p>W: {(g.home_recent_form?.wins ?? g.home_form?.wins) || 0} | D: {(g.home_recent_form?.draws ?? g.home_form?.draws) || 0} | L: {(g.home_recent_form?.losses ?? g.home_form?.losses) || 0}</p>
                      <p>Goals: {(g.home_recent_form?.avg_scored ?? g.home_form?.avg_scored)?.toFixed(2) || '0'} scored · {(g.home_recent_form?.avg_conceded ?? g.home_form?.avg_conceded)?.toFixed(2) || '0'} conceded</p>
                    </>
                  )}
                </div>
              </div>
            )}
            {(g.away_recent_form || g.away_form || g.form_away || g.recent_form_away) && (
              <div>
                <h3 className="text-sm font-medium mb-2">{g.away_team}</h3>
                <div className="text-xs space-y-1">
                  {(() => {
                    const formData = g.away_recent_form || g.away_form || g.form_away || g.recent_form_away;
                    // Check if formData is an object (RecentFormStats) with form property
                    if (formData && typeof formData === 'object' && 'form' in formData) {
                      const formArray = (formData as any).form;
                      if (Array.isArray(formArray)) {
                        return (
                          <div className="flex gap-1">
                            {formArray.slice(0, 10).map((char, i) => (
                              <span key={i} className={`w-5 h-5 flex items-center justify-center rounded text-xs font-medium ${
                                char === 'W' ? 'bg-green-100 text-green-700' : char === 'D' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                              }`}>{char}</span>
                            ))}
                          </div>
                        );
                      }
                      // Handle string form property
                      if (typeof formArray === 'string') {
                        return (
                          <div className="flex gap-1">
                            {formArray.split('').slice(0, 10).map((char, i) => (
                              <span key={i} className={`w-5 h-5 flex items-center justify-center rounded text-xs font-medium ${
                                char === 'W' ? 'bg-green-100 text-green-700' : char === 'D' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                              }`}>{char}</span>
                            ))}
                          </div>
                        );
                      }
                    }
                    // Handle plain string form
                    if (typeof formData === 'string') {
                      return (
                        <div className="flex gap-1">
                          {formData.split('').slice(0, 10).map((char, i) => (
                            <span key={i} className={`w-5 h-5 flex items-center justify-center rounded text-xs font-medium ${
                              char === 'W' ? 'bg-green-100 text-green-700' : char === 'D' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>{char}</span>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {(g.away_recent_form || g.away_form) && (
                    <>
                      <p>W: {(g.away_recent_form?.wins ?? g.away_form?.wins) || 0} | D: {(g.away_recent_form?.draws ?? g.away_form?.draws) || 0} | L: {(g.away_recent_form?.losses ?? g.away_form?.losses) || 0}</p>
                      <p>Goals: {(g.away_recent_form?.avg_scored ?? g.away_form?.avg_scored)?.toFixed(2) || '0'} scored · {(g.away_recent_form?.avg_conceded ?? g.away_form?.avg_conceded)?.toFixed(2) || '0'} conceded</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match Context Section - handles multiple field name variations */}
      {((g.fixture_context || g.home_standings || g.away_standings || g.standing) || (g.home_rank !== undefined) || (g.rest_days_home !== undefined)) && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Match Context</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Handle different standings field names - nested and flat */}
            {((g.fixture_context?.home_standing || g.home_standings || g.standing) || (g.home_rank !== undefined)) && (
              <div>
                <p className="font-medium">{g.home_team}</p>
                <p className="text-muted-foreground">
                  Rank: {(g.fixture_context?.home_standing?.rank || g.home_standings?.rank || g.standing?.home_rank || g.home_rank) || 'N/A'} · 
                  {(g.fixture_context?.home_standing?.points || g.home_standings?.points || g.standing?.home_points || g.home_points) || 0} pts
                </p>
              </div>
            )}
            {((g.fixture_context?.away_standing || g.away_standings || g.standing) || (g.away_rank !== undefined)) && (
              <div>
                <p className="font-medium">{g.away_team}</p>
                <p className="text-muted-foreground">
                  Rank: {(g.fixture_context?.away_standing?.rank || g.away_standings?.rank || g.standing?.away_rank || g.away_rank) || 'N/A'} · 
                  {(g.fixture_context?.away_standing?.points || g.away_standings?.points || g.standing?.away_points || g.away_points) || 0} pts
                </p>
              </div>
            )}
            {/* Handle rest days - nested and flat */}
            {((g.fixture_context?.home_rest_days !== undefined && g.fixture_context?.away_rest_days !== undefined) || (g.rest_days_home !== undefined)) && (
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <p>{g.home_team} rest: {g.fixture_context?.home_rest_days ?? g.rest_days_home ?? 0} days</p>
                <p>{g.away_team} rest: {g.fixture_context?.away_rest_days ?? g.rest_days_away ?? 0} days</p>
              </div>
            )}
            {g.fixture_context?.goal_model && (
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
            {g.fixture_context?.h2h && (
              <div className="col-span-2 mt-2 pt-2 border-t">
                <p className="font-medium mb-2">Head-to-Head</p>
                <div className="grid grid-cols-5 gap-1 text-center text-xs mb-2">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-muted-foreground">Games</p>
                    <p className="font-bold">{g.fixture_context.h2h.games}</p>
                  </div>
                  <div className="bg-blue-50 rounded p-2">
                    <p className="text-muted-foreground">{g.home_team}</p>
                    <p className="font-bold text-blue-600">{g.fixture_context.h2h.t1w}W</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-muted-foreground">Draws</p>
                    <p className="font-bold">{g.fixture_context.h2h.draws}</p>
                  </div>
                  <div className="bg-red-50 rounded p-2">
                    <p className="text-muted-foreground">{g.away_team}</p>
                    <p className="font-bold text-red-600">{g.fixture_context.h2h.t2w}W</p>
                  </div>
                  <div className="bg-green-50 rounded p-2">
                    <p className="text-muted-foreground">Avg Goals</p>
                    <p className="font-bold text-green-600">{g.fixture_context.h2h.avg_goals}</p>
                  </div>
                </div>
                {/* Show H2H win percentages */}
                {g.fixture_context.h2h.games && g.fixture_context.h2h.games > 0 && (
                  <div className="flex justify-between items-center gap-2 text-xs">
                    <span className="w-1/3 text-blue-600">{g.home_team} {((g.fixture_context.h2h.t1w / g.fixture_context.h2h.games) * 100).toFixed(0)}%</span>
                    <span className="w-1/3 text-center text-muted-foreground">win rate</span>
                    <span className="w-1/3 text-right text-red-600">{g.away_team} {((g.fixture_context.h2h.t2w / g.fixture_context.h2h.games) * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team News Section - handles multiple field name variations */}
      {((g.home_news || g.away_news) || (g.team_news_home || g.team_news_away) || (g.news_home || g.news_away)) && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" />
            <h2 className="font-semibold">Team News</h2>
          </div>
          <div className="space-y-3 text-xs">
            {(g.home_news || g.team_news_home || g.news_home) && (
              <div>
                <h3 className="font-medium">{g.home_team}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{g.home_news || g.team_news_home || g.news_home}</p>
              </div>
            )}
            {(g.away_news || g.team_news_away || g.news_away) && (
              <div>
                <h3 className="font-medium">{g.away_team}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{g.away_news || g.team_news_away || g.news_away}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Corner Stats Section - handles multiple field name variations */}
      {(g.corner_profile || g.corners_home_avg !== undefined || g.corners_away_avg !== undefined) && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4" />
            <h2 className="font-semibold">Corner Stats</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Handle nested corner_profile */}
            {g.corner_profile?.home && (
              <div>
                <h3 className="font-medium mb-2">{g.home_team}</h3>
                <p>Avg For: {g.corner_profile.home.avg_for ?? '-'}</p>
                <p>Avg Against: {g.corner_profile.home.avg_against ?? '-'}</p>
                <p>Avg Total: {g.corner_profile.home.avg_total ?? '-'}</p>
              </div>
            )}
            {/* Handle flat fields */}
            {g.corners_home_avg !== undefined && !g.corner_profile?.home && (
              <div>
                <h3 className="font-medium mb-2">{g.home_team}</h3>
                <p>Avg For: {g.corners_home_avg}</p>
              </div>
            )}
            {g.corner_profile?.away && (
              <div>
                <h3 className="font-medium mb-2">{g.away_team}</h3>
                <p>Avg For: {g.corner_profile.away.avg_for ?? '-'}</p>
                <p>Avg Against: {g.corner_profile.away.avg_against ?? '-'}</p>
                <p>Avg Total: {g.corner_profile.away.avg_total ?? '-'}</p>
              </div>
            )}
            {g.corners_away_avg !== undefined && !g.corner_profile?.away && (
              <div>
                <h3 className="font-medium mb-2">{g.away_team}</h3>
                <p>Avg For: {g.corners_away_avg}</p>
              </div>
            )}
            {(g.corner_profile?.expected_total || g.corners_expected || g.corners_total_avg) && (
              <p className="col-span-2 mt-2 pt-2 border-t">
                Expected total corners: {g.corner_profile?.expected_total ?? g.corners_expected ?? g.corners_total_avg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Key Insights Section - from top_market reasoning */}
      {((g.top_market?.reasoning || g.top_market?.model_verdict) || g.model_insights || g.analysis || g.reasoning || g.model_reasoning) && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4" />
            <h2 className="font-semibold">Key Insights</h2>
          </div>
          <p className="text-sm whitespace-pre-wrap">{g.top_market?.reasoning || g.top_market?.model_verdict || g.model_insights || g.analysis || g.reasoning || g.model_reasoning}</p>
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
      {(g.competition_info || g.competition) && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4" />
            <h2 className="font-semibold">Competition</h2>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {(g.competition_info?.country_flag || g.country_flag) && (
              <img src={g.competition_info?.country_flag || g.country_flag || ""} alt="" className="w-5 h-3 object-contain" />
            )}
            <span>{g.competition_info?.name || g.competition}</span>
            {g.competition_info?.country && (
              <span className="text-muted-foreground">· {g.competition_info.country}</span>
            )}
          </div>
        </div>
      )}

      {/* Venue Section - handles multiple field name variations */}
      {(g.venue || g.venue_name || g.stadium) && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4" />
            <h2 className="font-semibold">Venue</h2>
          </div>
          <div className="text-sm">
            <p>{g.venue || g.venue_name || g.stadium}</p>
            {g.venue_location && (
              <p className="text-muted-foreground text-xs">{g.venue_location}</p>
            )}
          </div>
        </div>
      )}

      {/* Coaches Section - handles multiple field name variations */}
      {(g.coach_home || g.coach_away || g.manager_home || g.manager_away) && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4" />
            <h2 className="font-semibold">Coaches</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {(g.coach_home || g.manager_home) && (
              <div>
                <p className="text-muted-foreground text-xs">{g.home_team}</p>
                <p className="font-medium">{g.coach_home || g.manager_home}</p>
              </div>
            )}
            {(g.coach_away || g.manager_away) && (
              <div>
                <p className="text-muted-foreground text-xs">{g.away_team}</p>
                <p className="font-medium">{g.coach_away || g.manager_away}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* xG Stats Section - handles multiple field name variations */}
      {(g.xg_home !== undefined || g.xg_away !== undefined || g.home_xg !== undefined || g.away_xg !== undefined || g.expected_goals_home !== undefined || g.expected_goals_away !== undefined) && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4" />
            <h2 className="font-semibold">Expected Goals (xG)</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            {(g.xg_home !== undefined || g.home_xg !== undefined || g.expected_goals_home !== undefined) && (
              <div className="bg-blue-50 rounded p-3">
                <p className="text-xs text-muted-foreground">{g.home_team}</p>
                <p className="text-2xl font-bold text-blue-600">{g.xg_home ?? g.home_xg ?? g.expected_goals_home}</p>
              </div>
            )}
            {(g.xg_away !== undefined || g.away_xg !== undefined || g.expected_goals_away !== undefined) && (
              <div className="bg-red-50 rounded p-3">
                <p className="text-xs text-muted-foreground">{g.away_team}</p>
                <p className="text-2xl font-bold text-red-600">{g.xg_away ?? g.away_xg ?? g.expected_goals_away}</p>
              </div>
            )}
          </div>
          {/* Show projected total if available */}
          {g.projected_total !== undefined && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Projected total: {g.projected_total}
            </p>
          )}
        </div>
      )}

      {/* EV (Expected Value) Section */}
      {(g.ev_home != null || g.ev_away != null || g.ev_draw != null) && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4" />
            <h2 className="font-semibold">Expected Value</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {g.ev_home != null && (
              <div className="bg-blue-50 rounded p-2">
                <p className="text-muted-foreground">{g.home_team}</p>
                <p className={`font-bold ${g.ev_home >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {g.ev_home > 0 ? '+' : ''}{g.ev_home}%
                </p>
              </div>
            )}
            {g.ev_draw != null && (
              <div className="bg-gray-50 rounded p-2">
                <p className="text-muted-foreground">Draw</p>
                <p className={`font-bold ${g.ev_draw >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {g.ev_draw > 0 ? '+' : ''}{g.ev_draw}%
                </p>
              </div>
            )}
            {g.ev_away != null && (
              <div className="bg-red-50 rounded p-2">
                <p className="text-muted-foreground">{g.away_team}</p>
                <p className={`font-bold ${g.ev_away >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {g.ev_away > 0 ? '+' : ''}{g.ev_away}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Win Odds Section */}
      {(g.home_odds !== undefined || g.away_odds !== undefined || g.draw_odds !== undefined) && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4" />
            <h2 className="font-semibold">Win Odds</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {g.home_odds !== undefined && (
              <div className="bg-blue-50 rounded p-3">
                <p className="text-xs text-muted-foreground">{g.home_team}</p>
                <p className="text-xl font-bold text-blue-600">@{g.home_odds}</p>
              </div>
            )}
            {g.draw_odds !== undefined && (
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs text-muted-foreground">Draw</p>
                <p className="text-xl font-bold text-gray-600">@{g.draw_odds}</p>
              </div>
            )}
            {g.away_odds !== undefined && (
              <div className="bg-red-50 rounded p-3">
                <p className="text-xs text-muted-foreground">{g.away_team}</p>
                <p className="text-xl font-bold text-red-600">@{g.away_odds}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Half Time Score Section */}
      {(g.half_time_home !== undefined || g.half_time_away !== undefined) && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3 text-sm">Half Time</h2>
          <div className="flex justify-center items-center gap-4">
            <div className="text-lg font-medium">{g.home_team}</div>
            <div className="text-xl font-bold">
              {g.half_time_home ?? 0} - {g.half_time_away ?? 0}
            </div>
            <div className="text-lg font-medium">{g.away_team}</div>
          </div>
        </div>
      )}

      {/* Live Match Stats (Possession & Shots) */}
      {(g.possession_home !== undefined || g.possession_away !== undefined || g.shots_on_target_home !== undefined || g.shots_on_target_away !== undefined) && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Match Stats</h2>
          <div className="space-y-3 text-xs">
            {/* Possession */}
            {(g.possession_home !== undefined || g.possession_away !== undefined) && (
              <div>
                <p className="font-medium mb-1">Possession</p>
                <div className="flex justify-between items-center gap-2">
                  <span className="w-24 truncate">{g.home_team}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full" 
                      style={{ width: `${g.possession_home ?? 50}%` }}
                    />
                  </div>
                  <span className="w-12 text-right">{g.possession_home ?? 0}%</span>
                  <span className="w-12">-</span>
                  <span className="w-12">{g.possession_away ?? 0}%</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-red-500 h-full" 
                      style={{ width: `${g.possession_away ?? 50}%` }}
                    />
                  </div>
                  <span className="w-24 text-right truncate">{g.away_team}</span>
                </div>
              </div>
            )}
            {/* Shots on Target */}
            {(g.shots_on_target_home !== undefined || g.shots_on_target_away !== undefined) && (
              <div>
                <p className="font-medium mb-1">Shots on Target</p>
                <div className="flex justify-between items-center">
                  <span>{g.shots_on_target_home ?? 0}</span>
                  <span className="text-muted-foreground">-</span>
                  <span>{g.shots_on_target_away ?? 0}</span>
                </div>
              </div>
            )}
            {/* Total Shots */}
            {(g.shots_home !== undefined || g.shots_away !== undefined) && (
              <div>
                <p className="font-medium mb-1">Total Shots</p>
                <div className="flex justify-between items-center">
                  <span>{g.shots_home ?? 0}</span>
                  <span className="text-muted-foreground">-</span>
                  <span>{g.shots_away ?? 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match Info (Referee, Weather, Attendance) */}
      {(g.referee || g.weather || g.attendance) && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Match Info</h2>
          <div className="space-y-2 text-xs">
            {g.referee && (
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Referee:</span>
                <span>{g.referee}</span>
              </div>
            )}
            {g.weather && (
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Weather:</span>
                <span>{g.weather}</span>
              </div>
            )}
            {g.attendance != null && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Attendance:</span>
                <span>{g.attendance?.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* League Strength */}
      {g.league_strength != null && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4" />
            <h2 className="font-semibold text-sm">League Strength</h2>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-full rounded-full" 
              style={{ width: `${Math.min((g.league_strength ?? 0) * 10, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{g.league_strength}/10</p>
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