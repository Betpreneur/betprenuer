import { createFileRoute, Link, Navigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type PickDetail, type GameDetailResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tierLabel } from "@/lib/stake";
import { formatKickoff, todayLagosISO } from "@/lib/time";
import { StakeGuide } from "@/components/StakeGuide";
import { addBackedCount } from "@/hooks/useBackedPicks";
import logoFull from "@/assets/betpreneur-logo-horizontal.png";

// Extended type for full game details
interface GameDetails {
  fixture: string;
  home_team: string;
  away_team: string;
  league: string;
  kickoff: string;
  match_id: string;
  published: boolean;
  official_pick_count: number;
  official_pick: any;
  official_picks: any[];
  top_market: any;
  market_count: number;
  eligible_market_count: number;
  markets_70_plus: number;
  markets_65_plus: number;
  home_recent_form: any;
  away_recent_form: any;
  fixture_context: any;
  team_news: any;
  corner_profile: any;
  insights: any;
  markets: any[];
}

export const Route = createFileRoute("/match/$id")({
  component: MatchPage,
});

const tierBg = {
  banker:  "bg-win-green-bg text-win-green",
  gem:     "bg-teal-bg text-teal-accent",
  wildcard:"bg-amber-bg text-amber-text",
} as const;

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

function TierBadge({ tier }: { tier: string }) {
  const tierKey = getPickTierKey(tier);
  if (!tierKey) {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-info-blue/20 text-info-blue border border-info-blue/30">
        Top Market
      </span>
    );
  }
  const colors: Record<string, string> = {
    banker: "bg-brand-green text-primary-foreground",
    gem: "bg-teal-600 text-white",
    wildcard: "bg-purple-600 text-white",
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${colors[tierKey]}`}>
      {tierLabel(tierKey)}
    </span>
  );
}

function getPickTierKey(tier?: string | null): "banker" | "gem" | "wildcard" | null {
  if (!tier) return null;
  const normalized = String(tier).toLowerCase().replace(/\s+/g, "_");
  if (normalized === "banker") return "banker";
  if (normalized === "gem" || normalized === "value_gem") return "gem";
  if (normalized === "wildcard" || normalized === "wild_card") return "wildcard";
  return null;
}

function pickCardLabel(pick: PickDetail): string {
  const tierKey = getPickTierKey((pick as any).tier);
  return tierKey ? tierLabel(tierKey) : "Top Market";
}

function MatchPage() {
  // Safety: handle id extraction safely
  let id = "";
  try {
    id = Route.useParams().id;
  } catch {
    // Param error - ignore, will show below
  }
  const { isAuthed, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pick, setPick] = useState<PickDetail | null>(null);
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [error, setError] = useState(false);
  const [backing, setBacking] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    url: string;
    blob: Blob;
    fileName: string;
  } | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    if (!id || !id.trim()) {
      setError(true);
      setAppLoading(false);
      return;
    }

    // Always call API directly, no cache
    console.log("[MatchPage] Calling API:", id);
    setError(false);
    setAppLoading(true);
    
    api.getGameDetail(id)
      .then((res) => {
        if (!res?.game) {
          setError(true);
          return;
        }
        const g = res.game as any;
        const p = g.official_pick; 
        const tm = g.top_market; 
        
        console.log("[MatchPage] Got game from API:", g.id, " Picks:", g.official_picks?.length, " top_market:", !!tm);
        
        // Store full game details for additional display
        setGameDetails(g as GameDetails);
        
        // Use top_market as fallback if no official pick
        const effectivePick = p || tm;
        
        setPick({
          ...effectivePick,
          id: effectivePick?.id || Number(g.match_id) || 0,
          match: g.fixture,
          fixture: g.fixture,
          kickoff: g.kickoff,
          kickoff_wat: g.kickoff || "",
          market_plain: effectivePick?.market || effectivePick?.selection || "",
          meaning: effectivePick?.meaning || undefined,
          one_line_reason: effectivePick?.reasoning || "",
          model_verdict: effectivePick?.model_verdict || undefined,
          home_team: g.home_team,
          away_team: g.away_team,
          home_logo: g.home_logo,
          away_logo: g.away_logo,
          home_score: g.home_score,
          away_score: g.away_score,
          status: g.status,
          league: g.league,
          competition_logo: g.competition_logo,
          country_flag: g.country_flag,
          form_home: g.home_recent_form,
          form_away: g.away_recent_form,
          goals_profile: effectivePick?.selection_profile ? effectivePick.selection_profile.split("\n").filter(Boolean) : [],
          risk_flags: Array.isArray(effectivePick?.risk_flags) ? effectivePick.risk_flags : [],
          risk_level: effectivePick?.risk_level || "",
          user_backed: effectivePick?.backed_by_me || false,
          insights: g.insights,
          team_news: { home: g.team_news?.home, away: g.team_news?.away },
          market: effectivePick?.market || "",
          odds: effectivePick?.odds || "",
          confidence: effectivePick?.confidence || 0,
          tier: effectivePick?.tier || effectivePick?.suggested_tier || "",
          stake: effectivePick?.stake || "",
          ev: effectivePick?.ev || 0,
          // Map all extra fields for display
          fixture_context: g.fixture_context,
          corner_profile: g.corner_profile,
          top_market: g.top_market,
          market_count: g.market_count,
          markets_70_plus: g.markets_70_plus,
          markets_65_plus: g.markets_65_plus,
          official_pick_count: g.official_pick_count,
          official_pick: g.official_pick,
          official_picks: g.official_picks,
          markets: g.markets,
          home_standing: g.fixture_context?.home_standing,
          away_standing: g.fixture_context?.away_standing,
          home_rest_days: g.fixture_context?.home_rest_days,
          away_rest_days: g.fixture_context?.away_rest_days,
          league_strength: g.fixture_context?.league_strength,
        });
      })
      .catch(() => setError(true))
      .finally(() => setAppLoading(false));
  };

  useEffect(() => {
    if (!isAuthed) return;
    load();
  }, [isAuthed, id]);

  if (appLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-card border border-brand-border rounded animate-pulse" />
        <div className="h-32 bg-card border border-brand-border rounded-lg animate-pulse" />
        <div className="h-24 bg-card border border-brand-border rounded-lg animate-pulse" />
        <div className="h-24 bg-card border border-brand-border rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!isAuthed) return <Navigate to="/login" />;

  if (error || !pick) {
    return (
      <div className="text-center py-16">
        <p>This pick is no longer available or doesn't exist.</p>
        <button
          onClick={() => router.navigate({ to: "/home" })}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-brand-green hover:bg-brand-green/90 text-background font-medium rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to home
        </button>
      </div>
    );
  }

  if (!pick) {
    return <div className="h-64 bg-card border border-brand-border rounded-lg animate-pulse" />;
  }

  async function handleBacked() {
    if (!pick || pick.user_backed || backing) return;
    setBacking(true);
    const backedDate = todayLagosISO();
    try {
      await api.markBacked(id, backedDate);
      addBackedCount(pick.id);
      setPick({ ...pick, user_backed: true });
    } catch (e) {
      console.error("Failed to save backed pick:", e);
      setShareMsg("Could not save this pick. Please try again.");
      setTimeout(() => setShareMsg(null), 3500);
    } finally {
      setBacking(false);
    }
  }

  function shareText(): string {
    if (!pick) return "";
    // Use current hostname for the link
    const domain = typeof window !== "undefined" ? window.location.hostname : "www.betpreneur.ng";
    const protocol = typeof window !== "undefined" ? window.location.protocol : "https:";
    const signupUrl = `${protocol}//${domain}`;
    return [
      `🎯 Betpreneur pick`,
      ``,
      `${pick.match}`,
      `${pick.market_plain} @ ${Number(pick.odds).toFixed(2)}`,
      `Confidence: ${pick.confidence.toFixed(1)}% · ${pickCardLabel(pick)}`,  
      ``,
      `"${pick.one_line_reason}"`,
      ``,
      `Get daily picks → ${signupUrl}`,
    ].join("\n");
  }

  async function openPreview() {
    if (!pick || generating) return;
    setGenerating(true);
    setShareMsg(null);
    try {
      const blob = await renderShareCard(pick);
      if (!blob) throw new Error("No image generated");
      const domain = typeof window !== "undefined" ? window.location.hostname : "www.betpreneur.ng";
      const url = URL.createObjectURL(blob);
      const safeName = pick.match.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      setPreview({ url, blob, fileName: `betpreneur-${safeName}.png` });
    } catch (e) {
      console.error("Share card error:", e);
      setShareMsg("Could not generate card. Please try again.");
      setTimeout(() => setShareMsg(null), 4000);
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
    setShareMsg("Card downloaded ✓");
    setTimeout(() => setShareMsg(null), 2500);
  }

  async function shareFromPreview() {
    if (!preview) return;
    const file = new File([preview.blob], preview.fileName, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    try {
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          text: shareText(),
          title: "Betpreneur pick",
        });
        return;
      }
    } catch (e) {
      console.error(e);
    }
    // Fallback: save the PNG, then open WhatsApp web with the message
    downloadFromPreview();
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText())}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setShareMsg("Card saved ✓ Attach it in WhatsApp");
    setTimeout(() => setShareMsg(null), 3500);
  }

  return (
    <div className="space-y-5">
      <Link to="/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-green transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to home
      </Link>

{/* Hero Match Header - Premium Glass Design */}
      <header className="
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-card via-card to-brand-green/10
        border border-brand-green/30
        p-6
      ">
        {/* Animated background shine */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-brand-green/5 to-transparent transform rotate-12 animate-shimmer" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {/* League pill with competition logo and country flag */}
              <div className="flex items-center gap-2 mb-2">
                {(pick as any).country_flag && (
                  <img 
                    src={(pick as any).country_flag} 
                    alt="" 
                    className="w-5 h-5 rounded-full object-contain"
                  />
                )}
                {(pick as any).competition_logo && !(pick as any).country_flag && (
                  <img 
                    src={(pick as any).competition_logo} 
                    alt="" 
                    className="w-5 h-5 object-contain"
                  />
                )}
                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-green/20 text-brand-green border border-brand-green/30">
                  {pick.league}
                </span>
              </div>
              {/* Team Logos */}
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="text-center">
                  {pick.home_logo && (
                    <img src={pick.home_logo} alt="" className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-1" />
                  )}
                  <div className="text-sm font-bold">{pick.home_team}</div>
                </div>
                <div className="text-lg font-black text-muted-foreground">vs</div>
                <div className="text-center">
                  {pick.away_logo && (
                    <img src={pick.away_logo} alt="" className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-1" />
                  )}
                  <div className="text-sm font-bold">{pick.away_team}</div>
                </div>
              </div>
              <h1 className="text-xl md:text-2xl font-black leading-tight sr-only">{pick.match}</h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {pick.kickoff_wat || "TBD"}
              </p>
            </div>
            <TierBadge tier={pick.tier} />
          </div>

          {/* Main Pick Card - Prominent */}
          <div className="
            bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent
            rounded-xl p-4 border border-brand-green/30
          ">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  {(pick as any).official_pick_count > 0 ? "Official Pick" : "Top Market"}
                </div>
                <div className="text-xl font-bold text-foreground">{pick.market_plain}</div>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-2xl font-black text-brand-green">@{pick.odds ? Number(pick.odds).toFixed(2) : "—"}</span>
                  {pick.confidence > 0 && (
                    <span className="flex items-center gap-1.5 text-sm">
                      <svg className="w-4 h-4 text-brand-green" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <span className="font-semibold text-brand-green">{pick.confidence.toFixed(0)}%</span>
                      <span className="text-muted-foreground text-xs">confidence</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-brand-green/20 flex items-center justify-center border-2 border-brand-green">
                <svg className="w-6 h-6 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Insight Cards - Modern Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* What does this mean? */}
        {(pick as any).meaning && (
          <div className="bg-gradient-to-br from-teal-500/10 to-teal-500/5 rounded-xl p-4 border border-teal-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-500">What does this mean?</span>
            </div>
            <p className="text-sm font-medium">{pick.meaning}</p>
          </div>
        )}

        {/* Why this pick? */}
        {pick.one_line_reason && (
          <div className="bg-gradient-to-br from-info-blue/10 to-info-blue/5 rounded-xl p-4 border border-info-blue/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-lg bg-info-blue/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-info-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-info-blue">Why this pick?</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{pick.one_line_reason}</p>
          </div>
        )}
      </div>

      {/* Value & Stake - Glass Card */}
      {pick.ev !== undefined && pick.ev !== null && pick.stake && (
        <div className="
          relative overflow-hidden rounded-xl
          bg-gradient-to-br from-teal-500/15 via-card to-card
          border border-teal-500/30 p-5
        ">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-center mb-4">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Value Indicator
              </span>
            </div>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className={`text-3xl font-black ${pick.ev >= 0 ? "text-teal-500" : "text-danger-red"}`}>
                  {pick.ev >= 0 ? "+" : ""}{Number(pick.ev).toFixed(3)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Expected Value</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-3xl font-black text-win-green">
                  ₦{Number(pick.stake).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Recommended Stake</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent form - full team stats */}
      <section className="bg-card/80 backdrop-blur border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-green/20 to-brand-green/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a6 6 0 00-6-6H4a6 6 0 00-6 6v6a6 6 0 006 6h6a6 6 0 006-6v-6m3-3a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          <h2 className="!text-base font-bold">Recent Form</h2>
        </div>
        {(!pick.form_home && !pick.form_away) ? (
          <div className="text-muted-foreground text-sm">No recent form data available</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
            {/* Home team stats */}
            {pick.form_home && (pick.form_home.games ?? 0) > 0 && (
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-win-green">{pick.match.split(" vs ")[0]}</div>
                  <FormChips form={pick.form_home.form as string} />
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <span className="text-muted-foreground">Record</span>
                  <span className="font-medium">{pick.form_home.wins ?? 0}W-{pick.form_home.draws ?? 0}D-{pick.form_home.losses ?? 0}L ({pick.form_home.games ?? 0})</span>
                  <span className="text-muted-foreground">Streak</span>
                  <span className="font-medium">{pick.form_home.streak ?? 0}</span>
                  <span className="text-muted-foreground">Scored</span>
                  <span className="font-medium">{pick.form_home.avg_scored ?? "-"} avg</span>
                  <span className="text-muted-foreground">Conceded</span>
                  <span className="font-medium">{pick.form_home.avg_conceded ?? "-"} avg</span>
                  <span className="text-muted-foreground">Clean sheets</span>
                  <span className="font-medium">{pick.form_home.clean_sheets ?? 0}</span>
                </div>
              </div>
            )}
            {/* Away team stats */}
            {pick.form_away && (pick.form_away.games ?? 0) > 0 && (
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-danger-red">{pick.match.split(" vs ")[1]}</div>
                  <FormChips form={pick.form_away.form as string} />
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <span className="text-muted-foreground">Record</span>
                  <span className="font-medium">{pick.form_away.wins ?? 0}W-{pick.form_away.draws ?? 0}D-{pick.form_away.losses ?? 0}L ({pick.form_away.games ?? 0})</span>
                  <span className="text-muted-foreground">Streak</span>
                  <span className="font-medium">{pick.form_away.streak ?? 0}</span>
                  <span className="text-muted-foreground">Scored</span>
                  <span className="font-medium">{pick.form_away.avg_scored ?? "-"} avg</span>
                  <span className="text-muted-foreground">Conceded</span>
                  <span className="font-medium">{pick.form_away.avg_conceded ?? "-"} avg</span>
                  <span className="text-muted-foreground">Clean sheets</span>
                  <span className="font-medium">{pick.form_away.clean_sheets ?? 0}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Match context - standings, rest days, h2h, flags, goal model */}
      {(pick as any).fixture_context && (
        <section className="bg-card border border-brand-border rounded-lg p-5">
          <h2 className="mb-3">Match context</h2>
          <div className="space-y-4 text-[13px]">
            {/* Goal Model */}
            {(pick as any).fixture_context?.goal_model && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-muted-foreground text-[11px] mb-2">Goal Model Predictions</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="font-bold text-win-green">{(pick as any).fixture_context.goal_model.expected_total?.toFixed(2) ?? "-"}</div>
                    <div className="text-[10px] text-muted-foreground">Expected Goals</div>
                  </div>
                  <div>
                    <div className="font-bold">{(pick as any).fixture_context.goal_model.over15_margin?.toFixed(2) ?? "-"}</div>
                    <div className="text-[10px] text-muted-foreground">Over 1.5</div>
                  </div>
                  <div>
                    <div className="font-bold">{(pick as any).fixture_context.goal_model.over25_margin?.toFixed(2) ?? "-"}</div>
                    <div className="text-[10px] text-muted-foreground">Over 2.5</div>
                  </div>
                  <div>
                    <div className="font-bold text-info-blue">{(pick as any).fixture_context.goal_model.draw_confidence ?? "-"}%</div>
                    <div className="text-[10px] text-muted-foreground">Draw %</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* H2H stats */}
            {(pick as any).fixture_context?.h2h && (pick as any).fixture_context.h2h.games > 0 && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-muted-foreground text-[11px] mb-2">Head-to-head (last { (pick as any).fixture_context.h2h.games } games)</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="font-bold text-win-green">{(pick as any).fixture_context.h2h.t1w ?? 0}</div>
                    <div className="text-[10px] text-muted-foreground">{pick.match.split(" vs ")[0].split(" ")[0]} wins</div>
                  </div>
                  <div>
                    <div className="font-bold text-muted-foreground">{(pick as any).fixture_context.h2h.draws ?? 0}</div>
                    <div className="text-[10px] text-muted-foreground">Draws</div>
                  </div>
                  <div>
                    <div className="font-bold text-danger-red">{(pick as any).fixture_context.h2h.t2w ?? 0}</div>
                    <div className="text-[10px] text-muted-foreground">{pick.match.split(" vs ")[1].split(" ")[0]} wins</div>
                  </div>
                  <div>
                    <div className="font-bold">{(pick as any).fixture_context.h2h.avg_goals ?? "-"}</div>
                    <div className="text-[10px] text-muted-foreground">Avg goals</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* League strength */}
            {(pick as any).league_strength > 0 && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-muted-foreground text-[11px] mb-1">League Strength Factor</div>
                <div className="font-medium">{(pick as any).league_strength?.toFixed(2) ?? "-"}</div>
              </div>
            )}
            
            {/* League standings */}
            {(pick as any).home_standing?.rank && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(pick as any).home_standing?.rank && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-muted-foreground text-[11px] mb-1">{pick.match.split(" vs ")[0]} position</div>
                    <div className="font-bold text-win-green">
                      #{(pick as any).home_standing?.rank} · {(pick as any).home_standing?.points} pts
                    </div>
                  </div>
                )}
                {(pick as any).away_standing?.rank && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-muted-foreground text-[11px] mb-1">{pick.match.split(" vs ")[1]} position</div>
                    <div className="font-bold text-danger-red">
                      #{(pick as any).away_standing?.rank} · {(pick as any).away_standing?.points} pts
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Rest days */}
            {((pick as any).home_rest_days || (pick as any).away_rest_days) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(pick as any).home_rest_days && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-muted-foreground text-[11px] mb-1">{pick.match.split(" vs ")[0]} rest</div>
                    <div className="font-medium">{(pick as any).home_rest_days} days</div>
                  </div>
                )}
                {(pick as any).away_rest_days && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-muted-foreground text-[11px] mb-1">{pick.match.split(" vs ")[1]} rest</div>
                    <div className="font-medium">{(pick as any).away_rest_days} days</div>
                  </div>
                )}
              </div>
            )}
            
            {/* Fixture flags */}
            {(pick as any).fixture_context?.flags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(pick as any).fixture_context.flags.map((flag: string, i: number) => (
                  <span key={i} className="text-[11px] px-2 py-1 bg-amber-bg text-amber-text rounded">
                    {flag.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Team News */}
      {(pick as any).team_news && (
        <section className="bg-card border border-brand-border rounded-lg p-5">
          <h2 className="mb-3">Team News</h2>
          <div className="space-y-3 text-[13px]">
            {!(pick as any).team_news.available && (
              <div className="text-muted-foreground text-sm italic">
                Team news currently unavailable
              </div>
            )}
            {(pick as any).team_news.home && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="font-semibold text-win-green mb-2">{pick.match.split(" vs ")[0]}</div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Injuries</span>
                  <span className="font-medium">{(pick as any).team_news.home.injuries ?? 0}</span>
                </div>
              </div>
            )}
            {(pick as any).team_news.away && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="font-semibold text-danger-red mb-2">{pick.match.split(" vs ")[1]}</div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Injuries</span>
                  <span className="font-medium">{(pick as any).team_news.away.injuries ?? 0}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Corner Profile */}
      {(pick as any).corner_profile && (
        <section className="bg-card border border-brand-border rounded-lg p-5">
          <h2 className="mb-3">Corner Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
            {(pick as any).corner_profile?.home && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="font-semibold text-win-green mb-2">{pick.match.split(" vs ")[0]}</div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Avg For</span>
                  <span className="font-medium">{(pick as any).corner_profile.home.avg_for ?? "-"}</span>
                  <span className="text-muted-foreground">Avg Against</span>
                  <span className="font-medium">{(pick as any).corner_profile.home.avg_against ?? "-"}</span>
                  <span className="text-muted-foreground">Avg Total</span>
                  <span className="font-medium">{(pick as any).corner_profile.home.avg_total ?? "-"}</span>
                </div>
              </div>
            )}
            {(pick as any).corner_profile?.away && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="font-semibold text-danger-red mb-2">{pick.match.split(" vs ")[1]}</div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Avg For</span>
                  <span className="font-medium">{(pick as any).corner_profile.away.avg_for ?? "-"}</span>
                  <span className="text-muted-foreground">Avg Against</span>
                  <span className="font-medium">{(pick as any).corner_profile.away.avg_against ?? "-"}</span>
                  <span className="text-muted-foreground">Avg Total</span>
                  <span className="font-medium">{(pick as any).corner_profile.away.avg_total ?? "-"}</span>
                </div>
              </div>
            )}
          </div>
          {(pick as any).corner_profile?.expected_total && (
            <div className="mt-3 text-center text-muted-foreground text-[12px]">
              Expected total corners: <span className="font-medium">{(pick as any).corner_profile.expected_total?.toFixed(1)}</span>
            </div>
          )}
        </section>
      )}

      {/* Key Insights */}
      {(pick as any).insights && (
        <section className="bg-card border border-brand-border rounded-lg p-5">
          <h2 className="mb-3">Key Insights</h2>
          <div className="space-y-3 text-[13px]">
            {(pick as any).insights?.key_signals?.length > 0 && (
              <div className="space-y-1">
                <div className="text-muted-foreground text-[11px]">Key Signals</div>
                {(pick as any).insights.key_signals.map((signal: string, i: number) => (
                  <div key={i} className="text-foreground">• {signal}</div>
                ))}
              </div>
            )}
            {(pick as any).insights?.confidence_drivers?.length > 0 && (
              <div className="space-y-1">
                <div className="text-muted-foreground text-[11px]">Confidence Drivers</div>
                {(pick as any).insights.confidence_drivers.map((driver: string, i: number) => (
                  <div key={i} className="text-win-green">• {driver}</div>
                ))}
              </div>
            )}
            {(pick as any).insights?.pre_match_strategy && (
              <div className="mt-2 pt-2 border-t border-border/30">
                <div className="text-muted-foreground text-[11px]">Strategy</div>
                <div className="text-foreground italic">{(pick as any).insights.pre_match_strategy}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Markets Overview */}
      {(pick as any).market_count > 0 && (
        <section className="bg-card border border-brand-border rounded-lg p-5">
          <h2 className="mb-3">Markets Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-info-blue">{(pick as any).market_count}</div>
              <div className="text-muted-foreground text-[11px]">Total Markets</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-win-green">{(pick as any).markets_70_plus}</div>
              <div className="text-muted-foreground text-[11px]">70%+ Conf.</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-teal-accent">{(pick as any).markets_65_plus}</div>
              <div className="text-muted-foreground text-[11px]">65%+ Conf.</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-text">{(pick as any).official_pick_count}</div>
              <div className="text-muted-foreground text-[11px]">Official Picks</div>
            </div>
          </div>
        </section>
      )}

      {/* All Available Markets */}
      {(pick as any)?.markets?.length > 0 && (
        <section className="bg-card border border-brand-border rounded-lg p-5">
          <h2 className="mb-3">All Available Markets</h2>
          <div className="max-h-64 overflow-y-auto space-y-2 text-[13px]">
            {(pick as any).markets.map((m: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{m.name || m.market}</div>
                  {m.selection && (
                    <div className="text-muted-foreground text-[12px] truncate">{m.selection}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {m.odds && (
                    <span className="font-semibold text-brand-green">@{m.odds}</span>
                  )}
                  {m.confidence && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                      m.confidence >= 70 ? 'bg-win-green/20 text-win-green' :
                      m.confidence >= 65 ? 'bg-teal-accent/20 text-teal-accent' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {m.confidence}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Goals profile */}
      <section className="bg-card border border-brand-border rounded-lg p-5">
        <h2 className="mb-3">Why this pick</h2>
        <ul className="space-y-2 text-[14px] text-foreground/90">
          {pick.goals_profile?.map((g, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-win-green mt-0.5">•</span>
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Parent flex container for risk flag + verdict */}
      <div className="flex flex-col gap-10 h-auto">
        {/* Risk flags - now as array */}
        {(pick as any).risk_flags && (pick as any).risk_flags.length > 0 && (
          <div className="bg-gradient-to-br from-amber-bg/30 to-jet-surface-2 border border-amber-text/30 rounded-xl p-4">
            <div className="text-[12px] uppercase tracking-wide text-amber-text font-semibold mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Watch Out
            </div>
            <div className="flex flex-wrap gap-2">
              {(pick as any).risk_flags.map((flag: string, i: number) => (
                <span key={i} className="text-[12px] bg-amber-text/10 text-amber-text px-3 py-1.5 rounded-full font-medium">
                  {flag.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Model verdict - now properly mapped */}
        {(pick as any).model_verdict && (
          <section className="bg-gradient-to-br from-info-bg/30 to-jet-surface-2 border border-info-blue/30 rounded-xl p-5 hover:border-info-blue/50 transition-colors">
            <h2 className="text-[15px] font-semibold mb-3 !text-info-blue flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Model Verdict
            </h2>
            <p className="italic text-[14px] text-info-blue leading-relaxed">{(pick as any).model_verdict}</p>
          </section>
        )}
      </div>

      {/* Stake guide */}
      <StakeGuide odds={pick.odds} highlight={pick.tier} />

      {/* Settled state */}
      {pick.status === "settled" && pick.result && (
        <div className={`rounded-lg p-4 text-center font-medium ${
          pick.result === "won" ? "bg-win-green-bg text-win-green"
          : pick.result === "lost" ? "bg-danger-bg text-danger-red"
          : "bg-white/5 text-foreground"
        }`}>
          {pick.result === "won" && "Result: Won ✓"}
          {pick.result === "lost" && "Result: Lost ✗"}
          {pick.result === "void" && "Void — stake returned"}
        </div>
      )}

      {/* Action buttons */}
      {pick.status !== "settled" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleBacked}
            disabled={pick.user_backed || backing}
            className={`min-h-[56px] rounded-xl font-semibold inline-flex items-center justify-center gap-2 ${
              pick.user_backed
                ? "bg-white/10 text-muted-foreground cursor-default"
                : "bg-win-green text-background hover:opacity-90"
            }`}
          >
            {pick.user_backed ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Backed ✓
              </>
            ) : backing ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                I backed this
              </>
            )}
          </button>
          <button
            onClick={openPreview}
            disabled={generating}
            className="min-h-[56px] rounded-md font-semibold bg-[#25D366] text-background hover:opacity-90 inline-flex items-center justify-center gap-2"
            aria-label="Share on WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.49 0 .15 5.34.15 11.91a11.86 11.86 0 0 0 1.6 5.97L0 24l6.27-1.64a11.93 11.93 0 0 0 5.78 1.47h.01c6.56 0 11.9-5.34 11.9-11.91 0-3.18-1.24-6.17-3.44-8.44ZM12.06 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.72.97.99-3.62-.23-.37a9.85 9.85 0 0 1-1.51-5.27c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.46-4.44 9.9-9.93 9.9Zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"/></svg>
            {generating ? "Preparing…" : "Share on WhatsApp"}
          </button>
          <button
            onClick={openPreview}
            disabled={generating}
            className="min-h-[56px] rounded-md font-medium border border-primary text-primary bg-card hover:bg-primary/10"
            aria-label="Download share card image"
          >
            {generating ? "Preparing…" : "Preview & download"}
          </button>
        </div>
      )}
      {shareMsg && (
        <div className="text-center text-[13px] text-muted-foreground">{shareMsg}</div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          onClick={closePreview}
        >
          <div
            className="bg-card border border-brand-border rounded-2xl max-w-md w-full max-h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-brand-border">
              <h2 className="!text-[16px] !leading-none">Card preview</h2>
              <button
                onClick={closePreview}
                className="text-muted-foreground hover:text-foreground text-[20px] leading-none px-2"
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <img
                src={preview.url}
                alt="Share card preview"
                className="w-full h-auto rounded-lg block"
              />
              <p className="text-[12px] text-muted-foreground text-center mt-3">
                Sent at 1080px wide with a signup link to Betpreneur.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 pb-4">
              <button
                onClick={shareFromPreview}
                className="min-h-[52px] rounded-md font-semibold bg-[#25D366] text-background hover:opacity-90 inline-flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.49 0 .15 5.34.15 11.91a11.86 11.86 0 0 0 1.6 5.97L0 24l6.27-1.64a11.93 11.93 0 0 0 5.78 1.47h.01c6.56 0 11.9-5.34 11.9-11.91 0-3.18-1.24-6.17-3.44-8.44Z"/></svg>
                Share on WhatsApp
              </button>
              <button
                onClick={downloadFromPreview}
                className="min-h-[52px] rounded-md font-medium border border-primary text-primary bg-card hover:bg-primary/10"
              >
                Download PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Custom canvas renderer for the WhatsApp share card ----
// Wrapped in try-catch to prevent page crashes
async function renderShareCard(pick: PickDetail): Promise<Blob | null> {
  try {
    return await renderShareCardImpl(pick);
  } catch (e) {
    console.error("renderShareCard failed:", e);
    return null;
  }
}

async function renderShareCardImpl(pick: PickDetail): Promise<Blob | null> {
  const W = 1080;
  const PAD = 56;
  const cw = W - PAD * 2;
  const innerX = PAD + 38;
  const innerW = cw - 76;

  // Colors
  const RED = "#E8192C";
  const TEAL = "#14b8a6";
  const BLUE = "#3b82f6";
  const GOLD = "#f59e0b";
  const WHITE = "#ffffff";
  const MUTED = "rgba(255,255,255,0.62)";
  const SOFT = "rgba(255,255,255,0.82)";

  const tierKey = getPickTierKey((pick as any).tier);
  const badgeLabel = pickCardLabel(pick).toUpperCase();
  const accentColor = tierKey === "gem" ? TEAL : tierKey === "wildcard" ? GOLD : RED;
  const tierRgb = tierKey === "gem" ? "20,184,166" : tierKey === "wildcard" ? "245,158,11" : "232,25,44";
  const accentBg = `rgba(${tierRgb},0.13)`;

  const HAS_MEANING = !!(pick.meaning && pick.meaning.length > 0);
  const HAS_REASON = !!(pick.one_line_reason && pick.one_line_reason.length > 0);

  // ---- Measurement pass (so nothing overflows its box) ----
  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d");
  if (!mctx) return null;

  const MATCH_LH = 54;
  const MARKET_LH = 46;
  const BODY_LH = 38;
  const insightTextW = innerW - 4;

  mctx.font = "900 46px Montserrat, sans-serif";
  const matchLines = wrapLines(mctx, pick.match || "Match", innerW).slice(0, 3);

  mctx.font = "900 38px Montserrat, sans-serif";
  const marketLines = wrapLines(mctx, pick.market_plain || pick.market || "Top market", innerW).slice(0, 3);

  mctx.font = "700 24px Montserrat, sans-serif";
  const detailLines = wrapLines(mctx, `${pick.league || "Football"}  ·  ${formatKickoff(pick.kickoff_wat)}`, innerW).slice(0, 2);

  let meaningLines: string[] = [];
  if (HAS_MEANING) {
    mctx.font = "600 27px Montserrat, sans-serif";
    meaningLines = wrapLines(mctx, pick.meaning as string, insightTextW);
  }
  let reasonLines: string[] = [];
  if (HAS_REASON) {
    mctx.font = "600 27px Montserrat, sans-serif";
    reasonLines = wrapLines(mctx, `"${pick.one_line_reason}"`, insightTextW);
  }

  const HEADER_H = 280;
  const SECTION_GAP = 24;
  const STAT_H = 116;
  const LABEL_H = 34;
  const CARD_H = Math.max(
    438,
    48 + LABEL_H + matchLines.length * MATCH_LH + 28 + STAT_H + 34 + LABEL_H + marketLines.length * MARKET_LH + 18 + detailLines.length * 32 + 44,
  );
  const INSIGHT_LABEL = 62;
  const INSIGHT_PAD_BOTTOM = 36;
  const meaningH = HAS_MEANING ? INSIGHT_LABEL + meaningLines.length * BODY_LH + INSIGHT_PAD_BOTTOM : 0;
  const reasonH = HAS_REASON ? INSIGHT_LABEL + reasonLines.length * BODY_LH + INSIGHT_PAD_BOTTOM : 0;
  const FOOTER_H = 184;

  let H = PAD + HEADER_H + CARD_H + SECTION_GAP;
  if (HAS_MEANING) H += meaningH + SECTION_GAP;
  if (HAS_REASON) H += reasonH + SECTION_GAP;
  H += FOOTER_H + PAD;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.textBaseline = "top";

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#140609");
  bg.addColorStop(0.46, "#0D0D0D");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 140, 60, W / 2, 140, 720);
  glow.addColorStop(0, `rgba(${tierRgb},0.42)`);
  glow.addColorStop(1, `rgba(${tierRgb},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 680);

  ctx.fillStyle = `rgba(${tierRgb},0.9)`;
  ctx.fillRect(0, 0, W, 12);

  // ---- Header ----
  try {
    const logo = await loadImage(logoFull);
    const lh = 74;
    const lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, (W - lw) / 2, 54, lw, lh);
  } catch {
    ctx.fillStyle = WHITE;
    ctx.font = "900 52px Montserrat, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BETPRENEUR", W / 2, 64);
    ctx.textAlign = "left";
  }

  ctx.textAlign = "center";
  ctx.fillStyle = MUTED;
  ctx.font = "800 22px Montserrat, sans-serif";
  ctx.fillText("BETPRENEUR PREDICTION CARD", W / 2, 158);

  const pillW = Math.max(230, ctx.measureText(badgeLabel).width + 68);
  roundRect(ctx, (W - pillW) / 2, 202, pillW, 54, 27);
  ctx.fillStyle = accentBg;
  ctx.fill();
  ctx.strokeStyle = `rgba(${tierRgb},0.55)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = accentColor;
  ctx.font = "900 24px Montserrat, sans-serif";
  ctx.fillText(badgeLabel, W / 2, 216);
  ctx.textAlign = "left";

  // ---- Main Pick Card ----
  let y = PAD + HEADER_H;
  roundRect(ctx, PAD, y, cw, CARD_H, 28);
  ctx.fillStyle = "rgba(20,20,20,0.96)";
  ctx.fill();
  ctx.strokeStyle = `rgba(${tierRgb},0.55)`;
  ctx.lineWidth = 2;
  ctx.stroke();

  roundRect(ctx, PAD, y, 14, CARD_H, 14);
  ctx.fillStyle = accentColor;
  ctx.fill();

  let cy = y + 42;
  ctx.fillStyle = MUTED;
  ctx.font = "900 19px Montserrat, sans-serif";
  ctx.fillText("MATCH", innerX, cy);
  cy += LABEL_H;
  ctx.fillStyle = WHITE;
  ctx.font = "900 46px Montserrat, sans-serif";
  for (const ln of matchLines) {
    ctx.fillText(ln, innerX, cy);
    cy += MATCH_LH;
  }
  cy += 28;

  const gap = 22;
  const statW = (innerW - gap) / 2;
  drawStatBox(ctx, innerX, cy, statW, STAT_H, "ODDS", Number(pick.odds).toFixed(2), accentColor);
  drawStatBox(ctx, innerX + statW + gap, cy, statW, STAT_H, "CONFIDENCE", `${Math.max(0, Math.min(100, pick.confidence)).toFixed(0)}%`, accentColor);
  cy += STAT_H + 34;

  ctx.fillStyle = MUTED;
  ctx.font = "900 19px Montserrat, sans-serif";
  ctx.fillText("SELECTION", innerX, cy);
  cy += LABEL_H;
  ctx.fillStyle = WHITE;
  ctx.font = "900 38px Montserrat, sans-serif";
  for (const ln of marketLines) {
    ctx.fillText(ln, innerX, cy);
    cy += MARKET_LH;
  }
  cy += 18;
  ctx.fillStyle = MUTED;
  ctx.font = "700 24px Montserrat, sans-serif";
  for (const ln of detailLines) {
    ctx.fillText(ln, innerX, cy);
    cy += 32;
  }

  // ---- Insight Sections ----
  y = PAD + HEADER_H + CARD_H + SECTION_GAP;

  if (HAS_MEANING) {
    roundRect(ctx, PAD, y, cw, meaningH, 22);
    ctx.fillStyle = "rgba(20,184,166,0.1)";
    ctx.fill();
    ctx.strokeStyle = "rgba(20,184,166,0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = TEAL;
    ctx.font = "700 20px Montserrat, sans-serif";
    ctx.fillText("WHAT DOES THIS MEAN?", PAD + 32, y + 28);
    ctx.fillStyle = SOFT;
    ctx.font = "600 27px Montserrat, sans-serif";
    let ly = y + INSIGHT_LABEL;
    for (const ln of meaningLines) {
      ctx.fillText(ln, PAD + 32, ly);
      ly += BODY_LH;
    }
    y += meaningH + SECTION_GAP;
  }

  if (HAS_REASON) {
    roundRect(ctx, PAD, y, cw, reasonH, 22);
    ctx.fillStyle = "rgba(59,130,246,0.1)";
    ctx.fill();
    ctx.strokeStyle = "rgba(59,130,246,0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = BLUE;
    ctx.font = "700 20px Montserrat, sans-serif";
    ctx.fillText("WHY THIS PICK?", PAD + 32, y + 28);
    ctx.fillStyle = SOFT;
    ctx.font = "600 27px Montserrat, sans-serif";
    let ly = y + INSIGHT_LABEL;
    for (const ln of reasonLines) {
      ctx.fillText(ln, PAD + 32, ly);
      ly += BODY_LH;
    }
    y += reasonH + SECTION_GAP;
  }

  // ---- Footer ----
  roundRect(ctx, PAD, y, cw, FOOTER_H, 24);
  ctx.fillStyle = accentBg;
  ctx.fill();
  ctx.strokeStyle = `rgba(${tierRgb},0.4)`;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = WHITE;
  ctx.font = "800 36px Montserrat, sans-serif";
  ctx.fillText("Back smarter daily with Betpreneur", W / 2, y + 48);
  ctx.fillStyle = accentColor;
  ctx.font = "900 42px Montserrat, sans-serif";
  const domain = typeof window !== "undefined" ? window.location.hostname : "betpreneur.ng";
  ctx.fillText(domain, W / 2, y + 104);
  ctx.textAlign = "left";

  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

// Compute wrapped lines without drawing (used for dynamic sizing).
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStatBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  accent: string,
) {
  roundRect(ctx, x, y, w, h, 22);
  ctx.fillStyle = "rgba(255,255,255,0.055)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font = "900 18px Montserrat, sans-serif";
  ctx.fillText(label, x + w / 2, y + 22);
  ctx.fillStyle = accent;
  ctx.font = "900 46px Montserrat, sans-serif";
  ctx.fillText(value, x + w / 2, y + 56);
  ctx.textAlign = "left";
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, curY);
    curY += lineHeight;
  }
  return curY;
}

function Row({ team, form }: { team: string; form: ("W" | "D" | "L")[] }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[14px] text-body-text font-medium truncate">{team}</span>
      <div className="flex gap-1">
        {form?.map((r, i) => <FormChip key={i} r={r} />)}
      </div>
    </div>
  );
}