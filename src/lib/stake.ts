export type Tier = "banker" | "gem" | "wildcard";

const PCT: Record<Tier, number> = { banker: 0.03, gem: 0.02, wildcard: 0.01 };

export function tierLabel(tier: Tier): string {
  return tier === "banker" ? "Banker" : tier === "gem" ? "Value Gem" : "Wildcard";
}

export function stakeFor(bankroll: number, tier: Tier): number {
  const raw = bankroll * PCT[tier];
  return Math.round(raw / 100) * 100;
}

export function potentialWin(stake: number, odds: number): number {
  const raw = stake * odds - stake;
  return Math.round(raw / 10) * 10;
}

export function naira(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}