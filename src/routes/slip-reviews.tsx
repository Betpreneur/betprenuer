import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, type SlipReviewsResponse, type SlipReviewListItem } from "@/lib/api";

export const Route = createFileRoute("/slip-reviews")({
  head: () => ({
    meta: [
      { title: "My Slip Reviews - Betpreneur" },
      { name: "description", content: "View your SportyBet slip reviews." },
    ],
  }),
  component: SlipReviewsPage,
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

function getVerdictColor(verdict: string) {
  switch (verdict) {
    case "replace":
      return "text-amber-400";
    case "risky":
      return "text-red-400";
    case "playable":
      return "text-brand-green";
    case "strong":
      return "text-emerald-400";
    default:
      return "text-gray-400";
  }
}

function SlipReviewItem({ review }: { review: SlipReviewListItem }) {
  return (
    <Link
      to="/slip-review/$id"
      params={{ id: String(review.id) }}
      className="block group"
    >
      <div className="bg-card border border-border rounded-xl p-4 hover:border-brand-green/40 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-body-text">#{review.id}</span>
            <span className="text-xs text-muted-foreground">
              {review.number_of_games} {review.number_of_games === 1 ? "game" : "games"}
            </span>
          </div>
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(review.status)}`}>
            {review.status}
          </span>
        </div>

        {/* Picks Preview */}
        <div className="space-y-2">
          {review.picks.slice(0, 3).map((pick, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate flex-1">{pick.match}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-muted-foreground line-through">{pick.your_pick.market}</span>
                {pick.ai_pick.action === "replace" && (
                  <>
                    <span className="text-brand-green">→</span>
                    <span className={`font-medium ${getVerdictColor(pick.ai_pick.action)}`}>
                      {pick.ai_pick.market}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
          {review.picks.length > 3 && (
            <div className="text-xs text-muted-foreground">
              +{review.picks.length - 3} more
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function SlipReviewsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-20 bg-subtle-bg rounded" />
            <div className="h-5 w-16 bg-subtle-bg rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-subtle-bg rounded" />
            <div className="h-4 w-3/4 bg-subtle-bg rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SlipReviewsPage() {
  const { isAuthed, authLoading } = useAuth();
  const [reviews, setReviews] = useState<SlipReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthed) return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const data = await api.getSlipReviews();
        setReviews(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load slip reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [isAuthed]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthed) {
      window.location.href = "/login";
    }
  }, [authLoading, isAuthed]);

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-body-text mb-6">My Slip Reviews</h1>
        <SlipReviewsSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-body-text">My Slip Reviews</h1>
          <p className="text-sm text-muted-foreground">
            {reviews?.count || 0} slip reviews
          </p>
        </div>
        <Link
          to="/slip-review"
          className="px-4 py-2 rounded-lg bg-brand-green text-primary-foreground text-sm font-medium hover:bg-brand-green/90 transition-colors"
        >
          New Review
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mb-4">
          {error}
        </div>
      )}

      {reviews && reviews.reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No slip reviews yet</p>
          <Link
            to="/slip-review"
            className="inline-block px-4 py-2 rounded-lg bg-brand-green text-primary-foreground text-sm font-medium hover:bg-brand-green/90 transition-colors"
          >
            Analyze Your First Slip
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews?.reviews.map((review) => (
            <SlipReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
