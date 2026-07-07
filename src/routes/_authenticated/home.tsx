import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ChevronRight, Play, Search, TrendingUp, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrackRow } from "@/components/track-row";
import { RecommendedForYou } from "@/components/recommended-for-you";
import { demoTracks, madeForYou, genres } from "@/lib/mock-data";
import { usePlayer } from "@/lib/player";

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
  const { play } = usePlayer();
  const greeting = greetingByHour();
  const quickPicks = demoTracks.slice(0, 6);
  const trending = demoTracks.slice(0, 5);
  const newReleases = demoTracks.slice(3, 9);
  const recent = demoTracks.slice(6);

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
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search songs, artists, albums…"
              className="h-11 w-full rounded-full bg-surface/80 pl-11 pr-4 text-sm outline-none ring-1 ring-border focus:ring-primary/60"
            />
          </div>
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
            <button
              key={t.id}
              onClick={() => play(t, quickPicks)}
              className="group flex items-center gap-3 overflow-hidden rounded-xl bg-surface/70 pr-4 ring-1 ring-border transition hover:bg-surface"
            >
              <img src={t.cover} alt="" className="h-16 w-16 shrink-0 object-cover" />
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-bold">{t.title}</div>
                <div className="truncate text-[11px] text-muted-foreground">{t.artist}</div>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-glow transition group-hover:opacity-100">
                <Play className="h-4 w-4" fill="currentColor" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Made for you (recommendation carousel) */}
      <DesktopRow title="Made for you" icon={<Sparkles className="h-4 w-4 text-primary" />}>
        <RecommendedForYou limit={10} />
      </DesktopRow>

      {/* Trending row */}
      <DesktopRow title="Trending in Zimbabwe" icon={<TrendingUp className="h-4 w-4 text-primary" />}>
        <div className="grid grid-cols-5 gap-4">
          {trending.map((t) => (
            <button key={t.id} onClick={() => play(t, trending)} className="group text-left">
              <div className="relative aspect-square overflow-hidden rounded-2xl shadow-card">
                <img src={t.cover} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                <span className="absolute bottom-2 right-2 grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-glow transition group-hover:opacity-100">
                  <Play className="h-4 w-4" fill="currentColor" />
                </span>
              </div>
              <div className="mt-3 truncate text-sm font-bold">{t.title}</div>
              <div className="truncate text-xs text-muted-foreground">{t.artist}</div>
            </button>
          ))}
        </div>
      </DesktopRow>

      {/* New releases */}
      <DesktopRow title="New releases">
        <div className="grid grid-cols-6 gap-4">
          {newReleases.map((t) => (
            <button key={t.id} onClick={() => play(t, newReleases)} className="group text-left">
              <div className="relative aspect-square overflow-hidden rounded-2xl shadow-card">
                <img src={t.cover} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                <span className="absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-glow transition group-hover:opacity-100">
                  <Play className="h-4 w-4" fill="currentColor" />
                </span>
              </div>
              <div className="mt-2 truncate text-[13px] font-semibold">{t.title}</div>
              <div className="truncate text-[11px] text-muted-foreground">{t.artist}</div>
            </button>
          ))}
        </div>
      </DesktopRow>

      {/* Genres + Recent listening */}
      <section className="grid grid-cols-3 gap-6 px-10 pt-2">
        <div className="col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-black">Recently played</h2>
            <button className="text-xs font-semibold text-muted-foreground hover:text-foreground">See all</button>
          </div>
          <div className="rounded-2xl bg-surface/60 p-2 ring-1 ring-border">
            {recent.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5">
                <span className="w-5 text-center text-sm text-muted-foreground">{i + 1}</span>
                <TrackRow track={t} queue={recent} showDuration />
              </div>
            ))}
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
