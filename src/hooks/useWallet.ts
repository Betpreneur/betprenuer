import { useState, useEffect, useCallback, useRef } from "react";
import { api, type WalletBalance, type TokenPackage, type PurchaseWithPackage, type VerifyPurchaseResponse, type PurchasesResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface WalletState {
  balance: WalletBalance | null;
  packages: TokenPackage[];
  purchases: PurchasesResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balance: null,
  packages: [],
  purchases: null,
  loading: false,
  error: null,
};

// Global refresh interval (30 seconds)
const AUTO_REFRESH_INTERVAL = 30000;

// Global refresh trigger for cross-component communication
let globalRefreshCallback: (() => void) | null = null;

export function useWallet() {
  const [state, setState] = useState<WalletState>(initialState);
  const { isAuthed } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      const response = await api.getWalletBalance();
      setState((prev) => ({ ...prev, balance: response.wallet }));
    } catch (err) {
      console.error("Failed to fetch wallet balance:", err);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    try {
      const response = await api.getTokenPackages();
      setState((prev) => ({ ...prev, packages: response.packages }));
    } catch (err) {
      console.error("Failed to fetch token packages:", err);
      setState((prev) => ({ ...prev, error: "Failed to load token packages" }));
    }
  }, []);

  const fetchPurchases = useCallback(async () => {
    try {
      const response = await api.getTokenPurchases();
      setState((prev) => ({ ...prev, purchases: response }));
    } catch (err) {
      console.error("Failed to fetch purchases:", err);
    }
  }, []);

  // Set up global refresh function
  useEffect(() => {
    globalRefreshCallback = () => {
      fetchBalance();
    };
    return () => {
      globalRefreshCallback = null;
    };
  }, [fetchBalance]);

  const createPurchase = useCallback(async (packageId: string): Promise<PurchaseWithPackage> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await api.createTokenPurchase(packageId, { source: "token_shop" });
      setState((prev) => ({ ...prev, loading: false }));
      return response;
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false, error: "Failed to create purchase" }));
      throw err;
    }
  }, []);

  const verifyPurchase = useCallback(async (purchaseId: number): Promise<VerifyPurchaseResponse> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await api.verifyTokenPurchase(purchaseId);
      // Refresh balance after verification
      if (response.wallet) {
        setState((prev) => ({ ...prev, balance: response.wallet }));
      }
      setState((prev) => ({ ...prev, loading: false }));
      return response;
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false, error: "Failed to verify purchase" }));
      throw err;
    }
  }, []);

  // Fetch when user logs in
  useEffect(() => {
    if (isAuthed) {
      console.log("User logged in, fetching wallet data...");
      fetchBalance();
      fetchPackages();
      fetchPurchases();
    }
  }, [isAuthed, fetchBalance, fetchPackages, fetchPurchases]);

  // Set up periodic auto-refresh when user is authenticated
  useEffect(() => {
    if (isAuthed) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Set up auto-refresh interval
      intervalRef.current = setInterval(() => {
        console.log("Auto-refreshing token balance...");
        fetchBalance();
      }, AUTO_REFRESH_INTERVAL);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [isAuthed, fetchBalance]);

  // Also do an immediate refresh when the component mounts (for existing users)
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    ...state,
    refreshBalance: fetchBalance,
    refreshPackages: fetchPackages,
    refreshPurchases: fetchPurchases,
    createPurchase,
    verifyPurchase,
  };
}

// Helper function to trigger wallet refresh from anywhere in the app
export function triggerWalletRefresh() {
  if (globalRefreshCallback) {
    console.log("Triggering global wallet refresh...");
    globalRefreshCallback();
  }
}
