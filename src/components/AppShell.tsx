import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { todayLagos } from "@/lib/time";
import { useAuth } from "@/lib/auth";
import { Home, Trophy, BarChart3, Settings as SettingsIcon, Menu, X, LogIn, UserPlus } from "lucide-react";
import type { ReactNode } from "react";
import logoHorizontal from "@/assets/betpreneur-logo-horizontal.png";

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/top-pick", label: "Top Pick", icon: Trophy },
  { to: "/record", label: "Record", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth();
  const router = useRouter();
  const path = router.state.location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 bg-primary border-b border-primary">
        <div className="mx-auto h-20 flex items-center justify-between px-4 md:px-8 max-w-3xl">
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

      <main className="flex-1 w-full pb-24 md:pb-10 pt-4 max-w-3xl mx-auto px-4">{children}</main>

      {/* Mobile bottom nav */}
      {isAuthed && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-[#0D0D0D] border-t border-brand-border">
          <ul className="grid grid-cols-4">
            {navItems.map((n) => {
              const active = path === n.to || (n.to === "/home" && path.startsWith("/match"));
              const Icon = n.icon;
              return (
                <li key={n.to}>
                  <Link to={n.to} className={`h-[56px] flex flex-col items-center justify-center gap-0.5 text-[11px] ${active ? "text-primary font-semibold" : "text-muted-foreground"}`}>
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