import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, type SlipReviewPublic, type SlipReviewListItem, type SlipReviewsResponse } from "@/lib/api";
import { SlipReviewCard } from "@/components/SlipReviewCard";

export const Route = createFileRoute("/slip-review/$id")({
  head: () => ({
    meta: [
      { title: "Slip Review Details - Betpreneur" },
      { name: "description", content: "View your SportyBet slip review details." },
    ],
  }),
  component: SlipReviewDetailPage,
});

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-brand-green/20 text-brand-green border-brand-green/40";
    case "partial":
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    case "failed":
      return "bg-red-500/20 text-red-400 border-red-500/40";
    case "analysing":
      return "bg-blue-500/20 text-blue-400 border-blue-500/40";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/40";
  }
}

function SlipReviewDetailPage() {
  const { isAuthed, authLoading } = useAuth();
  const params = Route.useParams();
  const reviewId = Number(params.id);
  
  const [review, setReview] = useState<SlipReviewPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthed || !reviewId) return;

    const fetchReview = async () => {
      try {
        setLoading(true);
        const data = await api.getSlipReviewPublic(reviewId);
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

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-subtle-bg rounded" />
          <div className="h-32 bg-subtle-bg rounded-xl" />
          <div className="h-48 bg-subtle-bg rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to="/slip-reviews"
            className="text-sm text-muted-foreground hover:text-brand-green mb-1 inline-flex items-center gap-1"
          >
            ← Back to Slip Reviews
          </Link>
          <h1 className="text-xl font-bold text-body-text">
            Slip Review #{reviewId}
          </h1>
        </div>
        {review && (
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(review.status)}`}>
            {review.status}
          </span>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mb-4">
          {error}
        </div>
      )}

      {review && (
        <div className="space-y-6">
          {/* Summary Card */}
          {review.ticket && (
            <div className="p-4 rounded-xl bg-card border border-border">
              <h2 className="font-semibold text-body-text mb-4">Analysis Summary</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-subtle-bg">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Your Confidence</div>
                  <div className="text-xl font-bold text-body-text">{review.ticket.user_picks.label}</div>
                  <div className="text-sm text-muted-foreground">{review.ticket.user_picks.confidence_score}%</div>
                </div>
                <div className="p-3 rounded-lg bg-subtle-bg">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">With Recommendations</div>
                  <div className="text-xl font-bold text-brand-green">{review.ticket.recommended_picks.label}</div>
                  <div className="text-sm text-muted-foreground">{review.ticket.recommended_picks.confidence_score}%</div>
                </div>
              </div>

              {review.ticket.verdict && (
                <div className={`p-3 rounded-lg ${review.ticket.recommended_picks.changes > 0 ? "bg-amber-500/10 border border-amber-500/30" : "bg-green-500/10 border border-green-500/30"}`}>
                  <div className="font-medium text-body-text">{review.ticket.verdict.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{review.ticket.verdict.message}</div>
                </div>
              )}

              {review.disclaimer && (
                <p className="text-xs text-muted-foreground mt-4">{review.disclaimer}</p>
              )}
            </div>
          )}

          {/* Game Cards */}
          <div className="space-y-4">
            <h2 className="font-semibold text-body-text">
              Selections {review.games?.length > 0 && `(${review.games.length})`}
            </h2>
            
            {review.games && review.games.length > 0 ? (
              review.games.map((game, index) => (
                <SlipReviewCard
                  key={game.id}
                  game={game}
                  order={index + 1}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No games available
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8">
        <Link
          to="/slip-review"
          className="inline-block px-4 py-2 rounded-lg bg-brand-green text-primary-foreground text-sm font-medium hover:bg-brand-green/90 transition-colors"
        >
          Analyze New Slip
        </Link>
      </div>
    </div>
  );
}
