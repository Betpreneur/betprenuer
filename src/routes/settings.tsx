import { createFileRoute, Navigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Betpreneur" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, isAuthed, loading, refresh, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isInstallable, promptInstall } = usePwaInstall();

  // Simple check: if not running as installed app, show install button
  const canInstall = typeof window !== "undefined" && 
    !window.matchMedia("(display-mode: standalone)").matches;

  useEffect(() => {
    if (user) {
      setName(user.name);
      setWhatsapp(user.whatsapp);
    }
  }, [user]);

  if (loading) return null;
  if (!isAuthed || !user) return <Navigate to="/login" />;

  const dirty =
    name !== user.name ||
    whatsapp !== user.whatsapp;

  async function save() {
    setError(null);
    setSaving(true);
    try {
      await api.updateMe({ name, whatsapp });
      await refresh();
      setToast("Saved.");
      setTimeout(() => setToast(null), 2000);
    } catch {
      setError("Could not save — tap to retry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <h1>Settings</h1>

      <div className="bg-card border border-brand-border rounded-lg p-5 space-y-4">
        <Field label="Full name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="ipt" disabled={saving} />
        </Field>
        <Field label="WhatsApp number">
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="ipt" disabled={saving} />
        </Field>
        {user.username && (
          <div>
            <span className="block text-[13px] font-medium text-foreground mb-1">Username</span>
            <div className="text-[14px] text-foreground">@{user.username}</div>
          </div>
        )}
        <div>
          <span className="block text-[13px] font-medium text-foreground mb-1">Email</span>
          <div className="text-[14px] text-foreground">{user.email}</div>
          <p className="text-[12px] text-muted-foreground mt-1">To change your email, contact support.</p>
        </div>

        {error && <div className="bg-danger-bg text-danger-red text-[13px] p-3 rounded-md">{error}</div>}

        <button
          onClick={save}
          disabled={!dirty || saving}
          className="w-full bg-brand-green text-primary-foreground font-medium py-3 rounded-md disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {canInstall && (
        <div className="bg-card border border-brand-border rounded-lg p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Install App</h3>
          <p className="text-sm text-muted-foreground">
            Add BetPreneur to your home screen for quick access.
          </p>
          <button
            onClick={() => promptInstall?.() || alert("To install: tap Share > Add to Home Screen")}
            className="w-full bg-brand-green text-primary-foreground font-medium py-3 rounded-md"
          >
            Install App
          </button>
        </div>
      )}

      <button
        onClick={async () => {
          await logout();
          // Hard redirect ensures we land on the marketing homepage with the hero
          if (typeof window !== "undefined") {
            window.location.href = "/";
          } else {
            router.navigate({ to: "/" });
          }
        }}
        className="w-full border border-brand-border bg-card text-body-text py-3 rounded-md"
      >
        Log out
      </button>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-brand-green text-primary-foreground px-4 py-2 rounded-md text-[13px] shadow">
          {toast}
        </div>
      )}

      <style>{`
        .ipt { display:block; width:100%; padding:10px 12px; border:1px solid var(--brand-border); border-radius:6px; font-size:15px; background:var(--jet-surface-2); color:var(--pure-white); }
        .ipt:focus { outline:2px solid var(--primary); outline-offset:1px; }
        .ipt:disabled { opacity:0.6; }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-foreground mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[12px] text-muted-foreground mt-1">{hint}</span>}
    </label>
  );
}