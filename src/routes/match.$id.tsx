import { createFileRoute, Link, Navigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { api, type PickDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { naira, potentialWin, stakeFor, tierLabel } from "@/lib/stake";
import { formatKickoff } from "@/lib/time";
import { StakeGuide } from "@/components/StakeGuide";

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
      ? "bg-win-green text-jet-black"
      : r === "L"
      ? "bg-danger-red text-primary-foreground"
      : "bg-white/10 text-foreground";
  return <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-semibold ${cls}`}>{r}</span>;
}

function MatchPage() {
  const { id } = Route.useParams();
  const { isAuthed, loading, user } = useAuth();
  const router = useRouter();
  const [pick, setPick] = useState<PickDetail | null>(null);
  const [error, setError] = useState(false);
  const [backing, setBacking] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setError(false);
    api.getPick(id).then(setPick).catch(() => setError(true));
  };

  useEffect(() => {
    if (!isAuthed) return;
    load();
  }, [isAuthed, id]);

  if (loading) return null;
  if (!isAuthed) return <Navigate to="/record" />;

  if (error) {
    return (
      <div className="text-center py-16">
        <p>Could not load this pick.</p>
        <button onClick={() => router.navigate({ to: "/home" })} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md">Back to today</button>
      </div>
    );
  }

  if (!pick) {
    return <div className="h-64 bg-card border border-brand-border rounded-lg animate-pulse" />;
  }

  const stake = stakeFor(user?.bankroll ?? 50000, pick.tier);
  const win = potentialWin(stake, pick.odds);

  async function handleBacked() {
    if (!pick || pick.user_backed || backing) return;
    setBacking(true);
    try {
      await api.markBacked(pick.id, stake);
      setPick({ ...pick, user_backed: true });
    } finally {
      setBacking(false);
    }
  }

  async function handleShare() {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: "#1A3A1A", scale: 2 });
      const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
      if (!blob) return;
      const file = new File([blob], "terminal-pick.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean; share?: (d: ShareData) => Promise<void> };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: "Today's pick — Betpreneur" });
        setShareMsg("Shared!");
      } else if (navigator.clipboard && "write" in navigator.clipboard) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setShareMsg("Copied to clipboard");
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "terminal-pick.png";
        a.click();
        setShareMsg("Downloaded");
      }
      setTimeout(() => setShareMsg(null), 2500);
    } catch {
      setShareMsg("Could not share");
      setTimeout(() => setShareMsg(null), 2500);
    }
  }

  return (
    <div className="space-y-5">
      <Link to="/home" className="text-[13px] text-info-blue">← Back to today</Link>

      {/* Match header */}
      <header className="bg-card border border-brand-border rounded-lg p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="!text-[20px] !leading-tight">{pick.match}</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {pick.league} · {formatKickoff(pick.kickoff_wat)}
            </p>
          </div>
          <span className={`text-[12px] px-2 py-1 rounded font-medium ${tierBg[pick.tier]}`}>
            {tierLabel(pick.tier)}
          </span>
        </div>
        <div className="mt-3 inline-block bg-teal-bg text-teal-accent text-[14px] font-medium px-3 py-1.5 rounded">
          {pick.market_plain}
        </div>
        <div className="mt-3 text-[13px] text-muted-foreground">
          Confidence: <span className="font-medium text-win-green">{pick.confidence.toFixed(1)}%</span>
          {" · "}Odds: <span className="font-medium text-foreground">{pick.odds.toFixed(2)}</span>
        </div>
      </header>

      {/* Recent form */}
      <section className="bg-card border border-brand-border rounded-lg p-5">
        <h2 className="mb-3">Recent form</h2>
        <div className="space-y-3">
          <Row team={pick.match.split(" vs ")[0]} form={pick.form_home} />
          <Row team={pick.match.split(" vs ")[1]} form={pick.form_away} />
        </div>
      </section>

      {/* Goals profile */}
      <section className="bg-card border border-brand-border rounded-lg p-5">
        <h2 className="mb-3">Why this pick</h2>
        <ul className="space-y-2 text-[14px] text-foreground/90">
          {pick.goals_profile.map((g, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-win-green mt-0.5">•</span>
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Risk flag */}
      {pick.risk_flag && (
        <div className="bg-amber-bg border border-amber-text/20 rounded-lg p-4">
          <div className="text-[12px] uppercase tracking-wide text-amber-text font-semibold mb-1">Watch out</div>
          <p className="text-[14px] text-amber-text">{pick.risk_flag}</p>
        </div>
      )}

      {/* Model verdict */}
      <section className="bg-info-bg border border-info-blue/15 rounded-lg p-5">
        <h2 className="mb-2 !text-info-blue">Model verdict</h2>
        <p className="italic text-[14px] text-info-blue">{pick.model_verdict}</p>
      </section>

      {/* Stake guide */}
      <StakeGuide odds={pick.odds} highlight={pick.tier} />

      {/* Settled state */}
      {pick.status === "settled" && pick.result && (
        <div className={`rounded-lg p-4 text-center font-medium ${
          pick.result === "won" ? "bg-win-green-bg text-win-green"
          : pick.result === "lost" ? "bg-danger-bg text-danger-red"
          : "bg-white/5 text-foreground"
        }`}>
          {pick.result === "won" && `Won +${naira(win)}`}
          {pick.result === "lost" && `Lost −${naira(stake)}`}
          {pick.result === "void" && "Void — stake returned"}
        </div>
      )}

      {/* Action buttons */}
      {pick.status !== "settled" && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleBacked}
            disabled={pick.user_backed || backing}
            className={`min-h-[56px] rounded-md font-medium ${
              pick.user_backed
                ? "bg-white/10 text-muted-foreground cursor-default"
                : "bg-win-green text-jet-black hover:opacity-90"
            }`}
          >
            {pick.user_backed ? "Backed ✓" : backing ? "Saving…" : "I backed this"}
          </button>
          <button
            onClick={handleShare}
            className="min-h-[56px] rounded-md font-medium border border-primary text-primary bg-card hover:bg-primary/10"
          >
            Share this pick
          </button>
        </div>
      )}
      {shareMsg && (
        <div className="text-center text-[13px] text-muted-foreground">{shareMsg}</div>
      )}

      {/* Off-screen share card */}
      <div className="fixed -left-[9999px] top-0">
        <div ref={cardRef} style={{ width: 1200, height: 628, padding: 60, background: "#1A3A1A", color: "#EAF3DE", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: 1 }}>TERMINAL</div>
          <div>
            <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.05 }}>{pick.match}</div>
            <div style={{ fontSize: 36, marginTop: 18, opacity: 0.9 }}>{pick.market_plain}</div>
            <div style={{ fontSize: 28, marginTop: 24, fontStyle: "italic", opacity: 0.85 }}>"{pick.one_line_reason}"</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: 22, opacity: 0.8 }}>terminal.app/record</div>
            <div style={{ fontSize: 56, fontWeight: 700 }}>{pick.confidence.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ team, form }: { team: string; form: ("W" | "D" | "L")[] }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[14px] text-body-text font-medium truncate">{team}</span>
      <div className="flex gap-1">
        {form.map((r, i) => <FormChip key={i} r={r} />)}
      </div>
    </div>
  );
}