import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Library, Upload, User, BarChart3, Wallet, Bell, Compass, Heart, Disc3, Users, ListMusic, Download, History, Plus, Crown, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { MiniPlayer } from "./mini-player";
import { BeatifyLogo } from "./logo";
import { SearchCommand } from "./search-command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


type LibraryTab = "All" | "Playlists" | "Albums" | "Songs" | "Podcasts" | "Liked" | "Artists" | "Downloads" | "History";
type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  search?: { tab?: LibraryTab; playlist?: string };
  matchSearch?: { tab?: LibraryTab; playlist?: string };
  activeWhen?: (searchStr: string) => boolean;
};

const mobileTabs: readonly NavItem[] = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/profile", label: "Profile", icon: User },
];

const desktopPrimary: readonly NavItem[] = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/search", label: "Browse", icon: Compass, activeWhen: (s) => !/[?&]q=/.test(s) },
  { to: "/search", label: "Search", icon: Search, activeWhen: (s) => /[?&]q=/.test(s) },
];

const desktopLibrary: readonly NavItem[] = [
  { to: "/library", label: "Liked Songs", icon: Heart, search: { tab: "Liked" }, matchSearch: { tab: "Liked" } },
  { to: "/library", label: "Albums", icon: Disc3, search: { tab: "Albums" }, matchSearch: { tab: "Albums" } },
  { to: "/library", label: "Artists", icon: Users, search: { tab: "Artists" }, matchSearch: { tab: "Artists" } },
  { to: "/library", label: "Playlists", icon: ListMusic, search: { tab: "Playlists" }, matchSearch: { tab: "Playlists" } },
  { to: "/library", label: "Downloads", icon: Download, search: { tab: "Downloads" }, matchSearch: { tab: "Downloads" } },
  { to: "/library", label: "History", icon: History, search: { tab: "History" }, matchSearch: { tab: "History" } },
];

const desktopAccount: readonly NavItem[] = [
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

const sidebarPlaylists = [
  { name: "Vibes of Zimbabwe", songs: 50, gradient: "from-amber-500 to-red-700" },
  { name: "Chill & Relax", songs: 32, gradient: "from-sky-500 to-indigo-700" },
  { name: "Workout Hits", songs: 45, gradient: "from-rose-500 to-fuchsia-700" },
  { name: "Gospel Praise", songs: 60, gradient: "from-emerald-500 to-teal-700" },
  { name: "Zimdancehall Heat", songs: 55, gradient: "from-orange-500 to-red-700" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
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

          <NavGroup items={desktopPrimary} pathname={pathname} searchStr={searchStr} />

          <div className="mt-5 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Your Library
          </div>
          <NavGroup items={desktopLibrary} pathname={pathname} searchStr={searchStr} />

          <div className="mt-5 mb-2 flex items-center justify-between px-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Playlists</span>
            <Link
              to="/library"
              search={{ tab: "Playlists" as LibraryTab }}
              aria-label="New playlist"
              className="grid h-5 w-5 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="flex flex-col gap-0.5 overflow-y-auto pr-1">
            {sidebarPlaylists.map((p) => {
              const active = pathname === "/library" && searchStr.includes(`playlist=${encodeURIComponent(p.name)}`);
              return (
                <li key={p.name}>
                  <Link
                    to="/library"
                    search={{ tab: "Playlists" as LibraryTab, playlist: p.name }}
                    className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition ${active ? "bg-white/10" : "hover:bg-white/5"}`}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md bg-gradient-to-br ${p.gradient} text-white`}>
                      <ListMusic className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[13px] font-semibold ${active ? "text-primary" : ""}`}>{p.name}</span>
                      <span className="block text-[10px] text-muted-foreground">{p.songs} songs</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto pt-4">
            <Link
              to="/premium"
              className="block relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-4 transition hover:border-primary/60"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
              <div className="relative">
                <div className="mb-1 flex items-center gap-1.5 text-primary">
                  <Crown className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Go Premium</span>
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Ad-free music, offline listening and more.
                </p>
                <span className="mt-3 block w-full rounded-lg bg-primary py-1.5 text-center text-xs font-bold text-primary-foreground shadow-glow transition hover:brightness-110">
                  Upgrade Now
                </span>
              </div>
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-6 backdrop-blur-xl">
            <SearchCommand className="flex-1 max-w-xl" />
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="relative grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-white/5 text-foreground transition hover:bg-white/10"
            >
              <Bell className="h-4 w-4" />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="group flex items-center gap-2 rounded-full border border-border/60 bg-white/5 py-1 pl-1 pr-3 text-sm font-semibold text-foreground transition hover:bg-white/10">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                  <User className="h-3.5 w-3.5" />
                </span>
                Account
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {desktopAccount.map(({ to, label, icon: Icon }) => (
                  <DropdownMenuItem key={to} asChild>
                    <Link to={to} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="min-w-0 flex-1 pb-28">{children}</main>
        </div>
      </div>

      {/* Mobile shell */}
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col bg-background md:hidden">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-3 backdrop-blur-xl">
          <Link
            to="/home"
            aria-label="Beatify home"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/60 shadow-glow"
          >
            <BeatifyLogo size={36} />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-background/70 pl-1 pr-3 text-xs font-semibold text-foreground shadow-glow">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                <User className="h-3.5 w-3.5" />
              </span>
              Account
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {desktopAccount.map(({ to, label, icon: Icon }) => (
                <DropdownMenuItem key={to} asChild>
                  <Link to={to} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="min-w-0 flex-1 pb-[152px]">{children}</main>

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

function NavGroup({
  items,
  pathname,
  searchStr,
  compact,
}: {
  items: readonly NavItem[];
  pathname: string;
  searchStr: string;
  compact?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map(({ to, label, icon: Icon, search, matchSearch, activeWhen }) => {
        const pathActive = pathname === to || pathname.startsWith(to + "/");
        let active = pathActive;
        if (pathActive && activeWhen) {
          active = activeWhen(searchStr);
        } else if (pathActive && matchSearch?.tab) {
          active = searchStr.includes(`tab=${matchSearch.tab}`);
        } else if (pathActive && to === "/library" && !matchSearch) {
          // "Your Library" root: only when no tab set
          active = !/\btab=/.test(searchStr);
        }
        return (
          <li key={`${to}-${label}`}>
            <Link
              to={to}
              search={search as never}
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
