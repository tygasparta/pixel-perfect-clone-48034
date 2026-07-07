import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, Play, TrendingUp, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { TrackRow } from "@/components/track-row";
import { RecommendedForYou } from "@/components/recommended-for-you";
import { SearchCommand } from "@/components/search-command";
import { demoTracks, madeForYou, genres, type Track } from "@/lib/mock-data";
import { usePlayer } from "@/lib/player";
import { getTrendingTracks, getNewReleases, getRecentlyPlayed } from "@/lib/catalog.functions";
import { dbTrackToTrack } from "@/lib/track-mapper";

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

/* ------------------------------ MOBILE ------------------------------ */
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
function DesktopHome() {
  const { data: profile } = useProfile();
  const greeting = greetingByHour();

  const fetchTrending = useServerFn(getTrendingTracks);
  const fetchNewReleases = useServerFn(getNewReleases);
  const fetchRecent = useServerFn(getRecentlyPlayed);
  const { current } = usePlayer();

  const trendingQ = useQuery({
    queryKey: ["catalog", "trending", 10],
    queryFn: () => fetchTrending({ data: { limit: 10 } }),
    staleTime: 60_000,
  });
  const newReleasesQ = useQuery({
    queryKey: ["catalog", "new-releases", 12],
    queryFn: () => fetchNewReleases({ data: { limit: 12 } }),
    staleTime: 60_000,
  });
  const recentQ = useQuery({
    queryKey: ["catalog", "recently-played", 8, current?.id ?? null],
    queryFn: () => fetchRecent({ data: { limit: 8 } }),
    staleTime: 15_000,
  });

  const trending = (trendingQ.data ?? []).map(dbTrackToTrack);
  const newReleases = (newReleasesQ.data ?? []).map(dbTrackToTrack);
  const recent = (recentQ.data ?? []).map(dbTrackToTrack);
  const quickPicks = trending.slice(0, 6);

  return (
    <div className="hidden md:block">
      {/* Ambient gradient header */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-72 -z-10"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.635 0.22 26 / 0.35) 0%, oklch(0.72 0.20 30 / 0.15) 40%, transparent 100%)",
          }}
        />
        <div className="flex items-center justify-between gap-4 px-10 pt-8">
          <div className="flex items-center gap-2">
            <NavArrow dir="left" />
            <NavArrow dir="right" />
          </div>
          <SearchCommand className="flex-1 max-w-md" />
          <div className="flex items-center gap-3">
            <button className="relative grid h-10 w-10 place-items-center rounded-full bg-surface ring-1 ring-border">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
            </button>
            <Link
              to="/profile"
              className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-sm font-black text-primary-foreground shadow-glow"
            >
              {(profile?.display_name ?? "B").slice(0, 1).toUpperCase()}
            </Link>
          </div>
        </div>

        <div className="px-10 pt-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{greeting}</p>
          <h1 className="mt-1 text-4xl font-black leading-tight">
            Welcome back, {profile?.display_name ?? "friend"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fresh drops from Zimbabwe and picks tuned to your taste.
          </p>
        </div>
      </div>

      {/* Quick picks - 3x2 grid of horizontal tiles */}
      <section className="px-10 pt-8">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {quickPicks.map((t) => (
            <QuickPickTile key={t.id} track={t} queue={quickPicks} />
          ))}
        </div>
      </section>

      {/* Made for you (recommendation carousel) */}
      <DesktopRow title="Made for you" icon={<Sparkles className="h-4 w-4 text-primary" />}>
        <RecommendedForYou limit={10} />
      </DesktopRow>

      {/* Trending row */}
      <DesktopRow title="Trending in Zimbabwe" icon={<TrendingUp className="h-4 w-4 text-primary" />}>
        <CoverGrid
          tracks={trending}
          cols={5}
          coverSize={44}
          loading={trendingQ.isLoading}
          empty="No trending tracks yet."
        />
      </DesktopRow>

      {/* New releases */}
      <DesktopRow title="New releases">
        <CoverGrid
          tracks={newReleases}
          cols={6}
          coverSize={40}
          loading={newReleasesQ.isLoading}
          empty="No new releases yet."
        />
      </DesktopRow>

      {/* Genres + Recent listening */}
      <section className="grid grid-cols-3 gap-6 px-10 pt-2">
        <div className="col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-black">Recently played</h2>
            <button className="text-xs font-semibold text-muted-foreground hover:text-foreground">See all</button>
          </div>
          <div className="rounded-2xl bg-surface/60 p-2 ring-1 ring-border">
            {trendingQ.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2">
                  <div className="h-11 w-11 animate-pulse rounded-lg bg-surface" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-surface" />
                    <div className="h-2.5 w-1/4 animate-pulse rounded bg-surface" />
                  </div>
                </div>
              ))
            ) : recent.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing here yet. Play a few tracks to see them show up.
              </div>
            ) : (
              recent.map((t, i) => (
                <TrackRow key={t.id} track={t} queue={recent} index={i} showDuration />
              ))
            )}
          </div>
        </div>
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-black">Browse genres</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {genres.map((g) => (
              <div
                key={g.name}
                className={`relative aspect-[5/3] overflow-hidden rounded-2xl bg-gradient-to-br p-3 shadow-card ${g.color}`}
              >
                <span className="text-sm font-black text-white">{g.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-16" />
    </div>
  );
}

