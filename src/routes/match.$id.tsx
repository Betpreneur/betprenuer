import { createFileRoute, Link, Navigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { api, type PickDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tierLabel } from "@/lib/stake";
import { formatKickoff } from "@/lib/time";
import { StakeGuide } from "@/components/StakeGuide";
import logoHorizontal from "@/assets/betpreneur-logo-horizontal.png";

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
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: "#0D0D0D", scale: 2, useCORS: true });
      const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
      if (!blob) return;
      // Always download the file to the user's device
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = pick?.match.replace(/[^a-z0-9]+/gi, "-").toLowerCase() ?? "pick";
      a.download = `betpreneur-${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setShareMsg("Card downloaded ✓");
      setTimeout(() => setShareMsg(null), 2500);
    } catch {
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

      {/* Off-screen WhatsApp share card — square 1080x1080 for chat-friendly preview */}
      <div className="fixed -left-[9999px] top-0" aria-hidden="true">
        <div
          ref={cardRef}
          style={{
            width: 1080,
            height: 1080,
            padding: 64,
            background:
              "radial-gradient(circle at 85% 0%, rgba(232,25,44,0.35) 0%, transparent 55%), linear-gradient(160deg, #0D0D0D 0%, #1a0608 55%, #2a0408 100%)",
            color: "#FFFFFF",
            fontFamily: "Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative accent bar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 8,
              background: "linear-gradient(180deg, #E8192C 0%, #8a0d18 100%)",
            }}
          />

          {/* Top: brand bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <img
              src={logoHorizontal}
              alt="Betpreneur"
              crossOrigin="anonymous"
              style={{ height: 96, width: "auto", objectFit: "contain" }}
            />
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 2,
                background: "#E8192C",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: 8,
              }}
            >
              {tierLabel(pick.tier)}
            </div>
          </div>

          {/* Middle: match + market */}
          <div>
            <div style={{ fontSize: 28, fontWeight: 600, opacity: 0.7, marginBottom: 12 }}>
              {pick.league} · {formatKickoff(pick.kickoff_wat)}
            </div>
            <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.05, marginBottom: 36 }}>
              {pick.match}
            </div>
            <div
              style={{
                display: "inline-block",
                fontSize: 38,
                fontWeight: 700,
                background: "rgba(232,25,44,0.18)",
                border: "2px solid #E8192C",
                color: "#fff",
                padding: "16px 28px",
                borderRadius: 10,
              }}
            >
              {pick.market_plain} @ {pick.odds.toFixed(2)}
            </div>
            <div style={{ fontSize: 30, fontStyle: "italic", opacity: 0.85, marginTop: 32, lineHeight: 1.35 }}>
              "{pick.one_line_reason}"
            </div>
          </div>

          {/* Bottom: confidence + URL */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              borderTop: "1px solid rgba(255,255,255,0.12)",
              paddingTop: 32,
            }}
          >
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, opacity: 0.7, textTransform: "uppercase", letterSpacing: 2 }}>
                Confidence
              </div>
              <div style={{ fontSize: 96, fontWeight: 900, color: "#E8192C", lineHeight: 1 }}>
                {pick.confidence.toFixed(1)}%
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, opacity: 0.7, textTransform: "uppercase", letterSpacing: 2 }}>Daily picks</div>
              <div style={{ fontSize: 30, fontWeight: 700, marginTop: 6 }}>betprenuer.lovable.app</div>
            </div>
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