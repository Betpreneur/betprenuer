import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, type SlipReviewsResponse, type SlipReviewListItem } from "@/lib/api";
import { ClipboardList, Plus, ArrowRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export const Route = createFileRoute("/slip-reviews")({
  head: () => ({
    meta: [
      { title: "My Slip Reviews - Betpreneur" },
      { name: "description", content: "View your SportyBet slip reviews." },
    ],
  }),
  component: SlipReviewsPage,
});

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-win-green" />;
    case "partial":
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-danger-red" />;
    default:
      return <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />;
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

function getVerdictStyle(verdict: string, action: string) {
  if (action === "replace") {
    return { icon: "🔄", bg: "bg-amber-500/10", text: "text-amber-400", label: "Replace" };
  }
  switch (verdict) {
    case "risky":
      return { icon: "⚠️", bg: "bg-danger-red/10", text: "text-danger-red", label: "Risky" };
    case "playable":
      return { icon: "✅", bg: "bg-win-green/10", text: "text-win-green", label: "Playable" };
    case "strong":
      return { icon: "💎", bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Strong" };
    default:
      return { icon: "❓", bg: "bg-muted", text: "text-muted-foreground", label: verdict };
  }
}

function SlipReviewItem({ review }: { review: SlipReviewListItem }) {
  const changesCount = review.picks.filter(p => p.ai_pick.action === "replace").length;
  
  // Handle click to persist in-progress reviews
  const handleClick = (e: React.MouseEvent) => {
    if (review.status === "analysing" || review.status === "queued") {
      localStorage.setItem("active_slip_review_id", String(review.id));
    }
  };
  
  return (
    <Link
      to="/slip-review/$id"
      params={{ id: String(review.id) }}
      className="block group"
      onClick={handleClick}
    >
      <div className="relative h-full flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border hover:border-brand-green/60 hover:shadow-[0_10px_30px_-12px_rgba(34,197,94,0.35)] hover:-translate-y-0.5 transition-all duration-200">
        {/* Status strip */}
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-2">
            {getStatusIcon(review.status)}
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {review.number_of_games} {review.number_of_games === 1 ? "selection" : "selections"}
            </span>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getStatusStyle(review.status)}`}>
            {review.status}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {/* Picks Preview */}
          <div className="space-y-3">
            {review.picks.slice(0, 3).map((pick, index) => {
              const verdictStyle = getVerdictStyle(pick.your_pick.verdict, pick.ai_pick.action);
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-[13px] text-foreground truncate flex-1 font-medium">{pick.match}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[12px] text-muted-foreground line-through">{pick.your_pick.market}</span>
                    {pick.ai_pick.action === "replace" && (
                      <>
                        <ArrowRight className="w-3 h-3 text-brand-green" />
                        <span className="text-[12px] font-semibold text-brand-green">
                          {pick.ai_pick.market}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {review.picks.length > 3 && (
              <div className="text-[11px] text-muted-foreground">
                +{review.picks.length - 3} more selections
              </div>
            )}
          </div>

          {/* Changes indicator */}
          {changesCount > 0 && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2 text-amber-400">
                <span className="text-xs font-semibold">{changesCount} pick{changesCount > 1 ? "s" : ""} recommended to change</span>
              </div>
            </div>
          )}
        </div>

        {/* Arrow indicator */}
        <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="w-5 h-5 text-brand-green" />
        </div>
      </div>
    </Link>
  );
}

function SlipReviewsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-40 rounded-2xl bg-card border border-border animate-pulse" />
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-green/10">
            <ClipboardList className="w-6 h-6 text-brand-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Slip Reviews</h1>
            <p className="text-sm text-muted-foreground">
              {reviews?.count || 0} slip{reviews?.count !== 1 ? "s" : ""} analyzed
            </p>
          </div>
        </div>
        <Link
          to="/slip-review/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green text-primary-foreground text-sm font-semibold hover:bg-brand-green/90 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          New Review
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger-red/10 border border-danger-red/30 text-danger-red mb-6">
          {error}
        </div>
      )}

      {reviews && reviews.reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-2xl">
          <div className="p-4 rounded-full bg-subtle-bg mb-4">
            <ClipboardList className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">No slip reviews yet</p>
          <Link
            to="/slip-review/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green text-primary-foreground text-sm font-semibold hover:bg-brand-green/90 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Analyze Your First Slip
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews?.reviews.map((review) => (
            <SlipReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
