import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, Play, Pause, Mail, ChevronDown, ArrowLeft, ArrowRight, Heart, ListPlus, Radio } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { TrackRow } from "@/components/track-row";
import { RecommendedForYou } from "@/components/recommended-for-you";
import { SearchCommand } from "@/components/search-command";
import { demoTracks, madeForYou } from "@/lib/mock-data";
import { usePlayer } from "@/lib/player";
import { getTrendingTracks, getNewReleases, getRecentlyPlayed } from "@/lib/catalog.functions";
import { dbTrackToTrack } from "@/lib/track-mapper";
import heroArtist from "@/assets/hero-artist.jpg";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).single();
      return data;
    },
  });
}

function HomePage() {
  return (
    <>
      <MobileHome />
      <DesktopHome />
    </>
  );
}

/* ------------------------------ MOBILE (unchanged) ------------------------------ */
function MobileHome() {
  const { data: profile } = useProfile();
  const { play } = usePlayer();
  const trending = demoTracks.slice(0, 3);
  const newReleases = demoTracks.slice(3, 6);

  return (
    <div className="px-5 pt-14 md:hidden">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Good Morning<br />
            <span className="flex items-center gap-2">
              {profile?.display_name ?? "there"} <span>👋</span>
            </span>
          </h1>
        </div>
        <button className="relative grid h-11 w-11 place-items-center rounded-full bg-surface">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </button>
      </div>

      <Section title="Made for you">
        <RecommendedForYou limit={10} />
      </Section>

      <Section title="Trending in Zimbabwe">
        <div className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
          {trending.map((t) => (
            <button key={t.id} onClick={() => play(t, trending)} className="w-32 shrink-0 snap-start text-left">
              <div className="relative aspect-square overflow-hidden rounded-2xl shadow-card">
                <img src={t.cover} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-2">
                  <div className="truncate text-[13px] font-bold text-white">{t.title}</div>
                  <div className="truncate text-[11px] text-white/70">{t.artist}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="New Releases">
        <div className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
          {newReleases.map((t) => (
            <button key={t.id} onClick={() => play(t, newReleases)} className="w-32 shrink-0 snap-start text-left">
              <div className="relative aspect-square overflow-hidden rounded-2xl shadow-card">
                <img src={t.cover} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="mt-2 truncate text-[13px] font-semibold">{t.title}</div>
              <div className="truncate text-[11px] text-muted-foreground">{t.artist}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Made For You">
        <div className="grid grid-cols-3 gap-3">
          {madeForYou.map((m) => (
            <div key={m.name} className={`aspect-square rounded-2xl bg-gradient-to-br p-3 text-left shadow-card ${m.color}`}>
              <div className="flex h-full flex-col justify-between">
                <div className="text-sm font-bold">{m.name}</div>
                <div className="text-[10px] text-white/70">{m.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Continue Listening">
        <div className="space-y-1">
          {demoTracks.slice(6).map((t) => (
            <TrackRow key={t.id} track={t} queue={demoTracks} />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <button className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          See all <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      {children}
    </section>
  );
}

/* ------------------------------ DESKTOP ------------------------------ */

const trendingPlaylists = [
  { name: "Zim Top 50", songs: 50, tag: "ZIM TOP 50", from: "from-slate-900", to: "to-red-950", accent: "text-white" },
  { name: "Zimdancehall Hits", songs: 75, tag: "ZIMDANCEHALL HITS", from: "from-amber-500", to: "to-orange-700", accent: "text-black" },
  { name: "Afro Fusion Vibes", songs: 60, tag: "AFRO FUSION VIBES", from: "from-emerald-800", to: "to-teal-950", accent: "text-white" },
  { name: "Gospel Hits ZW", songs: 40, tag: "GOSPEL HITS ZW", from: "from-indigo-700", to: "to-purple-950", accent: "text-white" },
  { name: "Sungura Classics", songs: 55, tag: "SUNGURA CLASSICS", from: "from-rose-700", to: "to-red-950", accent: "text-white" },
  { name: "Hip Hop ZW", songs: 65, tag: "HIP HOP ZW", from: "from-neutral-800", to: "to-red-950", accent: "text-white" },
];

const recentActivity = [
  { kind: "like", who: "You liked", title: "Gwara Gwara", sub: "Master H", time: "2m", tint: "bg-primary/20 text-primary" },
  { kind: "add", who: "You added", title: "Maita Basa", sub: "to Vibes of Zimbabwe", time: "15m", tint: "bg-emerald-500/20 text-emerald-400" },
  { kind: "release", who: "Winky D released", title: "Deep in My Heart", sub: "Album", time: "1h", tint: "bg-fuchsia-500/20 text-fuchsia-400" },
  { kind: "upload", who: "Saintfloew uploaded", title: "Forever", sub: "Single", time: "3h", tint: "bg-sky-500/20 text-sky-400" },
  { kind: "friend", who: "Tariro liked", title: "Ndini Mukudzei", sub: "Winky D", time: "5h", tint: "bg-primary/20 text-primary" },
];

const friendActivity = [
  { name: "Tariro Moyo", track: "Sorai", artist: "Nutty O" },
  { name: "Kuda Jnr", track: "Pachena", artist: "Voltz JT" },
  { name: "Chipo Mapfumo", track: "Jerusarema", artist: "Jah Prayzah" },
  { name: "Carl Mutandwa", track: "Made In Zimbabwe", artist: "Nutty O" },
];

function DesktopHome() {
  const { data: profile } = useProfile();
  const greeting = greetingByHour();

  const fetchTrending = useServerFn(getTrendingTracks);
  const fetchNewReleases = useServerFn(getNewReleases);
  const fetchRecent = useServerFn(getRecentlyPlayed);
  const { current, isPlaying, play, toggle } = usePlayer();

  const trendingQ = useQuery({
    queryKey: ["catalog", "trending", 6],
    queryFn: () => fetchTrending({ data: { limit: 6 } }),
    staleTime: 60_000,
  });
  const newReleasesQ = useQuery({
    queryKey: ["catalog", "new-releases", 5],
    queryFn: () => fetchNewReleases({ data: { limit: 5 } }),
    staleTime: 60_000,
  });
  const recentQ = useQuery({
    queryKey: ["catalog", "recently-played", 6, current?.id ?? null],
    queryFn: () => fetchRecent({ data: { limit: 6 } }),
    staleTime: 15_000,
  });

  const trending = (trendingQ.data ?? []).map(dbTrackToTrack);
  const newReleases = (newReleasesQ.data ?? []).map(dbTrackToTrack);
  const recent = (recentQ.data ?? []).map(dbTrackToTrack);

  // Fallbacks so first-time users still see something rich
  const continueListening = recent.length > 0 ? recent : demoTracks.slice(0, 6);
  const newReleasesList = newReleases.length > 0 ? newReleases : demoTracks.slice(3, 8);
  const trendingRow = trending.length > 0 ? trending.slice(0, 6) : demoTracks.slice(0, 6);

  const topArtists = Array.from(
    new Map(demoTracks.map((t) => [t.artistId, { id: t.artistId, name: t.artist, cover: t.cover }])).values()
  ).slice(0, 5);

  // Build the mix from recent listening (shuffled), falling back to trending/demo
  const mixQueue = (() => {
    const source = recent.length > 0 ? recent : trending.length > 0 ? trending : demoTracks;
    const arr = source.slice(0, 12);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const isMixPlaying = isPlaying && current != null && continueListening.some((t) => t.id === current.id);

  const playMix = () => {
    if (isMixPlaying) {
      toggle();
      return;
    }
    if (current && continueListening.some((t) => t.id === current.id)) {
      // Same mix, just resume
      toggle();
      return;
    }
    const queue = mixQueue();
    if (queue.length > 0) play(queue[0], queue);
  };

  return (
    <div className="hidden md:block">
      <div className="grid grid-cols-[1fr_320px] gap-0">
        {/* -------- Center column -------- */}
        <div className="min-w-0">
          {/* Top bar */}
          <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/40 bg-background/80 px-8 py-3 backdrop-blur-xl">
            <div className="flex gap-1">
              <NavArrow dir="left" />
              <NavArrow dir="right" />
            </div>
            <SearchCommand className="flex-1" />
            <button className="relative grid h-9 w-9 place-items-center rounded-full bg-surface/70 ring-1 ring-border transition hover:bg-surface">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] font-black text-primary-foreground">3</span>
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-surface/70 ring-1 ring-border transition hover:bg-surface">
              <Mail className="h-4 w-4" />
            </button>
          </div>

          {/* Hero */}
          <section className="px-8 pt-6">
            <div className="relative overflow-hidden rounded-3xl bg-black shadow-card ring-1 ring-border">
              <img src={heroArtist} alt="" className="h-[280px] w-full object-cover object-right" />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex max-w-[55%] flex-col justify-center px-10">
                <div className="text-sm font-semibold text-white/80">{greeting},</div>
                <h1 className="mt-1 flex items-center gap-3 text-5xl font-black leading-none text-white">
                  {(profile?.display_name ?? "there").split(" ")[0]}
                  <span className="text-4xl">👋</span>
                </h1>
                <p className="mt-3 max-w-sm text-sm text-white/70">
                  Discover new sounds from Zimbabwe and around the world.
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={playMix}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition hover:brightness-110"
                  >
                    {isMixPlaying ? (
                      <Pause className="h-4 w-4" fill="currentColor" />
                    ) : (
                      <Play className="h-4 w-4" fill="currentColor" />
                    )}
                    {isMixPlaying ? "Pause Mix" : "Play Mix"}
                  </button>
                  <Link
                    to="/search"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
                  >
                    Explore
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Continue Listening */}
          <RowHeader title="Continue Listening" />
          <div className="px-8">
            <div className="grid grid-cols-6 gap-4">
              {continueListening.slice(0, 6).map((t) => {
                const isCurrent = current?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => (isCurrent ? toggle() : play(t, continueListening))}
                    className="group text-left"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-2xl shadow-card">
                      <img src={t.cover} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                      <span
                        className={`absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition ${
                          isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="h-4 w-4" fill="currentColor" />
                        ) : (
                          <Play className="h-4 w-4" fill="currentColor" />
                        )}
                      </span>
                    </div>
                    <div className={`mt-2 truncate text-sm font-bold ${isCurrent ? "text-primary" : ""}`}>{t.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{t.artist}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trending in Zimbabwe — playlist cards */}
          <RowHeader title="Trending in Zimbabwe" />
          <div className="px-8">
            <div className="grid grid-cols-6 gap-4">
              {trendingPlaylists.map((p, i) => {
                const song = trendingRow[i] ?? trendingRow[0];
                return (
                  <button
                    key={p.name}
                    onClick={() => song && play(song, trendingRow)}
                    className="group text-left"
                  >
                    <div className={`relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br ${p.from} ${p.to} p-4 shadow-card`}>
                      <div className={`text-lg font-black uppercase leading-tight tracking-tight ${p.accent}`}>
                        {p.tag}
                      </div>
                      <span className="absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-glow transition group-hover:opacity-100">
                        <Play className="h-4 w-4" fill="currentColor" />
                      </span>
                    </div>
                    <div className="mt-2 truncate text-sm font-bold">{p.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.songs} songs</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Two-column: New Releases + Top Artists */}
          <div className="grid grid-cols-2 gap-6 px-8 pt-10">
            <div>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-lg font-black">New Releases</h2>
                <button className="text-xs font-semibold text-primary hover:brightness-125">See All</button>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {newReleasesList.slice(0, 5).map((t) => {
                  const isCurrent = current?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => (isCurrent ? toggle() : play(t, newReleasesList))}
                      className="group text-left"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-xl shadow-card">
                        <img src={t.cover} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                        <span className="absolute bottom-1.5 right-1.5 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-glow transition group-hover:opacity-100">
                          <Play className="h-3.5 w-3.5" fill="currentColor" />
                        </span>
                      </div>
                      <div className={`mt-2 truncate text-xs font-bold ${isCurrent ? "text-primary" : ""}`}>{t.title}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{t.artist}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-lg font-black">Top Artists</h2>
                <button className="text-xs font-semibold text-primary hover:brightness-125">See All</button>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {topArtists.map((a, i) => (
                  <Link
                    key={a.id}
                    to="/artist/$id"
                    params={{ id: a.id }}
                    className="group text-center"
                  >
                    <div className="relative mx-auto aspect-square overflow-hidden rounded-full shadow-card ring-2 ring-border transition group-hover:ring-primary">
                      <img src={a.cover} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                    </div>
                    <div className="mt-2 truncate text-xs font-bold">{a.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{(120 - i * 15)}K listeners</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="h-24" />
        </div>

        {/* -------- Right rail -------- */}
        <aside className="sticky top-0 hidden h-screen shrink-0 overflow-y-auto border-l border-border/40 bg-black/20 px-5 py-4 lg:block">
          {/* Profile chip */}
          <div className="mb-5 flex items-center justify-between rounded-full bg-surface/70 px-2 py-1.5 ring-1 ring-border">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-xs font-black text-primary-foreground">
                {(profile?.display_name ?? "B").slice(0, 1).toUpperCase()}
              </div>
              <span className="truncate text-sm font-bold">{profile?.display_name ?? "Friend"}</span>
            </div>
            <ChevronDown className="mr-1 h-4 w-4 text-muted-foreground" />
          </div>

          {/* Recent Activity */}
          <div className="mb-6">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-sm font-black">Recent Activity</h3>
              <button className="text-[11px] font-semibold text-primary hover:brightness-125">See All</button>
            </div>
            <ul className="space-y-3">
              {current && (
                <li className="flex items-start gap-3 rounded-xl bg-primary/10 p-2 ring-1 ring-primary/30">
                  <img
                    src={current.cover}
                    alt=""
                    className={`h-9 w-9 shrink-0 rounded-lg object-cover ${isPlaying ? "animate-pulse" : ""}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary">
                      {isPlaying ? "Now Playing" : "Paused"}
                    </div>
                    <div className="truncate text-[12px] font-bold">{current.title}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{current.artist}</div>
                  </div>
                  <EqBars active={isPlaying} />
                </li>
              )}
              {recentActivity.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${a.tint}`}>
                    {a.kind === "like" ? <Heart className="h-3.5 w-3.5" fill="currentColor" /> :
                     a.kind === "add" ? <ListPlus className="h-3.5 w-3.5" /> :
                     a.kind === "release" ? <Disc className="h-3.5 w-3.5" /> :
                     a.kind === "upload" ? <Radio className="h-3.5 w-3.5" /> :
                     <Heart className="h-3.5 w-3.5" fill="currentColor" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-muted-foreground">
                      {a.who} <span className="font-semibold text-foreground">{a.title}</span>
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">{a.sub}</div>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{a.time}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Friend Activity */}
          <div>
            <h3 className="mb-3 text-sm font-black">Friend Activity</h3>
            <ul className="space-y-3">
              {friendActivity.map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-primary/10 text-xs font-black text-primary">
                    {f.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold">{f.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      Listening to <span className="text-foreground/80">{f.track}</span>
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">by {f.artist}</div>
                  </div>
                  <EqBars />
                </li>
              ))}
            </ul>
            <button className="mt-4 w-full rounded-full bg-surface py-2 text-xs font-bold ring-1 ring-border transition hover:bg-surface/80">
              Find Friends
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RowHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 mt-10 flex items-baseline justify-between px-8">
      <h2 className="text-lg font-black">{title}</h2>
      <button className="text-xs font-semibold text-primary hover:brightness-125">See All</button>
    </div>
  );
}

function NavArrow({ dir }: { dir: "left" | "right" }) {
  const Icon = dir === "left" ? ArrowLeft : ArrowRight;
  return (
    <button
      className="grid h-8 w-8 place-items-center rounded-full bg-surface/70 text-muted-foreground ring-1 ring-border transition hover:text-foreground"
      aria-label={dir === "left" ? "Back" : "Forward"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function EqBars() {
  return (
    <div className="flex items-end gap-0.5">
      {[0.6, 1, 0.5, 0.9].map((h, i) => (
        <span
          key={i}
          className="w-0.5 rounded-full bg-primary"
          style={{ height: `${h * 12}px`, animation: `pulse 1.2s ${i * 0.15}s ease-in-out infinite` }}
        />
      ))}
    </div>
  );
}

function Disc({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="12" cy="12" r="10" fillOpacity="0.4" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function greetingByHour() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

