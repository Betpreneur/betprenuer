/**
 * Global backed-pick badge state.
 * Actual picks are saved and loaded from the backend API so they sync across devices.
 */
import { useState, useEffect } from "react";
import { todayLagosISO } from "@/lib/time";

const STORAGE_KEY = "terminal.backed.count";
const COUNT_DATE_KEY = "terminal.backed.count.date";
const LEGACY_PICKS_KEY = "terminal.backed.picks";

export interface BackedPick {
  id: number;
  match_id: string;
  match: string;
  home_team: string;
  away_team: string;
  market: string;
  odds: number;
  league: string;
  confidence?: number;
  /** Lagos date (YYYY-MM-DD) the pick was backed on — used to scope per day. */
  date?: string;
}

function getStoredCount(): number {
  if (typeof window === "undefined") return 0;
  localStorage.removeItem(LEGACY_PICKS_KEY);
  // Badge tracks newly-backed-but-unviewed picks for today only.
  // It resets on a new day and is cleared once the user opens My Picks.
  if (localStorage.getItem(COUNT_DATE_KEY) !== todayLagosISO()) return 0;
  return Number(localStorage.getItem(STORAGE_KEY) || 0);
}

export function getStoredPicks(): BackedPick[] {
  return [];
}

export function getPicksForDate(date: string): BackedPick[] {
  void date;
  return [];
}

function setStoredCount(count: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(Math.max(0, count)));
  localStorage.setItem(COUNT_DATE_KEY, todayLagosISO());
}

// Global broadcast channel for cross-tab/cross-component messaging
let bc: BroadcastChannel | null = null;
function getBC(): BroadcastChannel {
  if (!bc && typeof window !== "undefined") {
    bc = new BroadcastChannel("bp-backed");
    bc.onmessage = () => window.dispatchEvent(new Event("storage"));
  }
  return bc!;
}

export function useBackedCount() {
  const [count, setCount] = useState(getStoredCount);

  useEffect(() => {
    const handler = () => setCount(getStoredCount());
    window.addEventListener("storage", handler);
    const ch = () => setCount(getStoredCount());
    window.addEventListener("bp-backed-update", ch);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("bp-backed-update", ch);
    };
  }, []);

  return count;
}

export function useBackedPicks() {
  const [picks, setPicks] = useState<BackedPick[]>(getStoredPicks);

  useEffect(() => {
    const handler = () => setPicks(getStoredPicks());
    window.addEventListener("storage", handler);
    const ch = () => setPicks(getStoredPicks());
    window.addEventListener("bp-backed-update", ch);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("bp-backed-update", ch);
    };
  }, []);

  return picks;
}

export function addBackedPick(pick: BackedPick) {
  void pick;
  addBackedCount("");
}

export function removeBackedPick(id: number) {
  void id;
  getBC()?.postMessage("update");
  window.dispatchEvent(new Event("bp-backed-update"));
}

export function clearAllBackedPicks() {
  clearBackedCount();
}

export function addBackedCount(_id: number | string) {
  setStoredCount(getStoredCount() + 1);
  getBC()?.postMessage("update");
  window.dispatchEvent(new Event("bp-backed-update"));
}

export function removeBackedCount(_id: number | string) {
  const c = getStoredCount();
  if (c <= 0) return;
  setStoredCount(c - 1);
  getBC()?.postMessage("update");
  window.dispatchEvent(new Event("bp-backed-update"));
}

export function clearBackedCount() {
  setStoredCount(0);
  if (typeof window !== "undefined") localStorage.removeItem(LEGACY_PICKS_KEY);
  getBC()?.postMessage("update");
  window.dispatchEvent(new Event("bp-backed-update"));
}

export function syncBackedCount(picks: { id: number }[]) {
  setStoredCount(picks?.length || 0);
  window.dispatchEvent(new Event("bp-backed-update"));
}
