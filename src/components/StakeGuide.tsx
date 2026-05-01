import { useAuth } from "@/lib/auth";
import { naira, potentialWin, stakeFor, type Tier } from "@/lib/stake";

const rows: { tier: Tier; label: string; pct: string }[] = [
  { tier: "banker", label: "Banker", pct: "3%" },
  { tier: "gem", label: "Value Gem", pct: "2%" },
  { tier: "wildcard", label: "Wildcard", pct: "1%" },
];

export function StakeGuide({ odds, highlight }: { odds: number; highlight?: Tier }) {
  const { user } = useAuth();
  const bankroll = user?.bankroll ?? 50000;

  return (
    <div className="bg-card border border-brand-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-brand-border bg-white/5">
        <h3 className="text-foreground font-semibold text-[15px]">Stake guide</h3>
        <p className="text-[12px] text-muted-foreground">
          Based on your bankroll: {naira(bankroll)}
        </p>
      </div>
      <table className="w-full text-[14px]">
        <thead>
          <tr className="text-left text-muted-foreground text-[12px] uppercase tracking-wide">
            <th className="px-4 py-2 font-medium">Tier</th>
            <th className="px-4 py-2 font-medium">Your stake</th>
            <th className="px-4 py-2 font-medium">Potential win</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const stake = stakeFor(bankroll, r.tier);
            const win = potentialWin(stake, odds);
            const isActive = highlight === r.tier;
            return (
              <tr
                key={r.tier}
                className={`border-t border-brand-border ${
                isActive ? "bg-win-green-bg/40" : ""
                }`}
              >
                <td className="px-4 py-3">
                <div className="font-medium text-foreground">{r.label}</div>
                  <div className="text-[11px] text-muted-foreground">{r.pct}</div>
                </td>
              <td className="px-4 py-3 font-semibold text-[18px] text-foreground">{naira(stake)}</td>
              <td className="px-4 py-3 text-win-green font-medium">{naira(win)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[11px] text-muted-foreground px-4 py-2 border-t border-brand-border">
        Potential win is illustrative — actual payout depends on odds at your bookmaker.
      </p>
    </div>
  );
}