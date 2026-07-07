import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown, Download, Heart, ListMusic, MessageSquare, MoreHorizontal,
  Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Sliders, Share2, X,
} from "lucide-react";
import { useState } from "react";
import { usePlayer } from "@/lib/player";
import { fmt } from "@/lib/mock-data";
import { TrackRow } from "@/components/track-row";

export const Route = createFileRoute("/_authenticated/player")({
  component: PlayerPage,
});

function PlayerPage() {
  const navigate = useNavigate();
  const { current, isPlaying, toggle, next, prev, seek, progress, currentTime, duration, queue } = usePlayer();
  const [showLyrics, setShowLyrics] = useState(false);
  const [liked, setLiked] = useState(false);

  if (!current) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div>
          <p className="text-lg font-semibold">Nothing is playing</p>
          <button
            onClick={() => navigate({ to: "/home" })}
            className="mt-4 rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Discover music
          </button>
        </div>
      </div>
    );
  }

  const upNext = queue.filter((t) => t.id !== current.id).slice(0, 8);

  const controls = (
    <>
      <div className="mt-6">
        <button
          className="relative block h-8 w-full"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek((e.clientX - r.left) / r.width);
          }}
        >
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-end gap-[3px]">
            {Array.from({ length: 60 }).map((_, i) => {
              const h = 30 + Math.sin(i * 0.7) * 40 + (i % 3) * 12;
              const active = i / 60 < progress;
              return (
                <span
                  key={i}
                  className={`w-[3px] rounded-full ${active ? "bg-primary" : "bg-white/15"}`}
                  style={{ height: `${Math.min(90, Math.abs(h))}%` }}
                />
              );
            })}
          </div>
        </button>
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration || current.duration)}</span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:text-foreground">
          <Shuffle className="h-5 w-5" />
        </button>
        <button onClick={prev} className="grid h-12 w-12 place-items-center">
          <SkipBack className="h-7 w-7" fill="currentColor" />
        </button>
        <button
          onClick={toggle}
          className="grid h-16 w-16 place-items-center rounded-full bg-white text-black shadow-glow"
        >
          {isPlaying ? <Pause className="h-7 w-7" fill="currentColor" /> : <Play className="h-7 w-7 pl-0.5" fill="currentColor" />}
        </button>
        <button onClick={next} className="grid h-12 w-12 place-items-center">
          <SkipForward className="h-7 w-7" fill="currentColor" />
        </button>
        <button className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:text-foreground">
          <Repeat className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <IconChip><Heart className="h-4 w-4" /></IconChip>
        <IconChip><Download className="h-4 w-4" /></IconChip>
        <IconChip onClick={() => setShowLyrics((v) => !v)}><MessageSquare className="h-4 w-4" /></IconChip>
        <IconChip><Sliders className="h-4 w-4" /></IconChip>
        <IconChip><Share2 className="h-4 w-4" /></IconChip>
      </div>
    </>
  );

  return (
    <div className="relative min-h-screen bg-background bg-gradient-hero">
      {/* Mobile: single column */}
      <div className="mx-auto flex min-h-screen max-w-[520px] flex-col px-5 pb-6 pt-14 md:hidden">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate({ to: "/home" })} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/5">
            <ChevronDown className="h-6 w-6" />
          </button>
          <div className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Playing from<br />
            <span className="text-sm text-foreground">Top Songs Zimbabwe</span>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/5">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl shadow-glow">
          <img src={current.cover} alt="" className="h-full w-full object-cover" />
        </div>

        <div className="mt-8 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{current.title}</h1>
            <p className="truncate text-sm text-muted-foreground">{current.artist}</p>
          </div>
          <button
            onClick={() => setLiked(!liked)}
            className={`grid h-10 w-10 place-items-center rounded-full transition ${liked ? "text-primary" : "text-muted-foreground"}`}
          >
            <Heart className="h-5 w-5" fill={liked ? "currentColor" : "none"} />
          </button>
        </div>

        {controls}

        {showLyrics && (
          <div className="mt-6 rounded-2xl bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold">LYRICS</span>
              <button onClick={() => setShowLyrics(false)}><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground">Lyrics coming soon…</p>
          </div>
        )}
      </div>

      {/* Desktop: split-screen with cover / meta+controls / queue */}
      <div className="hidden md:block">
        <button
          onClick={() => navigate({ to: "/home" })}
          className="absolute right-6 top-6 z-10 grid h-10 w-10 place-items-center rounded-full bg-surface-2/70 backdrop-blur hover:bg-surface-2"
          aria-label="Close player"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px] gap-10 px-10 py-10">
          {/* Cover */}
          <div className="flex items-center justify-center">
            <div className="relative aspect-square w-full max-w-[560px] overflow-hidden rounded-[32px] shadow-glow">
              <img src={current.cover} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent" />
            </div>
          </div>

          {/* Meta + controls */}
          <div className="flex flex-col justify-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Now playing</div>
            <h1 className="mt-3 text-5xl font-black leading-tight">{current.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{current.artist}</p>

            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={() => setLiked(!liked)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-border transition ${
                  liked ? "bg-primary/15 text-primary" : "bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
                {liked ? "Liked" : "Add to library"}
              </button>
              <button className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-muted-foreground ring-1 ring-border hover:text-foreground">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>

            {controls}

            {showLyrics && (
              <div className="mt-8 rounded-2xl bg-surface/60 p-5 ring-1 ring-border">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-widest text-muted-foreground">LYRICS</span>
                  <button onClick={() => setShowLyrics(false)}><X className="h-4 w-4" /></button>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">Lyrics coming soon…</p>
              </div>
            )}
          </div>

          {/* Queue */}
          <aside className="flex flex-col rounded-2xl bg-surface/50 p-4 ring-1 ring-border">
            <div className="mb-3 flex items-center gap-2 px-2">
              <ListMusic className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Up next</span>
              <span className="ml-auto text-[11px] text-muted-foreground">{upNext.length}</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {upNext.length === 0 ? (
                <p className="px-2 text-xs text-muted-foreground">Queue is empty.</p>
              ) : (
                <div className="space-y-0.5">
                  {upNext.map((t) => (
                    <TrackRow key={t.id} track={t} queue={queue} />
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function IconChip({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-foreground/80 shadow-card ring-1 ring-border transition hover:text-foreground"
    >
      {children}
    </button>
  );
}
