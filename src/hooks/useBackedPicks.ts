/**
 * Simple global backed picks counter using localStorage + React state.
 * Provides reactive count across components.
 */
import { useState, useEffect } from "react";

const STORAGE_KEY = "terminal.backed.count";

function getStoredCount(): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored, 10) || 0 : 0;
}

function setStoredCount(count: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(count));
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