import { Link, useRouter, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { todayLagos } from "@/lib/time";
import { useAuth } from "@/lib/auth";
import { Home, Trophy, BarChart3, Settings as SettingsIcon, Menu, X, LogIn, UserPlus, Target } from "lucide-react";
import { useBackedCount, useBackedPicks, removeBackedPick, clearAllBackedPicks } from "@/hooks/useBackedPicks";
import { api } from "@/lib/api";
import type { ReactNode } from "react";
import logoHorizontal from "@/assets/betpreneur-logo-horizontal.png";

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/top-pick", label: "Top Pick", icon: Trophy },
  { to: "/my-picks", label: "My Picks", icon: Target },
  { to: "/record", label: "Record", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backedPopupOpen, setBackedPopupOpen] = useState(false);
  const backedPickCount = useBackedCount();
  const backedPicksList = useBackedPicks();
  const router = useRouter();

  // Close popup on route change
  useEffect(() => {
    setBackedPopupOpen(false);
  }, [path]);

  const handleConfirm = async () => {
    // Send picks to backend API to save, then clear localStorage
    const picksToSave = backedPicksList;
    
    try {
      // Call backend for each pick using api
      for (const pick of picksToSave) {
        await api.markBacked(pick.id);
      }
    } catch (e) {
      console.error("Failed to save picks to backend:", e);
    }
    
    // Clear localStorage after sending to backend
    clearAllBackedPicks();
    setBackedPopupOpen(false);
    router.navigate({ to: "/my-picks" });
  };

  const handleClearAll = () => {
    clearAllBackedPicks();
    setBackedPopupOpen(false);
  };

  const handleRemovePick = (id: number) => {
    removeBackedPick(id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 bg-primary border-b border-primary">
        <div className="mx-auto h-20 flex items-center justify-between px-4 md:px-8 lg:px-16 xl:px-16 max-w-[1400px]">
          <Link to="/" aria-label="Betpreneur home" className="flex items-center">
            <img src={logoHorizontal} alt="Betpreneur" className="h-10 w-auto" />
          </Link>
          
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5 text-[14px]">
            {isAuthed ? (
              navItems.map((n) => (
                <Link key={n.to} to={n.to} className="text-white/80 hover:text-white">
                  {n.label}
                </Link>
              ))
            ) : (
              <>
                <Link to="/record" className="text-white/80 hover:text-white">Record</Link>
                <Link to="/login" className="text-white/80 hover:text-white border border-white/40 px-3 py-1.5 rounded text-[13px]">Log in</Link>
                <Link to="/signup" className="bg-white text-primary px-3 py-1.5 rounded text-[13px] font-semibold">Sign up</Link>
              </>
            )}
          </nav>

          {/* Floating badge - only show on protected pages */}
          {isAuthed && backedPickCount > 0 && !backedPopupOpen && path !== "/" && (
            <button 
              onClick={() => setBackedPopupOpen(true)}
              className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 bg-win-green text-primary font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
              aria-label="View backed picks"
            >
              {backedPickCount}
            </button>
          )}

          {/* Backed picks popup - only show on protected pages */}
          {isAuthed && backedPickCount > 0 && backedPopupOpen && path !== "/" && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40 bg-black/50" 
                onClick={() => setBackedPopupOpen(false)}
              />
              {/* Popup - higher on mobile to avoid bottom menu */}
              <div className="fixed bottom-20 md:bottom-6 right-6 z-50 w-80 max-h-96 bg-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-brand-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">Backed Picks ({backedPickCount})</h3>
                    <button onClick={() => setBackedPopupOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {/* Picks list */}
                <div className="max-h-48 overflow-y-auto p-2">
                  {backedPicksList.map((pick) => (
                    <div key={pick.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium truncate">{pick.match}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{pick.market} @ {Number(pick.odds).toFixed(2)}</div>
                      </div>
                      <button 
                        onClick={() => handleRemovePick(pick.id)}
                        className="ml-2 w-6 h-6 rounded-full bg-danger-red/20 text-danger-red flex items-center justify-center hover:bg-danger-red hover:text-white transition-colors text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {/* Actions */}
                <div className="p-3 border-t border-brand-border flex gap-2">
                  <button 
                    onClick={handleClearAll}
                    className="flex-1 py-2 text-[12px] font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Clear All
                  </button>
                  <button 
                    onClick={handleConfirm}
                    className="flex-1 py-2 text-[12px] font-medium rounded-lg bg-win-green text-primary hover:opacity-90 transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Mobile menu button - hamburger */}
          <button className="md:hidden p-2 text-white" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile slide-in sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-[#0D0D0D] border-l border-brand-border px-4 py-6">
            <div className="flex justify-end mb-6">
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-muted-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {isAuthed ? (
                navItems.map((n) => {
                  const Icon = n.icon;
                  return (
                    <Link key={n.to} to={n.to} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] text-muted-foreground">
                      <Icon className="h-5 w-5" />
                      {n.label}
                    </Link>
                  );
                })
              ) : (
                <>
                  <Link to="/record" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground">
                    <BarChart3 className="h-5 w-5" />Record
                  </Link>
                  <Link to="/top-pick" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground">
                    <Trophy className="h-5 w-5" />Top Pick
                  </Link>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground">
                    <LogIn className="h-5 w-5" />Log in
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary font-semibold">
                    <UserPlus className="h-5 w-5" />Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 w-full pb-24 md:pb-10 pt-4 max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">{children}</main>

      {/* Mobile bottom nav */}
      {isAuthed && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-[#0D0D0D] border-t border-brand-border">
          <ul className="grid grid-cols-5">
            {navItems.map((n) => {
              const active = path === n.to || (n.to === "/home" && path.startsWith("/match"));
              const Icon = n.icon;
              return (
                <li key={n.to}>
                  <Link to={n.to} className={`h-[56px] flex flex-col items-center justify-center gap-0.5 text-[11px] relative ${active ? "text-danger-red font-semibold" : "text-muted-foreground"}`}>
                    {active && <span className="absolute top-1.5 w-1.5 h-1.5 rounded-full bg-danger-red" />}
                    <Icon className="h-5 w-5" />
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}