import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { api, type SlipReviewPublic, type SlipReviewListItem, type SlipReviewsResponse, type SmartRandomizeResponse } from "@/lib/api";
import { useSlipReview } from "@/hooks/useSlipReview";
import { triggerWalletRefresh } from "@/hooks/useWallet";
import { SlipReviewCard } from "@/components/SlipReviewCard";
import { ArrowLeft, ClipboardList, Plus, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Target, Sparkles, Loader2, Wifi, WifiOff } from "lucide-react";

// Obscure data source names to hide from end users
const obscureSource = (source: string): string => {
  const mapping: Record<string, string> = {
    "Api-Football": "OddsFeed",
    "Statpal": "ModelScore",
    "OddsJam": "EdgeCalc",
  };
  return mapping[source] || source;
};

export const Route = createFileRoute("/slip-review/$id")({
  head: () => ({
    meta: [
      { title: "Slip Review Details - Betpreneur" },
      { name: "description", content: "View your SportyBet slip review details." },
    ],
  }),
  component: SlipReviewDetailPage,
});

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-win-green" />;
    case "partial":
      return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    case "failed":
      return <XCircle className="w-5 h-5 text-danger-red" />;
    default:
      return <div className="w-3 h-3 rounded-full bg-muted-foreground animate-pulse" />;
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "completed":
      return "bg-win-green/10 text-win-green border-win-green/30";
    case "partial":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "failed":
      return "bg-danger-red/10 text-danger-red border-danger-red/30";
    case "analysing":
      return "bg-info-blue/10 text-info-blue border-info-blue/30";
    default:
      return "bg-muted text-muted-foreground border-muted";
  }
}

