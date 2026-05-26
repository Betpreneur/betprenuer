import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type TopPickResponse, type Pick } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tierLabel } from "@/lib/stake";
import { StakeGuide } from "@/components/StakeGuide";
import logoFull from "@/assets/betpreneur-logo-horizontal.png";

export const Route = createFileRoute("/top-pick")({
  head: () => ({
    meta: [
      { title: "Today's top pick - Betpreneur" },
      { name: "description", content: "The single highest-confidence football pick today." },
      { property: "og:title", content: "Today's top pick - Betpreneur" },
      { property: "og:description", content: "Highest-confidence pre-match pick. Subscribers see the full reasoning." },
    ],
  }),
  component: TopPickPage,
});

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    banker: "bg-brand-green text-primary-foreground",
    value_gem: "bg-teal-600 text-white",
    wild_card: "bg-purple-600 text-white",
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${colors[tier] || "bg-gray-600 text-white"}`}>
      {tier?.replace("_", " ") || ""}
    </span>
  );
}

// Stats object from recent form API
interface RecentFormStats {
  wins: number;
  games: number;
  streak: number;
  btts_rate: number;
  avg_scored: number;
  over25_rate: number;
  avg_conceded: number;
  clean_sheets: number;
  draws?: number;
  losses?: number;
}

function StatBar({ label, value, suffix = "", color = "text-win-green", tooltip }: { label: string; value: number; suffix?: string; color?: string; tooltip?: string }) {
  return (
    <div className="text-center py-2" title={tooltip}>
      <div className={`text-[20px] font-bold ${color}`}>{value}{suffix}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}

function FormChip({ r }: { r: "W" | "D" | "L" }) {
  const cls =
    r === "W"
      ? "bg-win-green text-background"
      : r === "L"
      ? "bg-danger-red text-primary-foreground"
      : "bg-white/10 text-foreground";
  return <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-semibold ${cls}`}>{r}</span>;
}

// Convert form string "WDLWDWL" to chips - dynamic length
function FormChips({ form }: { form?: string }) {
  if (!form) return null;
  return (
    <div className="flex gap-0.5 mt-1">
      {form.split("").map((char, i) => (
        <FormChip key={i} r={char as "W" | "D" | "L"} />
      ))}
    </div>
  );
}

function StatsKey() {
  return (
    <details className="bg-card border border-brand-border rounded-lg p-3 text-[11px]">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        📊 What do these stats mean?
      </summary>
      <div className="mt-2 space-y-1 text-muted-foreground grid grid-cols-2 gap-2">
        <div><span className="text-win-green">Wins</span> — Wins in last 5 matches</div>
        <div><span className="text-win-green">Scored</span> — Avg goals scored per game</div>
        <div><span className="text-win-green">Conceded</span> — Avg goals conceded per game</div>
        <div><span className="text-info-blue">BTTS</span> — Both Teams To Score %</div>
        <div><span className="text-amber-text">Over 2.5</span> — Games with 3+ goals %</div>
        <div><span className="text-win-green">CS</span> — Clean sheets (0 goals conceded)</div>
        <div><span className="text-win-green">Streak</span> — Unbeaten streak</div>
        <div><span className="text-muted-foreground">Games</span> — Matches analyzed</div>
      </div>
    </details>
  );
}

