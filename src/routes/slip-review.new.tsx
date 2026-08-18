import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useSlipReview } from "@/hooks/useSlipReview";
import { SlipReviewCard } from "@/components/SlipReviewCard";

export const Route = createFileRoute("/slip-review/new")({
  head: () => ({
    meta: [
      { title: "New Slip Review - Betpreneur" },
      { name: "description", content: "Analyze your SportyBet slip with AI." },
    ],
  }),
  component: SlipReviewPage,
});

function SlipReviewPage() {
  const { isAuthed, authLoading } = useAuth();
  const navigate = useNavigate();
  // Get code from URL search params directly
  const [code, setCode] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("code") || "";
    }
    return "";
  });
  
  const {
    reviewId,
    status,
    progress,
    games,
    isConnected,
    error,
    finalReview,
    startReview,
    reconnect,
    fetchEventsFallback,
  } = useSlipReview();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthed) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthed, navigate]);

  // Auto-submit only when code is provided via URL (not for manual typing)
  const hasUrlCode = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("code");
  
  useEffect(() => {
    if (hasUrlCode && code.trim() && isAuthed && !reviewId) {
      startReview(code.trim(), 3);
    }
  }, [hasUrlCode, code, isAuthed, reviewId, startReview]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      startReview(code.trim(), 3);
    }
  };

  const handleReconnect = async () => {
    await reconnect();
  };

  const handleFetchEvents = async () => {
    await fetchEventsFallback();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full" />
      </div>
    );
  }

  // Initial form state
  if (!reviewId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-body-text mb-2">Slip Review</h1>
          <p className="text-muted-foreground">
            Import your SportyBet slip for AI-powered analysis
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-body-text mb-1">
              Slip Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., V5AU3U"
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-body-text placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full py-3 px-4 rounded-lg bg-brand-green text-primary-foreground font-medium hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Analyze Slip
          </button>
        </form>

        <div className="mt-8 p-4 rounded-lg bg-subtle-bg">
          <h3 className="font-medium text-body-text mb-2">How it works</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>1. Enter your SportyBet slip code or share URL</li>
            <li>2. We'll analyze each selection in real-time</li>
            <li>3. Get recommendations for risky picks</li>
            <li>4. See improved alternatives with higher success rates</li>
          </ul>
        </div>
      </div>
    );
  }

  // Loading/Analysis state
  const terminalStatuses = ["completed", "partial", "failed"];
  const isTerminal = terminalStatuses.includes(status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-body-text">Slip Review</h1>
          <p className="text-sm text-muted-foreground">
            {isTerminal ? `Status: ${status}` : "Analyzing your slip..."}
          </p>
        </div>
        
        {/* Connection status */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-brand-green" : "bg-yellow-500"}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? "Live" : "Reconnecting..."}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {progress && !isTerminal && (
        <div className="mb-6 p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-body-text">{progress.message || progress.phase}</span>
            <span className="text-sm text-muted-foreground">{progress.percent}%</span>
          </div>
          <div className="h-2 bg-subtle-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-green transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{progress.completed} of {progress.total} selections analyzed</span>
            {!isConnected && (
              <button
                onClick={handleReconnect}
                className="text-brand-green hover:underline"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {status === "failed" && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-red-400">{error || "Slip review failed. Please try again."}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Final Review Results */}
      {finalReview && (
        <div className="space-y-6">
          {/* Summary Card */}
          {finalReview.ticket && (
            <div className="p-4 rounded-xl bg-card border border-border">
              <h2 className="font-semibold text-body-text mb-4">Analysis Summary</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-subtle-bg">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Your Confidence</div>
                  <div className="text-xl font-bold text-body-text">{finalReview.ticket.user_picks.label}</div>
                  <div className="text-sm text-muted-foreground">{finalReview.ticket.user_picks.confidence_score}%</div>
                </div>
                <div className="p-3 rounded-lg bg-subtle-bg">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">With Recommendations</div>
                  <div className="text-xl font-bold text-brand-green">{finalReview.ticket.recommended_picks.label}</div>
                  <div className="text-sm text-muted-foreground">{finalReview.ticket.recommended_picks.confidence_score}%</div>
                </div>
              </div>

              {finalReview.ticket.verdict && (
                <div className={`p-3 rounded-lg ${finalReview.ticket.recommended_picks.changes > 0 ? "bg-amber-500/10 border border-amber-500/30" : "bg-green-500/10 border border-green-500/30"}`}>
                  <div className="font-medium text-body-text">{finalReview.ticket.verdict.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{finalReview.ticket.verdict.message}</div>
                </div>
              )}

              {finalReview.disclaimer && (
                <p className="text-xs text-muted-foreground mt-4">{finalReview.disclaimer}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Game Cards */}
      <div className="space-y-4">
        <h2 className="font-semibold text-body-text">
          Selections {games.length > 0 && `(${games.length})`}
        </h2>
        
        {games.length === 0 && !isTerminal ? (
          <div className="text-center py-8 text-muted-foreground">
            Waiting for analysis to begin...
          </div>
        ) : (
          games.map((game, index) => (
            <SlipReviewCard
              key={game.id}
              game={game}
              order={index + 1}
            />
          ))
        )}
      </div>

      {/* Manual Event Fetch (fallback) */}
      {!isConnected && !isTerminal && (
        <div className="mt-6 text-center">
          <button
            onClick={handleFetchEvents}
            className="text-sm text-muted-foreground hover:text-brand-green"
          >
            Click to fetch latest updates
          </button>
        </div>
      )}
    </div>
  );
}
