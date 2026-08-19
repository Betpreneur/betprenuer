import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { api, type SlipReviewPublic, type SlipReviewListItem, type SlipReviewsResponse, type SmartRandomizeResponse } from "@/lib/api";
import { SlipReviewCard } from "@/components/SlipReviewCard";
import { ArrowLeft, ClipboardList, Plus, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Target, Sparkles, Loader2 } from "lucide-react";

// Obscure data source names to hide from end users
const obscureSource = (source: string): string => {
  const mapping: Record<string, string> = {
    "Api-Football": "OddsFeed",
    "Statpal": "ModelScore",
    "OddsJam": "EdgeCalc",
  };
  return mapping[source] || source;
};

const obscureReason = (reason: string): string => {
  // Replace source names in reason strings
  let obscured = reason;
  const sourceMapping: Record<string, string> = {
    "Api-Football": "primary feed",
    "Statpal": "analytics model",
    "OddsJam": "betting engine",
  };
  
  for (const [original, replacement] of Object.entries(sourceMapping)) {
    obscured = obscured.replace(new RegExp(original, "gi"), replacement);
  }
  return obscured;
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
  const params = Route.useParams();
  const reviewId = Number(params.id);
  
  const [review, setReview] = useState<SlipReviewPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [randomizedTicket, setRandomizedTicket] = useState<SmartRandomizeResponse | null>(null);
  const [randomizing, setRandomizing] = useState(false);

  useEffect(() => {
    if (!isAuthed || !reviewId) return;

    const fetchReview = async () => {
      try {
        setLoading(true);
        
        // Get the slip review data - public view includes smart_randomize when available
        const data = await api.getSlipReviewPublic(reviewId);
        console.log("Review data:", data.status, data.smart_randomize);
        setReview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load slip review");
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [isAuthed, reviewId]);

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
                {review?.games?.length || 0} selections analyzed
              </p>
            </div>
          </div>
        </div>
        {review && (
          <span className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${getStatusStyle(review.status)}`}>
            {getStatusIcon(review.status)}
            {review.status}
          </span>
        )}
      </div>

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
                <div className="text-sm font-medium text-muted-foreground mb-1">{review.ticket.user_picks.label}</div>
                <div className="text-xs text-muted-foreground mb-3">
                  Est. success: {review.ticket.user_picks.estimated_success_percent?.toFixed(1)}%
                </div>
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
                <div className="text-sm font-medium text-muted-foreground mb-1">{review.ticket.recommended_picks.label}</div>
                <div className="text-xs text-muted-foreground mb-3">
                  Est. success: {review.ticket.recommended_picks.estimated_success_percent?.toFixed(1)}%
                </div>
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
                    <div className="text-2xl font-black text-brand-green">{randomizedTicket.ticket.estimated_odds.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Est. Odds</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-brand-green">{randomizedTicket.ticket.estimated_success_percent.toFixed(1)}%</div>
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
                        <div className="font-bold text-brand-green">@{pick.odds}</div>
                        <div className="text-xs text-muted-foreground">{pick.confidence_score}%</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Excluded picks */}
                {randomizedTicket.excluded.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Excluded picks:</div>
                    {randomizedTicket.excluded.map((ex) => (
                      <div key={ex.id} className="text-xs text-muted-foreground py-1">
                        • {ex.match}: {obscureReason(ex.reason)}
                      </div>
                    ))}
                  </div>
                )}

                {randomizedTicket.disclaimer && (
                  <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
                    {randomizedTicket.disclaimer}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Game Cards */}
          {!randomizedTicket && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">Selections</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {review.games && review.games.length > 0 ? (
                review.games.map((game, index) => (
                  <SlipReviewCard
                    key={game.id}
                    game={game}
                    order={index + 1}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  {review.status === "analysing" ? "Analyzing, check back later..." : "No games available"}
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
        <Link
          to="/slip-review/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green text-primary-foreground font-semibold hover:bg-brand-green/90 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Analyze New Slip
        </Link>
      </div>
    </div>
  );
}
