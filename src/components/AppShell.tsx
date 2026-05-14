import { Link, useRouter } from "@tanstack/react-router";
import { todayLagos } from "@/lib/time";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, Trophy, BarChart3, Settings as SettingsIcon } from "lucide-react";
import type { ReactNode } from "react";
import logoHorizontal from "@/assets/betpreneur-logo-horizontal.png";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/home", label: "Today", icon: Trophy },
  { to: "/top-pick", label: "Top Pick", icon: Trophy },
  { to: "/record", label: "Record", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth();
  const router = useRouter();
  const path = router.state.location.pathname;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 bg-primary border-b border-primary">
        <div className={`mx-auto h-20 flex items-center justify-between px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 ${path === "/" ? "max-w-[1600px]" : "max-w-3xl"}`}>
          <Link
            to="/"
            aria-label="Betpreneur — home"
            className="flex items-center rounded-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            <img
              src={logoHorizontal}
              alt="Betpreneur"
              className="h-10 md:h-11 w-auto select-none"
              draggable={false}
            />
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5 text-[14px]">
            {isAuthed ? (
              navItems.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="text-white/80 hover:text-white transition-colors"
                  activeProps={{ className: "text-white font-semibold underline underline-offset-8 decoration-2" }}
                >
                  {n.label}
                </Link>
              ))
            ) : (
              <>
                <Link to="/record" className="text-white/80 hover:text-white" activeProps={{ className: "text-white font-semibold" }}>Record</Link>
                <Link to="/top-pick" className="text-white/80 hover:text-white" activeProps={{ className: "text-white font-semibold" }}>Top Pick</Link>
                <Link
                  to="/login"
                  className="text-white/90 hover:text-white border border-white/40 hover:border-white px-4 py-2 rounded-md text-[13px] font-semibold uppercase tracking-wide"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-white text-primary px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-white/90 uppercase tracking-wide"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
          <span className="md:hidden text-[12px] text-white/80">{todayLagos()}</span>
        </div>
      </header>

      <main className={`flex-1 w-full pb-24 md:pb-10 pt-4 ${path === "/" ? "" : "mx-auto max-w-3xl px-4"}`}>{children}</main>

      {isAuthed && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-[#0D0D0D] border-t border-brand-border">
          <ul className="grid grid-cols-4">
            {navItems.map((n) => {
              const active =
                path === n.to ||
                (n.to === "/home" && path.startsWith("/match"));
              const Icon = n.icon;
              return (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    className={`h-[56px] flex flex-col items-center justify-center gap-0.5 text-[11px] ${
                      active ? "text-primary font-semibold" : "text-muted-foreground"
                    }`}
                  >
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