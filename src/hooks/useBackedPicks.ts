/**
 * Global backed picks storage using localStorage + React state.
 * Provides reactive count and list of backed picks across components.
 */
import { useState, useEffect } from "react";

const STORAGE_KEY = "terminal.backed.count";
const PICKS_KEY = "terminal.backed.picks";

export interface BackedPick {
  id: number;
  match: string;
  home_team: string;
  away_team: string;
  market: string;
  odds: number;
  league: string;
  confidence?: number;
}

function getStoredCount(): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored, 10) || 0 : 0;
}

function getStoredPicks(): BackedPick[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(PICKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredCount(count: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(count));
}

function setStoredPicks(picks: BackedPick[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PICKS_KEY, JSON.stringify(picks));
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
  const existing = getStoredPicks();
  if (existing.some(p => p.id === pick.id)) return;
  const updated = [...existing, pick];
  setStoredPicks(updated);
  setStoredCount(updated.length);
  getBC()?.postMessage("update");
  window.dispatchEvent(new Event("bp-backed-update"));
}

export function removeBackedPick(id: number) {
  const existing = getStoredPicks();
  const updated = existing.filter(p => p.id !== id);
  setStoredPicks(updated);
  setStoredCount(updated.length);
  getBC()?.postMessage("update");
  window.dispatchEvent(new Event("bp-backed-update"));
}

export function clearAllBackedPicks() {
  setStoredPicks([]);
  setStoredCount(0);
  getBC()?.postMessage("update");
  window.dispatchEvent(new Event("bp-backed-update"));
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
  getBC()?.postMessage("update");
  window.dispatchEvent(new Event("bp-backed-update"));
}

export function syncBackedCount(picks: { id: number }[]) {
  setStoredCount(picks?.length || 0);
  window.dispatchEvent(new Event("bp-backed-update"));
}
