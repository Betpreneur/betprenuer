import { Link } from "@tanstack/react-router";
import { Coins, AlertTriangle, ArrowRight } from "lucide-react";

interface InsufficientTokensProps {
  required: number;
  available: number;
  feature?: string;
}

export function InsufficientTokens({ required, available, feature }: InsufficientTokensProps) {
  const shortfall = required - available;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Insufficient Tokens</h3>
          <p className="text-sm text-muted-foreground">
            You need {required} tokens but have {available}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Required</span>
          <span className="font-semibold">{required} tokens</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Available</span>
          <span className="font-semibold">{available} tokens</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-amber-400 font-semibold">Shortfall</span>
          <span className="text-amber-400 font-bold">{shortfall} tokens</span>
        </div>
      </div>

      <a
        href="/tokens"
        className="flex items-center justify-center gap-2 w-full py-3 bg-brand-green text-primary-foreground rounded-xl font-semibold hover:bg-brand-green/90 transition-all"
      >
        <Coins className="w-5 h-5" />
        Buy Tokens
        <ArrowRight className="w-4 h-4" />
      </a>

      <p className="text-xs text-muted-foreground text-center mt-3">
        {feature === "smart_randomize"
          ? "Smart Randomize costs 5 tokens per request"
          : "Slip review costs 1 token per game"}
      </p>
    </div>
  );
}
