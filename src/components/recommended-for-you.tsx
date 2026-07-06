import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart, Play, Sparkles } from "lucide-react";
import { getRecommendations, getLikedIds, toggleLike } from "@/lib/recommendations.functions";
import { dbTrackToTrack } from "@/lib/track-mapper";
import { usePlayer } from "@/lib/player";

export function RecommendedForYou({ limit = 10, variant = "cards" }: { limit?: number; variant?: "cards" | "list" }) {
  const fetchRecs = useServerFn(getRecommendations);
  const fetchLiked = useServerFn(getLikedIds);
  const doToggle = useServerFn(toggleLike);
  const qc = useQueryClient();
  const { play, current, isPlaying, toggle } = usePlayer();

  const recsQ = useQuery({
    queryKey: ["recs", limit],
    queryFn: () => fetchRecs({ data: { limit } }),
    staleTime: 60_000,
  });
  const likedQ = useQuery({ queryKey: ["liked-ids"], queryFn: () => fetchLiked(), staleTime: 60_000 });
  const likeMut = useMutation({
    mutationFn: (trackId: string) => doToggle({ data: { trackId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["liked-ids"] });
      qc.invalidateQueries({ queryKey: ["recs"] });
    },
  });

  const recs = recsQ.data ?? [];
  const liked = new Set(likedQ.data ?? []);
  const queue = recs.map(dbTrackToTrack);

  if (recsQ.isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 w-32 shrink-0 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
    );
  }
  if (recs.length === 0) {
    return <p className="text-xs text-muted-foreground">Play or like a few tracks and we'll tune your recommendations.</p>;
  }

  if (variant === "list") {
    return (
      <div className="space-y-1">
        {recs.map((r, i) => {
          const t = queue[i];
          const isCurrent = current?.id === t.id;
          return (
            <div key={r.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
              <button
                onClick={() => (isCurrent ? toggle() : play(t, queue))}
                className="relative shrink-0"
                aria-label={`Play ${t.title}`}
              >
                <img src={t.cover} alt="" className="h-11 w-11 rounded-lg object-cover" />
                <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <Play className="h-4 w-4" fill="currentColor" />
                </span>
              </button>
              <button
                onClick={() => (isCurrent ? toggle() : play(t, queue))}
                className="min-w-0 flex-1 text-left"
              >
                <div className={`truncate text-sm font-semibold ${isCurrent && isPlaying ? "text-primary" : ""}`}>
                  {t.title}
                </div>
                <Link
                  to="/artist/$id"
                  params={{ id: r.artist_id }}
                  onClick={(e) => e.stopPropagation()}
                  className="truncate text-xs text-muted-foreground hover:text-foreground"
                >
                  {r.artist_name} · {r.reason}
                </Link>
              </button>
              <button
                onClick={() => likeMut.mutate(r.id)}
                aria-label={liked.has(r.id) ? "Unlike" : "Like"}
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-primary"
              >
                <Heart
                  className="h-4 w-4"
                  fill={liked.has(r.id) ? "currentColor" : "none"}
                  color={liked.has(r.id) ? "hsl(var(--primary))" : undefined}
                />
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
      {recs.map((r, i) => {
        const t = queue[i];
        return (
          <div key={r.id} className="w-36 shrink-0 snap-start">
            <button onClick={() => play(t, queue)} className="group relative block w-full">
              <div className="relative aspect-square overflow-hidden rounded-2xl shadow-card">
                <img src={t.cover} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  <Sparkles className="h-2.5 w-2.5" /> For you
                </span>
                <span className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition group-hover:opacity-100">
                  <Play className="h-4 w-4" fill="currentColor" />
                </span>
              </div>
            </button>
            <div className="mt-2 truncate text-[13px] font-semibold">{t.title}</div>
            <div className="truncate text-[11px] text-muted-foreground">{r.reason}</div>
          </div>
        );
      })}
    </div>
  );
}
