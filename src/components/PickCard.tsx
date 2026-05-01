import { Link } from "@tanstack/react-router";
import type { PickSummary } from "@/lib/api";
import { tierLabel } from "@/lib/stake";
import { formatKickoff } from "@/lib/time";

const tierStyles = {
  banker: { pill: "bg-brand-green-light text-brand-green", bar: "bg-brand-green", text: "text-brand-green" },
  gem: { pill: "bg-amber-bg text-amber-text", bar: "bg-amber-text", text: "text-amber-text" },
  wildcard: { pill: "bg-subtle-bg text-body-text", bar: "bg-body-text", text: "text-body-text" },
} as const;

export function PickCard({ pick, top = false }: { pick: PickSummary; top?: boolean }) {
  const s = tierStyles[pick.tier];
  return (
    <Link
      to="/match/$id"
      params={{ id: pick.id }}
      className={`block bg-card rounded-lg border ${
        top ? "border-brand-green border-2" : "border-brand-border"
      } p-4 min-h-[56px] hover:shadow-sm transition-shadow`}
    >
      {top && (
        <div className="text-[11px] uppercase tracking-wide text-brand-green font-semibold mb-1">
          Best pick today
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[16px] text-body-text">{pick.match}</div>
          <div className="text-[13px] text-muted-foreground mt-0.5">
            {pick.market_plain} · {formatKickoff(pick.kickoff_wat)}
          </div>
        </div>
        <span className={`shrink-0 text-[11px] px-2 py-1 rounded font-medium ${s.pill}`}>
          {tierLabel(pick.tier)}
        </span>
      </div>
      <p className="italic text-[14px] text-body-text mt-2">{pick.one_line_reason}</p>
      <div className="flex items-center gap-3 mt-3">
        <div className="flex-1 h-2 bg-subtle-bg rounded-full overflow-hidden">
          <div
            className={`h-full ${s.bar}`}
            style={{ width: `${Math.min(100, pick.confidence)}%` }}
          />
        </div>
        <span className={`text-[15px] font-medium ${s.text}`}>
          {pick.confidence.toFixed(1)}%
        </span>
      </div>
    </Link>
  );
}