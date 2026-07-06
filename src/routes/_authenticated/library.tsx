import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Heart, ListMusic, Music2, Plus, Podcast, Search as SearchIcon } from "lucide-react";
import { TrackRow } from "@/components/track-row";
import { demoTracks, fmt } from "@/lib/mock-data";
import { usePlayer } from "@/lib/player";

export const Route = createFileRoute("/_authenticated/library")({
  component: LibraryPage,
});

const tabs = ["All", "Playlists", "Albums", "Songs", "Podcasts"] as const;

function LibraryPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const { play } = usePlayer();

  const collections = [
    { icon: Heart, name: "Liked Songs", meta: "312 songs", tint: "from-primary to-primary-glow" },
    { icon: ListMusic, name: "My Playlist", meta: "45 songs", tint: "from-indigo-500 to-purple-700" },
    { icon: Music2, name: "Zim Hits", meta: "80 songs", tint: "from-rose-500 to-red-700" },
    { icon: ListMusic, name: "Chill Vibes", meta: "60 songs", tint: "from-cyan-500 to-blue-700" },
    { icon: Download, name: "Downloaded Music", meta: "120 songs", tint: "from-emerald-500 to-teal-700" },
    { icon: Podcast, name: "Podcasts", meta: "15 episodes", tint: "from-amber-500 to-orange-700" },
  ];

  const header = (
    <>
      <div className="mb-4 flex items-center justify-between lg:mb-6">
        <div>
          <h1 className="text-2xl font-bold lg:text-4xl lg:font-black">Your Library</h1>
          <p className="hidden text-sm text-muted-foreground lg:mt-1 lg:block">
            {collections.length} collections · {demoTracks.length} tracks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold ring-1 ring-border hover:bg-surface-2 lg:inline-flex">
            <Plus className="h-3.5 w-3.5" /> New playlist
          </button>
          <SearchIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <div className="scrollbar-none -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 lg:-mx-0 lg:px-0">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground ring-1 ring-border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="px-5 pt-14 lg:px-10 lg:pt-8">
      {header}

      {/* Mobile / tablet stacked */}
      <div className="lg:hidden">
        <div className="space-y-2">
          {collections.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.name}
                onClick={() => play(demoTracks[0], demoTracks)}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/5"
              >
                <div className={`grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br ${r.tint} shadow-card`}>
                  <Icon className="h-6 w-6 text-white" fill="currentColor" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.meta}</div>
                </div>
              </button>
            );
          })}
        </div>

        <h2 className="mb-3 mt-8 text-base font-bold">Recently played</h2>
        <div className="space-y-1">
          {demoTracks.slice(0, 6).map((t) => (
            <TrackRow key={t.id} track={t} queue={demoTracks} showDuration />
          ))}
        </div>
      </div>

      {/* Desktop grid + track table */}
      <div className="hidden lg:block">
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold">Collections</h2>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 2xl:grid-cols-5">
            {collections.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.name}
                  onClick={() => play(demoTracks[0], demoTracks)}
                  className="group flex flex-col gap-3 rounded-2xl bg-surface/60 p-4 text-left ring-1 ring-border transition hover:bg-surface-2 hover:shadow-card"
                >
                  <div className={`grid aspect-square w-full place-items-center rounded-xl bg-gradient-to-br ${r.tint} shadow-card`}>
                    <Icon className="h-10 w-10 text-white" fill="currentColor" />
                  </div>
                  <div>
                    <div className="truncate text-sm font-bold">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.meta}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Recently played</h2>
            <span className="text-xs text-muted-foreground">{demoTracks.length} tracks</span>
          </div>
          <div className="overflow-hidden rounded-2xl bg-surface/40 ring-1 ring-border">
            <div className="grid grid-cols-[32px_minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)_80px] items-center gap-4 border-b border-border/60 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>#</span><span>Title</span><span>Artist</span><span>Album</span><span className="text-right">Time</span>
            </div>
            <ul>
              {demoTracks.map((t, i) => (
                <li key={t.id}>
                  <button
                    onClick={() => play(t, demoTracks)}
                    className="grid w-full grid-cols-[32px_minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)_80px] items-center gap-4 px-4 py-2.5 text-left transition hover:bg-white/5"
                  >
                    <span className="text-xs text-muted-foreground">{i + 1}</span>
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={t.cover} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <span className="truncate text-sm font-semibold">{t.title}</span>
                    </div>
                    <span className="truncate text-sm text-muted-foreground">{t.artist}</span>
                    <span className="truncate text-sm text-muted-foreground">{t.album ?? "—"}</span>
                    <span className="text-right text-xs text-muted-foreground">{fmt(t.duration)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
