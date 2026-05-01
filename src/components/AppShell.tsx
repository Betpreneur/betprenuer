import { Link, useRouter } from "@tanstack/react-router";
import { todayLagos } from "@/lib/time";
import { useAuth } from "@/lib/auth";
import { Home, Trophy, BarChart3, Settings as SettingsIcon } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { to: "/home", label: "Today", icon: Home },
  { to: "/top-pick", label: "Top Pick", icon: Trophy },
  { to: "/record", label: "Record", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth();
  const router = useRouter();
  const path = router.state.location.pathname;

  return (
    <div className="min-h-screen flex flex-col bg-subtle-bg">
      <header className="sticky top-0 z-20 bg-card border-b border-brand-border">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link to={isAuthed ? "/home" : "/record"} className="font-semibold tracking-tight text-brand-green text-[18px]">
            Betpreneur
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5 text-[14px]">
            {isAuthed ? (
              navItems.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="text-body-text hover:text-brand-green"
                  activeProps={{ className: "text-brand-green font-medium" }}
                >
                  {n.label}
                </Link>
              ))
            ) : (
              <>
                <Link to="/record" className="text-body-text hover:text-brand-green" activeProps={{ className: "text-brand-green font-medium" }}>Record</Link>
                <Link to="/top-pick" className="text-body-text hover:text-brand-green" activeProps={{ className: "text-brand-green font-medium" }}>Top Pick</Link>
                <Link
                  to="/signup"
                  className="bg-brand-green text-primary-foreground px-4 py-2 rounded-md text-[13px] font-medium hover:opacity-90"
                >
                  Subscribe
                </Link>
              </>
            )}
          </nav>
          <span className="md:hidden text-[13px] text-muted-foreground">{todayLagos()}</span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 pb-24 md:pb-10 pt-4">{children}</main>

      {isAuthed && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-card border-t border-brand-border">
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
                      active ? "text-brand-green font-medium" : "text-muted-foreground"
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