function SlipReviewDetailPage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const params = Route.useParams();
  const reviewId = Number(params.id);
  
  const [review, setReview] = useState<SlipReviewPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [randomizedTicket, setRandomizedTicket] = useState<SmartRandomizeResponse | null>(null);
  const [randomizing, setRandomizing] = useState(false);

  // Use the slip review hook for live updates when analysis is in progress
  const {
    status: liveStatus,
    progress: liveProgress,
    games: liveGames,
    isConnected,
    error: liveError,
    reconnect,
    fetchEventsFallback,
  } = useSlipReview();

  // Determine if we should show live progress
  const showLiveProgress = (liveStatus === "analysing" || liveStatus === "queued") && liveGames.length > 0;

  // Initial fetch to get current status and determine if we need live updates
  useEffect(() => {
    if (!isAuthed || !reviewId) return;

    const fetchReview = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get the slip review data - public view includes smart_randomize when available
        const data = await api.getSlipReviewPublic(reviewId);
        console.log("Review data:", data.status, data.smart_randomize, "games:", data.games?.length);
        setReview(data);

        // If analysis is in progress, connect to live updates
        if (data.status === "analysing" || data.status === "queued") {
          // Persist the review ID so refresh works
          localStorage.setItem("active_slip_review_id", String(reviewId));
          // Try to reconnect to WebSocket
          await reconnect();
        }
      } catch (err) {
        console.error("Failed to load slip review:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load slip review";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [isAuthed, reviewId, reconnect]);

  // Refresh token count when analysis completes (on detail page load)
  useEffect(() => {
    if (review && (review.status === "completed" || review.status === "partial")) {
      console.log("Analysis completed, refreshing token count...");
      triggerWalletRefresh();
    }
  }, [review?.status]);

  // Fallback polling if WebSocket fails
  useEffect(() => {
    if (!isAuthed || !reviewId) return;
    
    // If we have live status showing progress, set up polling as fallback
    if (liveStatus === "analysing" || liveStatus === "queued") {
      const interval = setInterval(() => {
        fetchEventsFallback();
      }, 5000); // Poll every 5 seconds as fallback

      return () => clearInterval(interval);
    }
  }, [isAuthed, reviewId, liveStatus, fetchEventsFallback]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthed) {
      window.location.href = "/login";
    }
  }, [authLoading, isAuthed]);

  // Handle smart randomize
  const handleRandomize = async (games: number) => {
    try {
      setRandomizing(true);
      const result = await api.randomizeSlipReview(reviewId, games);
      setRandomizedTicket(result);
      
      // Refresh token count after randomization completes
      console.log("Randomization completed, refreshing token count...");
      triggerWalletRefresh();
    } catch (err) {
      console.error("Failed to randomize:", err);
    } finally {
      setRandomizing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 w-64 bg-subtle-bg rounded" />
          <div className="h-48 bg-subtle-bg rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-64 bg-subtle-bg rounded-2xl" />
            <div className="h-64 bg-subtle-bg rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/slip-reviews"
          className="p-2 rounded-lg bg-subtle-bg hover:bg-brand-green/10 hover:text-brand-green transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-green/10">
              <ClipboardList className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Slip Review #{reviewId}
              </h1>
              <p className="text-sm text-muted-foreground">
                {showLiveProgress 
                  ? `${liveGames.length} selections being analyzed`
                  : `${review?.games?.length || 0} selections analyzed`
                }
              </p>
            </div>
          </div>
        </div>
        {review && (
          <span className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${getStatusStyle(showLiveProgress ? liveStatus : review.status)}`}>
            {getStatusIcon(showLiveProgress ? liveStatus : review.status)}
            {showLiveProgress ? liveStatus : review.status}
          </span>
        )}
      </div>

      {/* Live Progress Indicator */}
      {showLiveProgress && (
        <div className="mb-6 p-4 rounded-2xl bg-info-blue/10 border border-info-blue/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-info-blue animate-spin" />
              <span className="font-semibold text-info-blue">Analysis in Progress</span>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-win-green" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-xs text-muted-foreground">
                {isConnected ? "Live" : "Reconnecting..."}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {liveProgress && (
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{liveProgress.message || 'Analyzing selections...'}</span>
                <span className="font-medium text-info-blue">{liveProgress.percent}%</span>
              </div>
              <div className="h-2 bg-info-blue/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-info-blue rounded-full transition-all duration-500"
                  style={{ width: `${liveProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Live Games Grid */}
          <div className="grid gap-3 md:grid-cols-2">
            {liveGames.map((game, index) => (
              <div 
                key={game.id} 
                className="p-3 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                  {index < (liveProgress?.completed || 0) ? (
                    <CheckCircle2 className="w-4 h-4 text-win-green" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-info-blue animate-spin" />
                  )}
                </div>
                <div className="font-medium text-foreground text-sm truncate">{game.match}</div>
                <div className="text-xs text-muted-foreground">{game.user_pick?.market}</div>
                {game.user_pick?.confidence_score !== undefined && (
                  <div className="text-xs font-medium text-info-blue mt-1">
                    Confidence: {game.user_pick.confidence_score}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-danger-red/10 border border-danger-red/30 text-danger-red mb-6">
          {error}
        </div>
      )}

      {review && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {review.ticket && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Original Confidence */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-jet-surface-2 border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Slip</span>
                  </div>
                </div>
                <div className="text-3xl font-black text-foreground mb-1">{review.ticket.user_picks.confidence_score}%</div>
                <div className="text-sm font-medium text-muted-foreground mb-3">{review.ticket.user_picks.label}</div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(review.ticket.user_picks.summary).map(([key, val]) => (
                    <span key={key} className="text-[10px] px-2 py-1 rounded bg-subtle-bg text-muted-foreground capitalize">
                      {key}: {val}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Confidence */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-green/5 to-jet-surface-2 border border-brand-green/30 p-5">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-green/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center justify-between mb-4 relative">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-green" />
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-green">With AI Picks</span>
                  </div>
                </div>
                <div className="text-3xl font-black text-brand-green mb-1">{review.ticket.recommended_picks.confidence_score}%</div>
                <div className="text-sm font-medium text-muted-foreground mb-3">{review.ticket.recommended_picks.label}</div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[10px] px-2 py-1 rounded bg-brand-green/10 text-brand-green">
                    Est. odds: {review.ticket.recommended_picks.estimated_odds}
                  </span>
                  {review.ticket.recommended_picks.changes > 0 && (
                    <span className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-400">
                      {review.ticket.recommended_picks.changes} changes
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Verdict */}
          {review.ticket?.verdict && (
            <div className={`p-4 rounded-2xl border ${
              review.ticket.recommended_picks.changes > 0 
                ? "bg-amber-500/5 border-amber-500/30" 
                : "bg-win-green/5 border-win-green/30"
            }`}>
              <div className="flex items-start gap-3">
                {review.ticket.recommended_picks.changes > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-win-green shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-foreground">{review.ticket.verdict.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{review.ticket.verdict.message}</div>
                </div>
              </div>
            </div>
          )}

          {/* Smart Randomize Section */}
          {!randomizedTicket && review.status === "completed" && review.smart_randomize?.available && (
            <div className="rounded-2xl border border-brand-green/30 bg-brand-green/5 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-brand-green" />
                <h3 className="text-lg font-bold text-foreground">Smart Randomize</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {review.smart_randomize.message}
              </p>
              <div className="flex flex-wrap gap-2">
                {review.smart_randomize.options.map((num) => (
                  <button
                    key={num}
                    onClick={() => handleRandomize(num)}
                    disabled={randomizing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-green text-primary-foreground font-semibold hover:bg-brand-green/90 transition-all disabled:opacity-50"
                  >
                    {randomizing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Randomize by {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Randomized Ticket Display */}
          {randomizedTicket && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-brand-green/30 bg-brand-green/5 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-brand-green" />
                    <h3 className="text-lg font-bold text-foreground">Randomized Ticket</h3>
                  </div>
                  <button
                    onClick={() => setRandomizedTicket(null)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Show original
                  </button>
                </div>
                
                {/* Randomized Ticket Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-black text-brand-green">{randomizedTicket.ticket.total_games}</div>
                    <div className="text-xs text-muted-foreground">Games</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-brand-green">{randomizedTicket.ticket.confidence_score}%</div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-brand-green">
                      {randomizedTicket.ticket.estimated_odds ? randomizedTicket.ticket.estimated_odds.toFixed(2) : '--'}
                    </div>
                    <div className="text-xs text-muted-foreground">Est. Odds</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-brand-green">
                      {randomizedTicket.ticket.estimated_success_percent ? randomizedTicket.ticket.estimated_success_percent.toFixed(1) : '--'}%
                    </div>
                    <div className="text-xs text-muted-foreground">Est. Success</div>
                  </div>
                </div>

                {/* Randomized Picks */}
                <div className="space-y-2">
                  {randomizedTicket.picks.map((pick, index) => (
                    <div key={pick.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                        <div>
                          <div className="font-medium text-foreground">{pick.match}</div>
                          <div className="text-sm text-muted-foreground">{pick.market}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-brand-green">{pick.odds ? `@${pick.odds}` : '--'}</div>
                        <div className="text-xs text-muted-foreground">{pick.confidence_score}%</div>
                      </div>
                    </div>
                  ))}
                </div>

                {randomizedTicket.disclaimer && (
                  <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
                    {randomizedTicket.disclaimer}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Game Cards - use live games when in progress */}
          {!randomizedTicket && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">Selections</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(showLiveProgress ? liveGames : review?.games || []).length > 0 ? (
                (showLiveProgress ? liveGames : review?.games || []).map((game, index) => (
                  <SlipReviewCard
                    key={game.id}
                    game={game}
                    order={index + 1}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  {showLiveProgress ? 'Analysing selections...' : 'No games available'}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Disclaimer */}
          {review.disclaimer && (
            <p className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
              {review.disclaimer}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => {
            sessionStorage.setItem("slip_review_start_fresh", "true");
            navigate({ to: "/slip-review/new" });
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green text-primary-foreground font-semibold hover:bg-brand-green/90 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Analyze New Slip
        </button>
      </div>
    </div>
  );
}
