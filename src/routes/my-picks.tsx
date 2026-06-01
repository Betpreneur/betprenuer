import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { type Pick } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { todayLagos } from "@/lib/time";
import { MyPicksSkeleton } from "@/components/skeletons";
import { renderPicksShareCard, buildShareCaption, type SharePick } from "@/lib/shareCard";

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
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
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

function PickItem({ pick, clickable = true }: { pick: Pick; clickable?: boolean }) {
  const content = (
    <div className={`bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-xl p-3 ${clickable ? "hover:border-brand-green/50 transition-colors" : "opacity-60 cursor-not-allowed"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">{pick.league}</span>
        {getStatusBadge(pick.status)}
      </div>
      <h3 className="text-[13px] font-medium truncate">{pick.fixture}</h3>
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
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; blob: Blob; fileName: string } | null>(null);

  const dateOptions = getDateOptions();

  const dateLabel = dateOptions.find((d) => d.value === selectedDate)?.label ?? "Today";

  async function openShare() {
    if (generating || picks.length === 0) return;
    setGenerating(true);
    setShareMsg(null);
    try {
      const sharePicks: SharePick[] = picks.map((p) => ({
        fixture: p.fixture,
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

  const loadPicks = (date: string) => {
    setLoading(true);
    setError(null);

    fetch(`https://backend.betpreneur.ng/api/algo/picks/backed?date=${date}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("terminal.token")}` }
    })
      .then(res => res.json())
      .then((res: any) => {
        const arr = Array.isArray(res) ? res : (res.results || res.data || res.picks || []);
        setPicks(arr);
        setStats({
          total: arr.length,
          wins: arr.filter((p: any) => p.status === "win").length,
          losses: arr.filter((p: any) => p.status === "loss").length,
          pending: arr.filter((p: any) => p.status === "pending").length,
        });
      })
      .catch((err) => {
        console.error("Failed to load picks:", err);
        setError("Could not load your picks.");
      })
      .finally(() => setLoading(false));
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
      <div className="flex gap-1">
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
          {picks.map(pick => (<PickItem key={pick.id} pick={pick} clickable={selectedDate === dateOptions[0].value} />))}
        </div>
      )}

      <Link to="/home" className="block text-center text-info-blue text-[14px]">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