function DesktopRow({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="px-10 pt-10">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="flex items-center gap-2 text-xl font-black">
          {icon}
          {title}
        </h2>
        <button className="text-xs font-semibold text-muted-foreground hover:text-foreground">See all</button>
      </div>
      {children}
    </section>
  );
}

function NavArrow({ dir }: { dir: "left" | "right" }) {
  return (
    <button
      className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white/80 ring-1 ring-border transition hover:text-white"
      aria-label={dir === "left" ? "Back" : "Forward"}
    >
      <ChevronRight className={`h-4 w-4 ${dir === "left" ? "rotate-180" : ""}`} />
    </button>
  );
}

function greetingByHour() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function QuickPickTile({ track, queue }: { track: import("@/lib/mock-data").Track; queue: import("@/lib/mock-data").Track[] }) {
  const { play, current, isPlaying, toggle } = usePlayer();
  const navigate = useNavigate();
  const isCurrent = current?.id === track.id;

  const openPlayer = () => {
    if (isCurrent) {
      toggle();
    } else {
      play(track, queue);
    }
    navigate({ to: "/player" });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openPlayer}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPlayer();
        }
      }}
      className="group flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl bg-surface/70 pr-3 ring-1 ring-border transition hover:bg-surface"
    >
      <img src={track.cover} alt="" className="h-16 w-16 shrink-0 object-cover" />
      <div className="min-w-0 flex-1 py-2 text-left">
        <div className={`truncate text-sm font-bold ${isCurrent ? "text-primary" : ""}`}>{track.title}</div>
        <Link
          to="/artist/$id"
          params={{ id: track.artistId }}
          onClick={(e) => e.stopPropagation()}
          className="truncate text-[11px] text-muted-foreground hover:text-foreground"
        >
          {track.artist}
        </Link>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isCurrent) toggle();
          else play(track, queue);
        }}
        aria-label={isCurrent && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition ${
          isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <Play className="h-4 w-4" fill="currentColor" />
      </button>
    </div>
  );
}

const COLS: Record<number, string> = {
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

function CoverGrid({
  tracks,
  cols,
  coverSize,
  loading,
  empty,
}: {
  tracks: Track[];
  cols: 3 | 4 | 5 | 6;
  coverSize: 40 | 44;
  loading?: boolean;
  empty: string;
}) {
  const { play, current, isPlaying, toggle } = usePlayer();
  const gridCls = `grid gap-4 ${COLS[cols]}`;
  const btnSize = coverSize === 44 ? "h-11 w-11" : "h-10 w-10";

  if (loading) {
    return (
      <div className={gridCls} aria-busy>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i}>
            <div className="aspect-square animate-pulse rounded-2xl bg-surface" />
            <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-surface" />
            <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-surface" />
          </div>
        ))}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="rounded-2xl bg-surface/60 px-6 py-10 text-center text-sm text-muted-foreground ring-1 ring-border">
        {empty}
      </div>
    );
  }

  return (
    <div className={gridCls}>
      {tracks.map((t) => {
        const isCurrent = current?.id === t.id;
        return (
          <div key={t.id} className="group text-left">
            <button
              onClick={() => (isCurrent ? toggle() : play(t, tracks))}
              className="relative block aspect-square w-full overflow-hidden rounded-2xl shadow-card"
              aria-label={isCurrent && isPlaying ? `Pause ${t.title}` : `Play ${t.title}`}
            >
              <img src={t.cover} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
              <span
                className={`absolute bottom-2 right-2 grid ${btnSize} place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition ${
                  isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <Play className={coverSize === 44 ? "h-4 w-4" : "h-3.5 w-3.5"} fill="currentColor" />
              </span>
            </button>
            <div className={`mt-3 truncate text-sm font-bold ${isCurrent ? "text-primary" : ""}`}>{t.title}</div>
            <Link
              to="/artist/$id"
              params={{ id: t.artistId }}
              className="block truncate text-xs text-muted-foreground hover:text-foreground"
            >
              {t.artist}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
