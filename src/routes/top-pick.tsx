import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type TopPickResponse, type Pick } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tierLabel } from "@/lib/stake";
import { StakeGuide } from "@/components/StakeGuide";

export const Route = createFileRoute("/top-pick")({
  head: () => ({
    meta: [
      { title: "Today's top pick � Betpreneur" },
      { name: "description", content: "The single highest-confidence football pick today." },
      { property: "og:title", content: "Today's top pick � Betpreneur" },
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
}

function StatBar({ label, value, suffix = "", color = "text-win-green", tooltip }: { label: string; value: number; suffix?: string; color?: string; tooltip?: string }) {
  return (
    <div className="text-center py-2" title={tooltip}>
      <div className={`text-[20px] font-bold ${color}`}>{value}{suffix}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
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
      <div className="grid grid-cols-4 gap-x-6 gap-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Wins</span>
          <span className="text-[18px] font-bold text-win-green">{stats.wins}</span>
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
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">CS</span>
          <span className="text-[18px] font-bold text-win-green">{stats.clean_sheets}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Streak*</span>
          <span className={`text-[18px] font-bold ${stats.streak > 0 ? "text-win-green" : "text-danger-red"}`}>{stats.streak > 0 ? Math.abs(stats.streak) : 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Games</span>
          <span className="text-[18px] font-bold text-muted-foreground">{stats.games}</span>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/30 text-center">*Averages based on last 5 matches</div>
    </div>
  );
}

function TopPickPage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const [data, setData] = useState<TopPickResponse | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("html2canvas").then((mod: any) => {
        (window as any).html2canvas = mod.default || mod;
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    api.getTopPick()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (authLoading || loading || !data) {
    return <div className="h-64 bg-card border border-brand-border rounded-lg animate-pulse" />;
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
        <p className="text-[13px] text-muted-foreground mt-0.5 flex items-center gap-2">
          <span>{pick.league}</span>
          <span className="text-border">•</span>
          <span className="text-info-blue">{pick.source || "APS"}</span>
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
                className="h-full bg-gradient-to-r from-win-green to-brand-green rounded-full"
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

          {/* Team Stats - Check if recent form is object or array */}
          {typeof pick.home_recent_form === "object" && pick.home_recent_form !== null ? (
            <>
              <FormStatsCard title="Home Team" stats={pick.home_recent_form as unknown as RecentFormStats} team={pick.home_team} />
              <FormStatsCard title="Away Team" stats={pick.away_recent_form as unknown as RecentFormStats} team={pick.away_team} />
              
              <StatsKey />
            </>
          ) : (
            /* Legacy array format */
            <>
              {pick.home_recent_form && pick.home_recent_form.length > 0 && (
                <div className="bg-card border border-brand-border rounded-lg p-4">
                  <h3 className="text-[14px] font-medium mb-2">Home Form</h3>
                  <div className="flex gap-1">
                    {pick.home_recent_form.slice(0, 5).map((r: string, i: number) => (
                      <span key={i} className={`w-6 h-6 rounded text-[11px] font-medium flex items-center justify-center ${
                        r === "W" ? "bg-win-green text-white" : r === "D" ? "bg-draw-yellow text-black" : "bg-danger-red text-white"
                      }`}>{r}</span>
                    ))}
                  </div>
                </div>
              )}

              {pick.away_recent_form && pick.away_recent_form.length > 0 && (
                <div className="bg-card border border-brand-border rounded-lg p-4">
                  <h3 className="text-[14px] font-medium mb-2">Away Form</h3>
                  <div className="flex gap-1">
                    {pick.away_recent_form.slice(0, 5).map((r: string, i: number) => (
                      <span key={i} className={`w-6 h-6 rounded text-[11px] font-medium flex items-center justify-center ${
                        r === "W" ? "bg-win-green text-white" : r === "D" ? "bg-draw-yellow text-black" : "bg-danger-red text-white"
                      }`}>{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <StakeGuide confidence={pick.confidence} />

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

      <Link to="/record" className="block text-center text-info-blue text-[14px] hover:underline">
        📊 See our 90-day track record →
      </Link>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Link to="/home" className="flex-1 text-center py-3 bg-card border border-brand-border rounded-lg font-medium hover:bg-subtle-bg transition-colors">
          Back to Dashboard
        </Link>
        <button onClick={function(){
          var cardArea = document.querySelector(".space-y-5");
          if(cardArea && (window as any).html2canvas){
            (window as any).html2canvas(cardArea,{backgroundColor:"#0D0D0D",scale:2,useCORS:true}).then(function(canvas:any){
              var link = document.createElement("a");
              var d = new Date().toISOString().split("T")[0];
              link.download = "betpreneur-pick-"+d+".png";
              link.href = canvas.toDataURL("image/png");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }).catch(function(e:any){console.log(e);alert("Could not save. Try share instead.");});
          }else{alert("Save not ready. Try share.");}
        }} className="flex-1 py-3 bg-brand-green text-primary-foreground rounded-lg font-medium hover:bg-brand-green/90 transition-colors">
          Save Card
        </button>
        <button onClick={function(){
          var u = window.location.href;
          var t = "Betpreneur Pick: "+(document.querySelector("h1")?.textContent || "");
          if(navigator.share){
            navigator.share({title:t,text:t+" - check it out",url:u}).catch(function(){});
          }else{
            navigator.clipboard.writeText(t+" "+u).then(function(){alert("Link copied!");}).catch(function(){alert("Could not copy");});
          }
        }} className="flex-1 py-3 bg-info-blue text-white rounded-lg font-medium hover:bg-info-blue/90 transition-colors">
          Share
        </button>
      </div>
    </div>
  );
}