function FormStatsCard({ title, stats, team }: { title: string; stats: RecentFormStats | undefined; team: string }) {
  if (!stats) return null;
  return (
    <div className="bg-card border border-brand-border rounded-xl p-5">
      <div className="text-[14px] font-medium mb-4 flex items-center justify-between">
        <span className="text-info-blue">{title}</span>
        <span className="text-[13px] text-muted-foreground">{team}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-3 md:gap-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Wins</span>
          <span className="text-[18px] font-bold text-win-green">{stats.wins}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Draws</span>
          <span className="text-[18px] font-bold">{stats.draws ?? 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Losses</span>
          <span className="text-[18px] font-bold text-danger-red">{stats.losses ?? 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Games</span>
          <span className="text-[18px] font-bold text-muted-foreground">{stats.games}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Scored*</span>
          <span className="text-[18px] font-bold">{stats.avg_scored}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Conceded*</span>
          <span className="text-[18px] font-bold">{stats.avg_conceded}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">BTTS</span>
          <span className="text-[18px] font-bold text-info-blue">{Math.round(stats.btts_rate)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Over 2.5</span>
          <span className="text-[18px] font-bold text-amber-text">{Math.round(stats.over25_rate)}%</span>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/30 text-center">*Averages based on last {stats.games} matches</div>
    </div>
  );
}

function TopPickPage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const [data, setData] = useState<TopPickResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backing, setBacking] = useState(false);
  const [userBacked, setUserBacked] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<{ url: string; blob: Blob; fileName: string } | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("html2canvas").then((mod: any) => {
        (window as any).html2canvas = mod.default || mod;
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthed) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    api.getTopPick()
      .then(setData)
      .catch((err) => {
        setData(null);
        setError(err instanceof Error ? err.message : "Could not load today's top pick.");
      })
      .finally(() => setLoading(false));
  }, [authLoading, isAuthed]);

  // Handler methods for actions
  async function handleBacked() {
    if (!data?.pick || userBacked || backing) return;
    setBacking(true);
    try {
      await api.markBacked(data.pick.id, 0);
      setUserBacked(true);
    } finally {
      setBacking(false);
    }
  }

  function getShareText(): string {
    if (!data?.pick) return "";
    const p = data.pick;
    const domain = typeof window !== "undefined" ? window.location.hostname : "www.betpreneur.ng";
    return `🎯 Betpreneur Top Pick\n\n${p.fixture}\n${p.market} @ ${Number(p.odds).toFixed(2)}\nConfidence: ${p.confidence?.toFixed(0)}%\n\n${p.reasoning || ""}\n\nDaily edge picks → ${domain}`;
  }

  async function openPreview() {
    if (!data?.pick || generating) return;
    setGenerating(true);
    setShareMsg(null);
    try {
      // Use basic canvas approach - full card logic would need copying
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas");

      // Simple gradient background
      const bg = ctx.createLinearGradient(0, 0, 1080, 1350);
      bg.addColorStop(0, "#1a0307");
      bg.addColorStop(1, "#000000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1080, 1350);

      // Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px sans-serif";
      ctx.fillText(data.pick.fixture, 60, 200);
      
      // Market & odds
      ctx.font = "36px sans-serif";
      ctx.fillText(`${data.pick.market} @ ${Number(data.pick.odds).toFixed(2)}`, 60, 280);
      ctx.fillText(`Confidence: ${data.pick.confidence?.toFixed(0)}%`, 60, 340);

      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
      if (!blob) throw new Error("No image");
      const url = URL.createObjectURL(blob);
      const safeName = data.pick.fixture.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      setPreview({ url, blob, fileName: `betpreneur-${safeName}.png` });
    } catch (e) {
      setShareMsg("Could not generate preview");
      setTimeout(() => setShareMsg(null), 3000);
    } finally {
      setGenerating(false);
    }
  }

  function closePreview() {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  function downloadFromPreview() {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview.url;
    a.download = preview.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShareMsg("Saved ✓");
    setTimeout(() => setShareMsg(null), 2500);
  }

  async function shareFromPreview() {
    if (!preview) return;
    const file = new File([preview.blob], preview.fileName, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    try {
      if (nav.canShare && nav.canShare({ files: [file], text: getShareText() })) {
        await nav.share({ files: [file], text: getShareText(), title: "Betpreneur pick" });
        return;
      }
    } catch {}
    downloadFromPreview();
    window.open(`https://wa.me/?text=${encodeURIComponent(getShareText())}`, "_blank");
    setShareMsg("Shared via WA");
    setTimeout(() => setShareMsg(null), 3000);
  }

  if (authLoading) {
    return <div className="h-64 bg-card border border-brand-border rounded-lg animate-pulse" />;
  }

  // Prompt login for unauthenticated visitors
  if (!isAuthed) {
    return (
      <div className="space-y-5">
        <header className="bg-gradient-to-br from-card to-jet-surface-2 border-2 border-brand-green rounded-xl p-6 text-center">
          <div className="text-[11px] uppercase tracking-wide text-brand-green font-semibold mb-2">
            Subscriber exclusive
          </div>
          <h1 className="!text-[22px] !leading-tight font-bold">Login or sign up to unlock</h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            Access our daily top picks with full analysis and stake recommendations.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login"
              search={(prev) => ({ ...prev, redirect: "/top-pick" })}
              className="inline-flex items-center justify-center rounded-lg bg-brand-green px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-green/90 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              search={(prev) => ({ ...prev, redirect: "/top-pick" })}
              className="inline-flex items-center justify-center rounded-lg bg-secondary px-6 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Sign up free
            </Link>
          </div>
        </header>
        <div className="bg-card border border-brand-border rounded-xl p-5 text-center">
          <p className="text-[13px] text-muted-foreground">
            Already a member? <Link to="/login" className="text-brand-green hover:underline">Log in</Link> to see today's pick.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="h-64 bg-card border border-brand-border rounded-lg animate-pulse" />;
  }

  if (error || !data) {
    return (
      <div className="space-y-5">
        <header className="bg-gradient-to-br from-card to-jet-surface-2 border-2 border-brand-border rounded-xl p-6 text-center">
          <div className="text-[11px] uppercase tracking-wide text-danger-red font-semibold mb-2">
            Top pick
          </div>
          <h1 className="!text-[22px] !leading-tight font-bold">Could not load top pick</h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            {error ?? "Please refresh the page and try again."}
          </p>
        </header>
      </div>
    );
  }

  const pick = data.pick;

  // No pick published yet
  if (!data.published || !pick) {
    return (
      <div className="space-y-5">
        <header className="bg-gradient-to-br from-card to-jet-surface-2 border-2 border-brand-border rounded-xl p-6 text-center">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
            Top pick
          </div>
          <h1 className="!text-[22px] !leading-tight font-bold">No pick published yet</h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            Check back later for today's top pick.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-subtle-bg rounded-lg">
            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"></div>
            <span className="text-[12px] text-muted-foreground">Waiting for pick...</span>
          </div>
        </header>
      </div>
    );
  }

  // Show pick - locked for visitors, unlocked for authed users
  const showFullDetails = isAuthed;

  return (
    <div className="space-y-5">
      <header className="bg-gradient-to-br from-card to-jet-surface-2 border-2 border-brand-green rounded-xl p-5 shadow-lg shadow-brand-green/10">
        <div className="text-[11px] uppercase tracking-wide text-brand-green font-semibold mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
          Best pick today
        </div>
        <h1 className="!text-[22px] !leading-tight font-bold">{pick.fixture}</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          <span>{pick.league}</span>
        </p>
        
        <div className="mt-4 inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/30 rounded-lg px-4 py-2">
          <span className="text-[14px] font-medium text-brand-green">{pick.market}</span>
          <span className="text-border">@</span>
          <span className="text-[16px] font-bold text-brand-green">{pick.odds ? Number(pick.odds).toFixed(2) : "–"}</span>
        </div>
        
        <div className="mt-3">
          <TierBadge tier={pick.tier} />
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="text-[13px] text-muted-foreground">
            Confidence level
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-subtle-bg rounded-full overflow-hidden">
              <div 
                className="h-full bg-win-green rounded-full"
                style={{ width: `${pick.confidence}%` }}
              />
            </div>
            <span className="text-[14px] font-bold text-win-green">{pick.confidence?.toFixed(0)}%</span>
          </div>
        </div>
      </header>

      {pick.kickoff && (
        <div className="bg-card border-l-4 border-l-info-blue rounded-r-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-info-blue font-semibold mb-1">
                Match Kickoff
              </div>
              <div className="text-[16px] font-medium">{pick.kickoff}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-muted-foreground">{pick.match_date}</div>
            </div>
          </div>
        </div>
      )}

      {showFullDetails ? (
        <>
          {/* Market meaning and reasoning */}
          {(pick.meaning || pick.reasoning) && (
            <div className="space-y-3">
              {pick.meaning && (
                <div className="bg-card border-l-4 border-l-teal-accent rounded-r-lg p-4">
                  <div className="text-[11px] uppercase tracking-wide text-teal-accent font-semibold mb-1">
                    📝 What does this mean?
                  </div>
                  <p className="text-[15px] font-medium">{pick.meaning}</p>
                </div>
              )}
              {pick.reasoning && (
                <div className="bg-card border-l-4 border-l-info-blue rounded-r-lg p-4">
                  <div className="text-[11px] uppercase tracking-wide text-info-blue font-semibold mb-1">
                    🧠 Why this pick?
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{pick.reasoning}</p>
                </div>
              )}
            </div>
          )}

          {/* Value & Stake */}
          {pick.ev !== undefined && pick.ev !== null && pick.stake && (
            <div className="bg-gradient-to-br from-teal-bg to-card border border-teal-accent/30 rounded-xl p-5">
              <div className="text-[11px] uppercase tracking-wide text-teal-accent font-semibold mb-4 text-center">
                💎 Value Indicator
              </div>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <div className={`text-[24px] font-bold ${pick.ev >= 0 ? "text-teal-accent" : "text-danger-red"}`}>
                    {pick.ev >= 0 ? "+" : ""}{Number(pick.ev).toFixed(3)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">Expected Value</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <div className="text-[24px] font-bold text-win-green">
                    ₦{Number(pick.stake).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">Recommended Stake</div>
                </div>
              </div>
            </div>
          )}

          {pick.model_verdict && (
            <div className="bg-gradient-to-br from-info-bg to-card border border-info-blue/30 rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-wide text-info-blue font-semibold mb-2">
                🎯 Model Verdict
              </div>
              <p className="text-[14px] text-muted-foreground">{pick.model_verdict}</p>
            </div>
          )}

          {/* Risk Flags */}
          {pick.risk_flags && pick.risk_flags.length > 0 && (
            <div className="bg-gradient-to-br from-amber-bg to-card border border-amber-text/30 rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-wide text-amber-text font-semibold mb-3 flex items-center gap-2">
                ⚠️ Risk Factors
              </div>
              <div className="flex flex-wrap gap-2">
                {pick.risk_flags.map((flag, i) => (
                  <span key={i} className="text-[12px] bg-amber-text/10 text-amber-text px-3 py-1.5 rounded-full font-medium">
                    {flag.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Full recent form stats - new robust format */}
          {(pick.home_recent_form || pick.away_recent_form) && typeof pick.home_recent_form === "object" && pick.home_recent_form !== null && (
            <>
              {pick.home_recent_form && (pick.home_recent_form as any).games > 0 && (
                <div className="bg-card border border-brand-border rounded-lg p-4">
                  <h3 className="text-[14px] font-semibold mb-2 text-win-green">
                    {pick.fixture?.split(" vs ")[0] || "Home"} Recent Form
                  </h3>
                  <FormChips form={(pick.home_recent_form as any).form as string} />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[13px] mt-2">
                    <div>
                      <div className="text-muted-foreground text-[10px]">Record</div>
                      <div className="font-bold">{(pick.home_recent_form as any).wins ?? 0}W-{(pick.home_recent_form as any).draws ?? 0}D-{(pick.home_recent_form as any).losses ?? 0}L ({(pick.home_recent_form as any).games ?? 0})</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[10px]">Scored</div>
                      <div className="font-bold">{(pick.home_recent_form as any).avg_scored ?? "-"} avg</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[10px]">Conceded</div>
                      <div className="font-bold">{(pick.home_recent_form as any).avg_conceded ?? "-"} avg</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[10px]">Clean sheets</div>
                      <div className="font-bold">{(pick.home_recent_form as any).clean_sheets ?? 0}</div>
                    </div>
                  </div>
                </div>
              )}

              {pick.away_recent_form && (pick.away_recent_form as any).games > 0 && (
                <div className="bg-card border border-brand-border rounded-lg p-4">
                  <h3 className="text-[14px] font-semibold mb-2 text-danger-red">
                    {pick.fixture?.split(" vs ")[1] || "Away"} Recent Form
                  </h3>
                  <FormChips form={(pick.away_recent_form as any).form as string} />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[13px] mt-2">
                    <div>
                      <div className="text-muted-foreground text-[10px]">Record</div>
                      <div className="font-bold">{(pick.away_recent_form as any).wins ?? 0}W-{(pick.away_recent_form as any).draws ?? 0}D-{(pick.away_recent_form as any).losses ?? 0}L ({(pick.away_recent_form as any).games ?? 0})</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[10px]">Scored</div>
                      <div className="font-bold">{(pick.away_recent_form as any).avg_scored ?? "-"} avg</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[10px]">Conceded</div>
                      <div className="font-bold">{(pick.away_recent_form as any).avg_conceded ?? "-"} avg</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[10px]">Clean sheets</div>
                      <div className="font-bold">{(pick.away_recent_form as any).clean_sheets ?? 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Fixture context - standings, rest days, h2h, flags */}
          {(pick as any).fixture_context && (
            <>{(pick as any).fixture_context.h2h && (
              <div className="bg-card border border-brand-border rounded-lg p-4">
                <h3 className="text-[14px] font-semibold mb-3">Head-to-Head</h3>
                <div className="grid grid-cols-4 gap-2 text-center text-[13px]">
                  <div><div className="font-bold text-win-green">{(pick as any).fixture_context.h2h.t1w ?? 0}</div><div className="text-[10px] text-muted-foreground">Home wins</div></div>
                  <div><div className="font-bold">{(pick as any).fixture_context.h2h.draws ?? 0}</div><div className="text-[10px] text-muted-foreground">Draws</div></div>
                  <div><div className="font-bold text-danger-red">{(pick as any).fixture_context.h2h.t2w ?? 0}</div><div className="text-[10px] text-muted-foreground">Away wins</div></div>
                  <div><div className="font-bold">{(pick as any).fixture_context.h2h.avg_goals ?? "-"}</div><div className="text-[10px] text-muted-foreground">Avggoals</div></div>
                </div>
              </div>
            )}

            {((pick as any).fixture_context.home_standing?.rank || (pick as any).fixture_context.away_standing?.rank) && (
              <div className="grid grid-cols-2 gap-3">
                {(pick as any).fixture_context.home_standing?.rank && (
                  <div className="bg-card border border-brand-border rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground">{pick.fixture?.split(" vs ")[0]}</div>
                    <div className="font-bold text-win-green">#{(pick as any).fixture_context.home_standing.rank} · {(pick as any).fixture_context.home_standing.points}pts</div>
                  </div>
                )}
                {(pick as any).fixture_context.away_standing?.rank && (
                  <div className="bg-card border border-brand-border rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground">{pick.fixture?.split(" vs ")[1]}</div>
                    <div className="font-bold text-danger-red">#{(pick as any).fixture_context.away_standing.rank} · {(pick as any).fixture_context.away_standing.points}pts</div>
                  </div>
                )}
              </div>
            )}

            {((pick as any).fixture_context.home_rest_days || (pick as any).fixture_context.away_rest_days) && (
              <div className="grid grid-cols-2 gap-3">
                {(pick as any).fixture_context.home_rest_days && (
                  <div className="bg-card border border-brand-border rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground">{pick.fixture?.split(" vs ")[0]} rest</div>
                    <div className="font-bold">{(pick as any).fixture_context.home_rest_days} days</div>
                  </div>
                )}
                {(pick as any).fixture_context.away_rest_days && (
                  <div className="bg-card border border-brand-border rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground">{pick.fixture?.split(" vs ")[1]} rest</div>
                    <div className="font-bold">{(pick as any).fixture_context.away_rest_days} days</div>
                  </div>
                )}
              </div>
            )}

            {((pick as any).fixture_context.flags?.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {(pick as any).fixture_context.flags.map((flag: string, i: number) => (
                  <span key={i} className="text-[11px] px-2 py-1 bg-amber-bg text-amber-text rounded">
                    {flag.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
            </>
          )}

          <StakeGuide odds={pick.odds} highlight={pick.tier} />

          {pick.status && pick.status !== "pending" && (
            <div className="bg-card border rounded-lg p-4 text-center">
              <span className={`text-[16px] font-bold ${
                pick.status === "win" ? "text-win-green" :
                pick.status === "loss" ? "text-danger-red" :
                "text-muted-foreground"
              }`}>
                {pick.status === "win" ? "✅ Won" :
                 pick.status === "loss" ? "❌ Lost" :
                 "➖ Voided"}
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green text-2xl mb-3">
            🔒
          </div>
          <h2 className="text-[18px] font-bold">Unlock Full Analysis</h2>
          <p className="text-[13px] text-muted-foreground mt-2 mb-4">
            Sign up free to see the model's reasoning,<br/>stake guide, and team stats.
          </p>
          <Link to="/signup" className="inline-block w-full bg-brand-green text-primary-foreground font-semibold py-3 rounded-lg hover:bg-brand-green/90 transition-colors">
            Create Free Account
          </Link>
          <p className="text-[12px] text-muted-foreground mt-3">
            Already have an account? <Link to="/login" className="text-info-blue underline">Sign in</Link>
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Link to="/home" className="flex-1 text-center py-3 bg-card border border-brand-border rounded-lg font-medium hover:bg-subtle-bg transition-colors">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
