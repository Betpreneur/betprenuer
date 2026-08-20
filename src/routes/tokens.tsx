import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/lib/auth";
import { Coins, CreditCard, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Copy, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/tokens")({
  head: () => ({
    meta: [
      { title: "Buy Tokens - Betpreneur" },
      { name: "description", content: "Purchase tokens for slip analysis" },
    ],
  }),
  component: TokensPage,
});

function TokensPage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { balance, packages, loading, error, refreshBalance, createPurchase, verifyPurchase } = useWallet();
  const [purchasing, setPurchasing] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState<{ id: number; payment: any } | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<"success" | "pending" | null>(null);

  const handlePurchase = async (packageId: string) => {
    setPurchasing(true);
    setPurchaseError(null);
    setCurrentPurchase(null);
    setVerifyResult(null);
    try {
      const result = await createPurchase(packageId);
      setCurrentPurchase({
        id: result.purchase.id,
        payment: result.purchase.payment,
      });
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  const handleVerify = async () => {
    if (!currentPurchase) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await verifyPurchase(currentPurchase.id);
      if (result.purchase.status === "paid") {
        setVerifyResult("success");
        await refreshBalance();
      } else {
        setVerifyResult("pending");
      }
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <Coins className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Sign in to Buy Tokens</h1>
        <p className="text-muted-foreground mb-6">You need an account to purchase tokens.</p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-green text-primary-foreground font-semibold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/settings" className="p-2 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Buy Tokens</h1>
      </div>

      {/* Wallet Balance */}
      <div className="bg-gradient-to-br from-brand-green/20 to-brand-green/5 border border-brand-green/30 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Coins className="w-8 h-8 text-brand-green" />
          <div>
            <p className="text-sm text-muted-foreground">Your Balance</p>
            <p className="text-3xl font-bold">
              {balance ? balance.total_tokens : "—"} <span className="text-lg font-normal text-muted-foreground">tokens</span>
            </p>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-muted-foreground">Free</p>
            <p className="font-semibold">{balance?.free_tokens ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Paid</p>
            <p className="font-semibold">{balance?.paid_tokens ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Active Purchase */}
      {currentPurchase && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            {verifyResult === "success" ? (
              <CheckCircle2 className="w-6 h-6 text-win-green" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-400" />
            )}
            <h2 className="text-xl font-bold">
              {verifyResult === "success" ? "Payment Successful!" : "Payment Instructions"}
            </h2>
          </div>

          {verifyResult === "success" ? (
            <div className="text-center py-4">
              <p className="text-win-green font-semibold mb-4">Your tokens have been added to your wallet!</p>
              <button
                onClick={() => {
                  setCurrentPurchase(null);
                  setVerifyResult(null);
                }}
                className="px-6 py-2 bg-brand-green text-primary-foreground rounded-lg font-semibold"
              >
                Buy More Tokens
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {currentPurchase.payment.bank_account && (
                  <div className="bg-card rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Bank</span>
                      <span className="font-semibold">{currentPurchase.payment.bank_account.bank_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg">
                          {currentPurchase.payment.bank_account.account_number}
                        </span>
                        <button
                          onClick={() => copyToClipboard(currentPurchase.payment.bank_account.account_number)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Account Name</span>
                      <span className="font-semibold">{currentPurchase.payment.bank_account.account_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-bold text-lg">
                        ₦{currentPurchase.payment.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {currentPurchase.payment.instructions && (
                  <p className="text-sm text-muted-foreground">{currentPurchase.payment.instructions}</p>
                )}

                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full py-3 bg-brand-green text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      I Have Paid
                    </>
                  )}
                </button>

                {verifyResult === "pending" && (
                  <p className="text-center text-amber-400 text-sm">
                    Payment not yet received. Please check and try again.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Token Packages */}
      {!currentPurchase && (
        <>
          <h2 className="text-xl font-bold mb-4">Select Package</h2>
          
          {error && (
            <div className="bg-danger-red/10 border border-danger-red/30 text-danger-red rounded-xl p-4 mb-4">
              {error}
            </div>
          )}

          {purchaseError && (
            <div className="bg-danger-red/10 border border-danger-red/30 text-danger-red rounded-xl p-4 mb-4">
              {purchaseError}
            </div>
          )}

          <div className="grid gap-4">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasing}
                className="flex items-center justify-between p-6 bg-card border border-border rounded-2xl hover:border-brand-green/60 hover:bg-brand-green/5 transition-all disabled:opacity-50 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-brand-green/20 flex items-center justify-center">
                    <Coins className="w-7 h-7 text-brand-green" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{pkg.tokens} Tokens</p>
                    <p className="text-sm text-muted-foreground">
                      {pkg.tokens / 10} tokens per game analysis
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">₦{pkg.amount.toLocaleString()}</p>
                  {purchasing && <Loader2 className="w-5 h-5 animate-spin ml-auto mt-2" />}
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Secure payment powered by Payfonte
          </p>
        </>
      )}
    </div>
  );
}
