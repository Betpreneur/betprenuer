import type { Tier } from "@/lib/stake";

/**
 * Bankroll-based stake guide.
 *
 * SUSPENDED: The bankroll feature is hidden across the app for now.
 * This component intentionally renders nothing so callers don't need to
 * change. Re-enable by restoring the table UI when bankroll comes back.
 */
export function StakeGuide(_props: { odds: number; highlight?: Tier }) {
  return null;
}
