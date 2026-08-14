import type { GameData, UserPick, RecommendedPick } from "../lib/api";

interface SlipReviewCardProps {
  game: GameData;
  order: number;
  recommendedPick?: RecommendedPick & { match: string; action: string; changed: boolean; included_in_estimate: boolean };
}

const confidenceColors = {
  Low: { bg: "bg-red-500/20", text: "text-red-400", bar: "bg-red-500" },
  Medium: { bg: "bg-yellow-500/20", text: "text-yellow-400", bar: "bg-yellow-500" },
  Good: { bg: "bg-green-500/20", text: "text-green-400", bar: "bg-green-500" },
  High: { bg: "bg-emerald-500/20", text: "text-emerald-400", bar: "bg-emerald-500" },
};

function getConfidenceStyle(label: string) {
  return confidenceColors[label as keyof typeof confidenceColors] ?? confidenceColors.Low;
}

function getVerdictStyle(verdict: string) {
  switch (verdict) {
    case "replace":
      return { bg: "bg-amber-500/20", border: "border-amber-500/50", text: "text-amber-400", label: "Replace" };
    case "risky":
      return { bg: "bg-red-500/20", border: "border-red-500/50", text: "text-red-400", label: "Risky" };
    case "playable":
      return { bg: "bg-green-500/20", border: "border-green-500/50", text: "text-green-400", label: "Playable" };
    case "strong":
      return { bg: "bg-emerald-500/20", border: "border-emerald-500/50", text: "text-emerald-400", label: "Strong" };
    default:
      return { bg: "bg-gray-500/20", border: "border-gray-500/50", text: "text-gray-400", label: "Unknown" };
  }
}

export function SlipReviewCard({ game, order, recommendedPick }: SlipReviewCardProps) {
  const confidenceStyle = getConfidenceStyle(game.user_pick.confidence_label);
  const verdictStyle = getVerdictStyle(game.user_pick.verdict);

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-brand-green/30 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">#{order}</span>
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${verdictStyle.bg} ${verdictStyle.text} border ${verdictStyle.border}`}>
          {verdictStyle.label}
        </span>
      </div>

      {/* Match */}
      <div className="font-semibold text-[16px] text-body-text mb-1">{game.match}</div>
      <div className="text-[13px] text-muted-foreground mb-3">{game.kickoff}</div>

      {/* User Pick */}
      <div className="bg-subtle-bg rounded-lg p-3 mb-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Your Pick</div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-body-text">{game.user_pick.market}</span>
          <span className="text-[14px] font-mono text-muted-foreground">{game.user_pick.odds.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
            <div
              className={`h-full ${confidenceStyle.bar}`}
              style={{ width: `${Math.min(100, game.user_pick.confidence_score)}%` }}
            />
          </div>
          <span className={`text-[12px] font-medium ${confidenceStyle.text}`}>
            {game.user_pick.confidence_score}% · {game.user_pick.confidence_label}
          </span>
        </div>
      </div>

      {/* Recommendation */}
      {recommendedPick && recommendedPick.changed && (
        <div className="bg-brand-green/10 border border-brand-green/30 rounded-lg p-3">
          <div className="text-[11px] uppercase tracking-wider text-brand-green mb-1">Recommended Change</div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-body-text">{recommendedPick.market}</span>
            <span className="text-[14px] font-mono text-brand-green">{recommendedPick.confidence_score}%</span>
          </div>
          <div className="text-[12px] text-muted-foreground mt-1">
            Confidence: {recommendedPick.confidence_label}
          </div>
        </div>
      )}

      {/* Analysis Summary */}
      {game.analysis.conclusion && (
        <div className="mt-3 text-[13px] text-muted-foreground">
          {game.analysis.conclusion}
        </div>
      )}
    </div>
  );
}
