import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Pick } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { lagosDateISOOffset, todayLagos } from "@/lib/time";
import { MyPicksSkeleton } from "@/components/skeletons";
import { renderPicksShareCard, buildShareCaption, type SharePick } from "@/lib/shareCard";
import { clearBackedCount } from "@/hooks/useBackedPicks";

export const Route = createFileRoute("/my-picks")({
  head: () => ({
    meta: [
      { title: "My Picks — Betpreneur" },
      { name: "description", content: "Your backed picks and performance tracked." },
    ],
  }),
  component: MyPicksPage,
});

// Generate last 3 dates: today, yesterday, 2 days ago
function getDateOptions() {
  const dates: { value: string; label: string }[] = [];
  for (let i = 0; i < 3; i++) {
    const iso = lagosDateISOOffset(i);
    const label = i === 0 ? "Today" : i === 1 ? "Yesterday" : `${i} days ago`;
    dates.push({ value: iso, label });
  }
  return dates;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "win":
      return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-win-green/20 text-win-green">WIN</span>;
    case "loss":
      return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-danger-red/20 text-danger-red">LOSS</span>;
    case "void":
      return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-white/60">VOID</span>;
    default:
      return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-text/20 text-amber-text">PENDING</span>;
  }
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-3 text-center">
      <div className={`text-[24px] font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
    </div>
  );
}

function PickItem({ pick, clickable = true, onRemove }: { pick: Pick; clickable?: boolean; onRemove?: (id: number) => void }) {
  const content = (
    <div className={`bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-3 ${clickable ? "hover:border-brand-green/50 transition-colors" : "opacity-60 cursor-not-allowed"} relative`}>
      {/* Remove button - show for pending or localStorage picks (no status) */}
      {onRemove && (!pick.status || pick.status === "pending") && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(pick.id); }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-danger-red/20 text-danger-red flex items-center justify-center hover:bg-danger-red hover:text-white transition-colors"
          aria-label="Remove pick"
        >
          ×
        </button>
      )}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">{pick.league}</span>
        {getStatusBadge(pick.status)}
      </div>
      <h3 className="text-[13px] font-medium truncate">{pick.fixture || (pick as any).match || "Unknown match"}</h3>
      <div className="flex items-center justify-between mt-2 text-[11px]">
        <span className="text-muted-foreground">{pick.market} @ {Number(pick.odds).toFixed(2)}</span>
        <span className={`font-bold ${pick.status === "win" ? "text-win-green" : pick.status === "loss" ? "text-danger-red" : "text-amber-text"}`}>
          {pick.confidence?.toFixed(0)}%
        </span>
      </div>
    </div>
  );

  if (!clickable) {
    return <div>{content}</div>;
  }

  return (
    <Link
      to="/match/$id"
      params={{ id: String(pick.match_id || pick.id) }}
    >
      {content}
    </Link>
  );
}

interface Stats {
  total: number;
  wins: number;
  losses: number;
  pending: number;
}

function MyPicksPage() {
  const { isAuthed, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, wins: 0, losses: 0, pending: 0 });
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(lagosDateISOOffset(0));
  const [generating, setGenerating] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; blob: Blob; fileName: string } | null>(null);

  const dateOptions = getDateOptions();

  const dateLabel = dateOptions.find((d) => d.value === selectedDate)?.label ?? "Today";
  const isTodaySelected = selectedDate === dateOptions[0].value;

  async function handleRemovePick(id: number) {
    if (!isTodaySelected) return;
    const target = picks.find((p) => p.id === id);
    try {
      await api.unmarkBacked(target?.match_id || id);
    } catch (e) {
      console.error("Failed to remove pick:", e);
      setError("Could not remove this pick. Please try again.");
      return;
    }
    setPicks((prev) => prev.filter((p) => p.id !== id));
    setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
  }

  async function handleClearAll() {
    if (!isTodaySelected) return;
    if (!confirm("Clear all your picks for today?")) return;
    const results = await Promise.allSettled(picks.map(p => api.unmarkBacked(p.match_id || p.id)));
    if (results.some((r) => r.status === "rejected")) {
      setError("Some picks could not be cleared. Please try again.");
      return;
    }
    clearBackedCount();
    setPicks([]);
    setStats({ total: 0, wins: 0, losses: 0, pending: 0 });
  }

  async function openShare() {
    if (generating || picks.length === 0) return;
    setGenerating(true);
    setShareMsg(null);
    try {
      const sharePicks: SharePick[] = picks.map((p) => ({
        fixture: p.fixture || (p as any).match || "Unknown match",
        market: p.market,
        odds: p.odds,
        confidence: typeof p.confidence === "number" ? p.confidence : undefined,
        league: p.league,
        status: p.status,
      }));
      const blob = await renderPicksShareCard(sharePicks, dateLabel);
      if (!blob) throw new Error("No image generated");
      const url = URL.createObjectURL(blob);
      setPreview({ url, blob, fileName: `betpreneur-my-picks-${selectedDate}.png` });
    } catch (e) {
      console.error("Share card error:", e);
      setShareMsg("Could not generate image. Please try again.");
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
    setShareMsg("Image downloaded ✓");
    setTimeout(() => setShareMsg(null), 2500);
  }

  async function shareFromPreview() {
    if (!preview) return;
    const file = new File([preview.blob], preview.fileName, { type: "image/png" });
    const caption = buildShareCaption(picks.length);
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    try {
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text: caption, title: "My Betpreneur picks" });
        return;
      }
    } catch (e) {
      console.error(e);
    }
    downloadFromPreview();
    window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, "_blank", "noopener,noreferrer");
    setShareMsg("Image saved ✓ Attach it in WhatsApp");
    setTimeout(() => setShareMsg(null), 3500);
  }

  const applyPicks = (arr: any[]) => {
    setPicks(arr as Pick[]);
    setStats({
      total: arr.length,
      wins: arr.filter((p: any) => p.status === "win").length,
      losses: arr.filter((p: any) => p.status === "loss").length,
      pending: arr.filter((p: any) => !p.status || p.status === "pending").length,
    });
  };

  const loadPicks = async (_date: string) => {
    setLoading(true);
    setError(null);

    // Primary source: backend, so picks sync across all devices.
    try {
      const res = await api.getBackedPicks(_date);
      const arr = Array.isArray(res) ? res : ((res as any)?.results || (res as any)?.data || (res as any)?.picks || []);
      applyPicks(Array.isArray(arr) ? arr : []);
    } catch (err) {
      console.error("Failed to load picks from backend:", err);
      applyPicks([]);
      setError("Could not load your picks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthed) {
      loadPicks(selectedDate);
    }
  }, [authLoading, isAuthed, selectedDate]);

  if (authLoading || loading) {
    return <MyPicksSkeleton />;
  }

  if (!isAuthed) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-bold">My Picks</h1>
        <p className="text-[13px] text-muted-foreground">{todayLagos()}</p>
      </header>

      {/* Date Toggles */}
      <div className="flex gap-1 items-center">
        {dateOptions.map(d => (
          <button
            key={d.value}
            onClick={() => setSelectedDate(d.value)}
            className={`flex-1 py-2 px-2 text-[12px] font-medium rounded-lg transition-colors ${
              selectedDate === d.value
                ? "bg-brand-green text-primary-foreground"
                : "bg-card border border-brand-border text-muted-foreground hover:border-brand-green/50"
            }`}
          >
            {d.label}
          </button>
        ))}
        {isTodaySelected && picks.length > 0 && (
          <button
            onClick={handleClearAll}
            className="py-2 px-3 text-[11px] font-medium rounded-lg bg-danger-red/10 text-danger-red border border-danger-red/30 hover:bg-danger-red hover:text-white transition-colors"
            title="Clear all picks for today"
          >
            Clear
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="Total" value={stats.total} color="text-white" />
        <StatCard label="Wins" value={stats.wins} color="text-win-green" />
        <StatCard label="Loss" value={stats.losses} color="text-danger-red" />
        <StatCard label="Pending" value={stats.pending} color="text-amber-text" />
      </div>

      {/* Picks List */}
      {error ? (
        <div className="bg-danger-red/10 border border-danger-red/30 rounded-xl p-4 text-center text-danger-red">
          {error}
        </div>
      ) : picks.length === 0 ? (
        <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">🎯</div>
          <p className="text-muted-foreground">No picks backed on this date</p>
        </div>
      ) : (
        <div className="space-y-2">
          {picks.map(pick => (<PickItem key={pick.id} pick={pick} clickable={isTodaySelected} onRemove={isTodaySelected ? handleRemovePick : undefined} />))}
        </div>
      )}

      {picks.length > 0 && (
        <button
          onClick={openShare}
          disabled={generating}
          className="w-full min-h-[52px] rounded-xl font-semibold bg-[#25D366] text-background hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.49 0 .15 5.34.15 11.91a11.86 11.86 0 0 0 1.6 5.97L0 24l6.27-1.64a11.93 11.93 0 0 0 5.78 1.47h.01c6.56 0 11.9-5.34 11.9-11.91 0-3.18-1.24-6.17-3.44-8.44Z"/></svg>
          {generating ? "Preparing…" : "Share my picks"}
        </button>
      )}
      {shareMsg && (
        <div className="text-center text-[13px] text-muted-foreground">{shareMsg}</div>
      )}

      <Link to="/home" className="block text-center text-info-blue text-[14px]">
        ← Back to Dashboard
      </Link>

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
              <h2 className="text-[16px] font-semibold leading-none">Share preview</h2>
              <button
                onClick={closePreview}
                className="text-muted-foreground hover:text-foreground text-[20px] leading-none px-2"
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <img src={preview.url} alt="My picks share card" className="w-full h-auto rounded-lg block" />
              <p className="text-[12px] text-muted-foreground text-center mt-3">
                Includes a caption and link so friends can join Betpreneur.
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
