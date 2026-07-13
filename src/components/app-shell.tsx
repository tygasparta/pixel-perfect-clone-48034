import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Library, Upload, User, BarChart3, Wallet, Bell, Compass, Heart, Disc3, Users, ListMusic, Download, History, Plus, Crown } from "lucide-react";
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

const desktopPrimary = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/search", label: "Browse", icon: Compass },
  { to: "/search", label: "Search", icon: Search },
] as const;

const desktopLibrary = [
  { to: "/library", label: "Liked Songs", icon: Heart },
  { to: "/library", label: "Albums", icon: Disc3 },
  { to: "/library", label: "Artists", icon: Users },
  { to: "/library", label: "Playlists", icon: ListMusic },
  { to: "/library", label: "Downloads", icon: Download },
  { to: "/library", label: "History", icon: History },
] as const;

const desktopAccount = [
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const sidebarPlaylists = [
  { name: "Vibes of Zimbabwe", songs: 50, gradient: "from-amber-500 to-red-700" },
  { name: "Chill & Relax", songs: 32, gradient: "from-sky-500 to-indigo-700" },
  { name: "Workout Hits", songs: 45, gradient: "from-rose-500 to-fuchsia-700" },
  { name: "Gospel Praise", songs: 60, gradient: "from-emerald-500 to-teal-700" },
  { name: "Zimdancehall Heat", songs: 55, gradient: "from-orange-500 to-red-700" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPlayer = pathname === "/player";

  if (isPlayer) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background md:flex md:min-h-screen md:flex-col">
      {/* Desktop shell */}
      <div className="hidden md:flex md:min-h-screen md:flex-1">
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col gap-1 border-r border-border/60 bg-black/40 px-3 py-5">
          <Link to="/home" className="mb-4 flex items-center gap-2 px-2">
            <BeatifyLogo size={44} withWordmark wordmarkClassName="text-xl" />
          </Link>

          <NavGroup items={desktopPrimary} pathname={pathname} />

          <div className="mt-5 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Your Library
          </div>
          <NavGroup items={desktopLibrary} pathname={pathname} />

          <div className="mt-5 mb-2 flex items-center justify-between px-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Playlists</span>
            <button aria-label="New playlist" className="grid h-5 w-5 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="flex flex-col gap-0.5 overflow-y-auto pr-1">
            {sidebarPlaylists.map((p) => (
              <li key={p.name}>
                <Link
                  to="/library"
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white/5"
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md bg-gradient-to-br ${p.gradient} text-white`}>
                    <ListMusic className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                    <span className="block text-[10px] text-muted-foreground">{p.songs} songs</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-4">
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-4">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
              <div className="relative">
                <div className="mb-1 flex items-center gap-1.5 text-primary">
                  <Crown className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Go Premium</span>
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Ad-free music, offline listening and more.
                </p>
                <button className="mt-3 w-full rounded-lg bg-primary py-1.5 text-xs font-bold text-primary-foreground shadow-glow transition hover:brightness-110">
                  Upgrade Now
                </button>
              </div>
            </div>
            <div className="mt-3 border-t border-border/50 pt-3">
              <div className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account</div>
              <NavGroup items={desktopAccount} pathname={pathname} compact />
            </div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-w-0 flex-1 pb-28">{children}</main>
        </div>
      </div>

      {/* Mobile shell */}
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col bg-background md:hidden">
        <Link
          to="/home"
          aria-label="Beatify home"
          className="pointer-events-auto fixed left-3 top-2 z-30 rounded-full bg-background/60 p-1.5 shadow-glow backdrop-blur"
        >
          <BeatifyLogo size={48} />
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
      <div className="fixed inset-x-0 bottom-0 z-40 hidden md:block md:pl-64">
        <MiniPlayer />
      </div>
    </div>
  );
}

type NavItem = { to: string; label: string; icon: typeof Home };
function NavGroup({ items, pathname, compact }: { items: readonly NavItem[]; pathname: string; compact?: boolean }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(to + "/");
        return (
          <li key={`${to}-${label}`}>
            <Link
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 ${compact ? "py-1.5 text-xs" : "py-2 text-sm"} font-semibold transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
