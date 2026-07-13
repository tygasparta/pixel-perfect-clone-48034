import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Play, Pause, Heart, ListMusic, ListPlus, ListStart, Plus, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { usePlayer } from "@/lib/player";
import { getLikedIds, toggleLike } from "@/lib/recommendations.functions";
import { addTrackToPlaylist, listMyPlaylists } from "@/lib/library.functions";
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isDbTrackId } from "@/lib/track-mapper";
import type { Track } from "@/lib/mock-data";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function TrackDetailModal({
  track,
  queue,
  onOpenChange,
}: {
  track: Track | null;
  queue: Track[];
  onOpenChange: (open: boolean) => void;
}) {
  const { current, isPlaying, play, toggle, playNext, addToQueue } = usePlayer();
  const queryClient = useQueryClient();
  const doToggleLike = useServerFn(toggleLike);
  const fetchLiked = useServerFn(getLikedIds);

  const likedQ = useQuery({
    queryKey: ["likes", "ids"],
    queryFn: () => fetchLiked(),
    staleTime: 30_000,
  });
  const likedIds = new Set(likedQ.data ?? []);

  const likeMut = useMutation({
    mutationFn: (trackId: string) => doToggleLike({ data: { trackId } }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["likes"] });
      toast.success(res.liked ? "Added to your Liked Songs" : "Removed from Liked Songs");
    },
    onError: () => toast.error("Couldn't update like"),
  });

  const open = track !== null;
  const isCurrent = track && current?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;
  const liked = track ? likedIds.has(track.id) : false;
  const canLike = track && isDbTrackId(track.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border-border bg-surface p-0">
        {track && (
          <div>
            <div className="relative h-56 w-full overflow-hidden">
              <img src={track.cover} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="text-xl font-black leading-tight">{track.title}</div>
                <Link
                  to="/artist/$id"
                  params={{ id: track.artistId }}
                  onClick={() => onOpenChange(false)}
                  className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <User className="h-3.5 w-3.5" />
                  {track.artist}
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between px-5 pt-4 text-xs text-muted-foreground">
              <span>{track.plays ? `${track.plays} plays` : "New"}</span>
              <span>{track.duration ? fmt(track.duration) : ""}</span>
            </div>

            <div className="flex items-center gap-2 px-5 pb-5 pt-4">
              <button
                onClick={() => (isCurrent ? toggle() : play(track, queue.length > 0 ? queue : [track]))}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-glow transition hover:brightness-110"
              >
                {isThisPlaying ? (
                  <>
                    <Pause className="h-4 w-4" fill="currentColor" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" fill="currentColor" />
                    {isCurrent ? "Resume" : "Play"}
                  </>
                )}
              </button>
              <button
                onClick={() => canLike && likeMut.mutate(track.id)}
                disabled={!canLike || likeMut.isPending}
                title={canLike ? "Like" : "Sign in required"}
                className={`grid h-11 w-11 place-items-center rounded-full ring-1 ring-border transition hover:bg-surface disabled:opacity-40 ${liked ? "text-primary" : ""}`}
              >
                <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="border-t border-border">
              <ActionRow
                icon={<ListStart className="h-4 w-4" />}
                label="Play next"
                onClick={() => {
                  playNext(track);
                  toast.success(`"${track.title}" plays next`);
                  onOpenChange(false);
                }}
              />
              <ActionRow
                icon={<ListPlus className="h-4 w-4" />}
                label="Add to queue"
                onClick={() => {
                  addToQueue(track);
                  toast.success(`Added "${track.title}" to queue`);
                  onOpenChange(false);
                }}
              />
              <Link
                to="/artist/$id"
                params={{ id: track.artistId }}
                onClick={() => onOpenChange(false)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-sm font-medium transition hover:bg-white/5"
              >
                <User className="h-4 w-4" />
                Go to artist
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ActionRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border px-5 py-3.5 text-sm font-medium transition hover:bg-white/5"
    >
      {icon}
      {label}
    </button>
  );
}
