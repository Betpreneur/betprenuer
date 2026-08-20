import { useState, useEffect, useCallback } from "react";
import { api, type WalletBalance, type TokenPackage, type PurchaseWithPackage, type VerifyPurchaseResponse, type PurchasesResponse } from "@/lib/api";

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

export function useWallet() {
  const [state, setState] = useState<WalletState>(initialState);

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

  // Initial fetch
  useEffect(() => {
    fetchBalance();
    fetchPackages();
    fetchPurchases();
  }, [fetchBalance, fetchPackages, fetchPurchases]);

  return {
    ...state,
    refreshBalance: fetchBalance,
    refreshPackages: fetchPackages,
    refreshPurchases: fetchPurchases,
    createPurchase,
    verifyPurchase,
  };
}
