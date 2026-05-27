import { createFileRoute, Navigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

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
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.807 2.885 2.165a1.724 1.724 0 01-.129 1.826c-.238.48-1.597.407-2.253.103a1.724 1.724 0 00-1.639 1.029c-.667 1.493-2.282 1.373-2.858.476a1.724 1.724 0 01-1.139 1.022 1.724 1.724 0 01-1.107-1.455c.535-1.429.177-3.058-.89-3.664a1.724 1.724 0 00-1.605.046 1.724 1.724 0 00-1.028 1.615c.395.945.06 2.045-.574 2.609z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-[24px] font-bold">Settings</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Manage your account</p>
      </div>

      <div className="bg-gradient-to-br from-card to-jet-surface-2 border border-brand-border rounded-2xl p-5 space-y-5">
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