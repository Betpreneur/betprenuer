import { createFileRoute, Link, Navigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type PickDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tierLabel } from "@/lib/stake";
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
      ? "bg-win-green text-background"
      : r === "L"
      ? "bg-danger-red text-primary-foreground"
      : "bg-white/10 text-foreground";
  return <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-semibold ${cls}`}>{r}</span>;
}

function MatchPage() {
  const { id } = Route.useParams();
  const { isAuthed, loading } = useAuth();
  const router = useRouter();
  const [pick, setPick] = useState<PickDetail | null>(null);
  const [error, setError] = useState(false);
  const [backing, setBacking] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

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

  async function handleBacked() {
    if (!pick || pick.user_backed || backing) return;
    setBacking(true);
    try {
      await api.markBacked(pick.id, 0);
      setPick({ ...pick, user_backed: true });
    } finally {
      setBacking(false);
    }
  }

  function shareText(): string {
    if (!pick) return "";
    return [
      `🎯 Betpreneur pick`,
      ``,
      `${pick.match}`,
      `${pick.market_plain} @ ${pick.odds.toFixed(2)}`,
      `Confidence: ${pick.confidence.toFixed(1)}% · ${tierLabel(pick.tier)}`,
      ``,
      `"${pick.one_line_reason}"`,
      ``,
      `More picks → https://betprenuer.lovable.app`,
    ].join("\n");
  }

  async function handleShare() {
    if (!pick) return;
    try {
      const blob = await renderShareCard(pick);
      if (!blob) throw new Error("no blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = pick.match.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      a.download = `betpreneur-${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setShareMsg("Card downloaded ✓ Share it on WhatsApp");
      setTimeout(() => setShareMsg(null), 3000);
    } catch (e) {
      console.error(e);
      setShareMsg("Could not download card");
      setTimeout(() => setShareMsg(null), 2500);
    }
  }

  function handleWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText())}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
            className={`min-h-[56px] rounded-md font-medium ${
              pick.user_backed
                ? "bg-white/10 text-muted-foreground cursor-default"
                : "bg-win-green text-background hover:opacity-90"
            }`}
          >
            {pick.user_backed ? "Backed ✓" : backing ? "Saving…" : "I backed this"}
          </button>
          <button
            onClick={handleWhatsApp}
            className="min-h-[56px] rounded-md font-semibold bg-[#25D366] text-background hover:opacity-90 inline-flex items-center justify-center gap-2"
            aria-label="Share on WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.49 0 .15 5.34.15 11.91a11.86 11.86 0 0 0 1.6 5.97L0 24l6.27-1.64a11.93 11.93 0 0 0 5.78 1.47h.01c6.56 0 11.9-5.34 11.9-11.91 0-3.18-1.24-6.17-3.44-8.44ZM12.06 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.72.97.99-3.62-.23-.37a9.85 9.85 0 0 1-1.51-5.27c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.46-4.44 9.9-9.93 9.9Zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"/></svg>
            Share on WhatsApp
          </button>
          <button
            onClick={handleShare}
            className="min-h-[56px] rounded-md font-medium border border-primary text-primary bg-card hover:bg-primary/10"
            aria-label="Download share card image"
          >
            Download card
          </button>
        </div>
      )}
      {shareMsg && (
        <div className="text-center text-[13px] text-muted-foreground">{shareMsg}</div>
      )}
    </div>
  );
}

// ---- Custom canvas renderer for the WhatsApp share card ----
async function renderShareCard(pick: PickDetail): Promise<Blob | null> {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0D0D0D");
  bg.addColorStop(0.55, "#1a0608");
  bg.addColorStop(1, "#2a0408");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Radial red glow top-right
  const glow = ctx.createRadialGradient(W * 0.85, 0, 0, W * 0.85, 0, W * 0.7);
  glow.addColorStop(0, "rgba(232,25,44,0.35)");
  glow.addColorStop(1, "rgba(232,25,44,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Left accent bar
  const accent = ctx.createLinearGradient(0, 0, 0, H);
  accent.addColorStop(0, "#E8192C");
  accent.addColorStop(1, "#8a0d18");
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 10, H);

  const PAD = 72;

  // Brand wordmark (text, no logo dependency)
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 44px Montserrat, -apple-system, 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("BETPRENEUR", PAD, PAD);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 18px Montserrat, sans-serif";
  ctx.fillText("DAILY EDGE PICKS", PAD, PAD + 52);

  // Tier pill (top-right)
  const tier = tierLabel(pick.tier).toUpperCase();
  ctx.font = "700 22px Montserrat, sans-serif";
  const tw = ctx.measureText(tier).width;
  const pillW = tw + 40;
  const pillH = 50;
  const pillX = W - PAD - pillW;
  const pillY = PAD;
  roundRect(ctx, pillX, pillY, pillW, pillH, 8);
  ctx.fillStyle = "#E8192C";
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(tier, pillX + 20, pillY + 14);

  // League / kickoff
  let y = 280;
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "600 26px Montserrat, sans-serif";
  ctx.fillText(`${pick.league} · ${formatKickoff(pick.kickoff_wat)}`, PAD, y);

  // Match title (wrap)
  y += 50;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 72px Montserrat, sans-serif";
  y = wrapText(ctx, pick.match, PAD, y, W - PAD * 2, 78);

  // Market box
  y += 24;
  const marketText = `${pick.market_plain}  @  ${pick.odds.toFixed(2)}`;
  ctx.font = "700 34px Montserrat, sans-serif";
  const mw = ctx.measureText(marketText).width;
  const mPadX = 28;
  const mPadY = 18;
  const mBoxW = mw + mPadX * 2;
  const mBoxH = 34 + mPadY * 2;
  roundRect(ctx, PAD, y, mBoxW, mBoxH, 10);
  ctx.fillStyle = "rgba(232,25,44,0.18)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#E8192C";
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(marketText, PAD + mPadX, y + mPadY);
  y += mBoxH + 32;

  // Reason quote
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "italic 28px Georgia, 'Times New Roman', serif";
  y = wrapText(ctx, `"${pick.one_line_reason}"`, PAD, y, W - PAD * 2, 38);

  // Bottom divider
  const bottomY = H - 220;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, bottomY);
  ctx.lineTo(W - PAD, bottomY);
  ctx.stroke();

  // Confidence
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "600 22px Montserrat, sans-serif";
  ctx.fillText("CONFIDENCE", PAD, bottomY + 28);
  ctx.fillStyle = "#E8192C";
  ctx.font = "900 92px Montserrat, sans-serif";
  ctx.fillText(`${pick.confidence.toFixed(1)}%`, PAD, bottomY + 60);

  // URL right side
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "600 22px Montserrat, sans-serif";
  const lbl = "GET DAILY PICKS";
  const lblW = ctx.measureText(lbl).width;
  ctx.fillText(lbl, W - PAD - lblW, bottomY + 28);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 28px Montserrat, sans-serif";
  const urlText = "betprenuer.lovable.app";
  const urlW = ctx.measureText(urlText).width;
  ctx.fillText(urlText, W - PAD - urlW, bottomY + 60);

  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
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
        {form.map((r, i) => <FormChip key={i} r={r} />)}
      </div>
    </div>
  );
}