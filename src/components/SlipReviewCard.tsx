import type { GameData, UserPick, RecommendedPick } from "../lib/api";
import { ArrowRight, Target, TrendingUp } from "lucide-react";

interface SlipReviewCardProps {
  game: GameData;
  order: number;
  recommendedPick?: RecommendedPick & { match: string; action: string; changed: boolean; included_in_estimate: boolean };
}

const confidenceColors = {
  Low: { bar: "bg-danger-red", text: "text-danger-red", bg: "bg-danger-red/10" },
  Medium: { bar: "bg-amber-400", text: "text-amber-400", bg: "bg-amber-400/10" },
  Good: { bar: "bg-win-green", text: "text-win-green", bg: "bg-win-green/10" },
  High: { bar: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10" },
};

function getConfidenceStyle(label: string) {
  return confidenceColors[label as keyof typeof confidenceColors] ?? confidenceColors.Low;
}

function getVerdictStyle(verdict: string) {
  switch (verdict) {
    case "replace":
      return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", label: "Replace" };
    case "caution":
      return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", label: "Caution" };
    case "risky":
      return { bg: "bg-danger-red/10", border: "border-danger-red/30", text: "text-danger-red", label: "Risky" };
    case "playable":
      return { bg: "bg-win-green/10", border: "border-win-green/30", text: "text-win-green", label: "Playable" };
    case "strong":
      return { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", label: "Strong" };
    default:
      return { bg: "bg-muted", border: "border-border", text: "text-muted-foreground", label: verdict || "Unknown" };
  }
}

export function SlipReviewCard({ game, order, recommendedPick }: SlipReviewCardProps) {
  const confidenceStyle = getConfidenceStyle(game.user_pick.confidence_label);
  
  // Use recommendation action for verdict badge if available, otherwise fall back to user_pick.verdict
  const verdictKey = game.recommendation?.action || game.user_pick.verdict;
  const verdictStyle = getVerdictStyle(verdictKey);
  
  // Get recommendation from game data or prop
  const recommendation = game.recommendation;
  const hasRecommendation = recommendation?.action === "replace" && recommendation?.pick;
  const recPick = recommendedPick || (hasRecommendation ? recommendation.pick : undefined);
  const isChanged = recommendedPick?.changed || hasRecommendation;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-jet-surface-2 border border-border hover:border-brand-green/40 transition-all hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">#{order}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${verdictStyle.bg} ${verdictStyle.text} ${verdictStyle.border}`}>
          {verdictStyle.label}
        </span>
      </div>

      {/* Match */}
      <div className="px-4">
        <div className="font-bold text-[15px] text-foreground mb-0.5">{game.match}</div>
        <div className="text-xs text-muted-foreground mb-3">{game.kickoff}</div>

        {/* User Pick */}
        <div className="rounded-xl bg-subtle-bg p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Your Pick</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">{game.user_pick.market}</span>
            <span className="text-sm font-mono text-muted-foreground">@{game.user_pick.odds.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
              <div
                className={`h-full ${confidenceStyle.bar}`}
                style={{ width: `${Math.min(100, game.user_pick.confidence_score)}%` }}
              />
            </div>
            <span className={`text-[11px] font-bold ${confidenceStyle.text}`}>
              {game.user_pick.confidence_score}%
            </span>
          </div>
        </div>

        {/* Recommendation */}
        {recPick && isChanged && (
          <div className="rounded-xl bg-brand-green/10 border border-brand-green/30 p-3 mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3 h-3 text-brand-green" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green">Recommended</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{recPick.market}</span>
              <span className="text-sm font-mono text-brand-green">{recPick.confidence_score}%</span>
            </div>
          </div>
        )}

        {/* Analysis Summary */}
        {game.analysis.conclusion && (
          <div className="text-xs text-muted-foreground pb-3">
            {game.analysis.conclusion}
          </div>
        )}
      </div>
    </div>
  );
}
