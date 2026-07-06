import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Library, Upload, User, BarChart3, Wallet, Bell } from "lucide-react";
import type { ReactNode } from "react";
import { MiniPlayer } from "./mini-player";
import { BeatifyLogo } from "./logo";

const mobileTabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const desktopNav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Your Library", icon: Library },
  { to: "/upload", label: "Upload", icon: Upload },
] as const;

const desktopAccount = [
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPlayer = pathname === "/player";

  if (isPlayer) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background lg:flex lg:min-h-screen lg:flex-col">
      {/* Desktop shell */}
      <div className="hidden lg:flex lg:min-h-screen lg:flex-1">
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col gap-2 border-r border-border/60 bg-surface/40 px-4 py-6">
          <Link to="/home" className="mb-4 flex items-center gap-2 px-2">
            <BeatifyLogo size={36} withWordmark wordmarkClassName="text-xl" />
          </Link>
          <NavGroup items={desktopNav} pathname={pathname} />
          <div className="mt-6 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Account
          </div>
          <NavGroup items={desktopAccount} pathname={pathname} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-w-0 flex-1 pb-28">{children}</main>
        </div>
      </div>

      {/* Mobile shell */}
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col bg-background lg:hidden">
        <Link
          to="/home"
          aria-label="Beatify home"
          className="pointer-events-auto fixed left-4 top-3 z-30 rounded-full bg-background/60 p-1 shadow-glow backdrop-blur"
        >
          <BeatifyLogo size={30} />
        </Link>
        <main className="flex-1 pb-[152px]">{children}</main>
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[520px]">
          <MiniPlayer />
          <nav className="border-t border-border/60 bg-background/95 backdrop-blur-xl">
            <ul className="grid grid-cols-5">
              {mobileTabs.map(({ to, label, icon: Icon }) => {
                const active = pathname === to || pathname.startsWith(to + "/");
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      className={`flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition ${
                        active ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop persistent mini-player docked bottom, offset by sidebar */}
      <div className="fixed inset-x-0 bottom-0 z-40 hidden lg:block lg:pl-64">
        <MiniPlayer />
      </div>
    </div>
  );
}

type NavItem = { to: string; label: string; icon: typeof Home };
function NavGroup({ items, pathname }: { items: readonly NavItem[]; pathname: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(to + "/");
        return (
          <li key={to}>
            <Link
              to={to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Music() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M9 17V5l12-2v12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="15" r="3" />
    </svg>
  );
}
