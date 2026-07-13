import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, MessageSquare, MoreHorizontal, Play, Shuffle, Check } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { demoTracks } from "@/lib/mock-data";
import { TrackRow } from "@/components/track-row";
import { usePlayer } from "@/lib/player";
import { getFollowedArtists, toggleFollowArtist } from "@/lib/library.functions";

export const Route = createFileRoute("/_authenticated/artist/$id")({
  component: ArtistPage,
});

function ArtistPage() {
  const { id } = Route.useParams();
  const tracks = demoTracks.filter((t) => t.artistId === id);
  const shown = tracks.length ? tracks : demoTracks.slice(0, 5);
  const artist = shown[0];
  const { play } = usePlayer();
  const queryClient = useQueryClient();

  const fetchFollowed = useServerFn(getFollowedArtists);
  const doToggleFollow = useServerFn(toggleFollowArtist);
  const FOLLOWED_KEY = ["library", "artists"] as const;
  const followedQ = useQuery({
    queryKey: FOLLOWED_KEY,
    queryFn: () => fetchFollowed(),
    staleTime: 30_000,
  });
  type Followed = NonNullable<typeof followedQ.data>;
  const isFollowing = (followedQ.data ?? []).some((a) => a.id === id);
  const followMut = useMutation({
    mutationFn: () => doToggleFollow({ data: { artistId: id } }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: FOLLOWED_KEY });
      const prev = queryClient.getQueryData<Followed>(FOLLOWED_KEY);
      const currentlyFollowing = (prev ?? []).some((a) => a.id === id);
      if (currentlyFollowing) {
        queryClient.setQueryData<Followed>(FOLLOWED_KEY, (old) => (old ?? []).filter((a) => a.id !== id));
      } else {
        const optimistic: Followed[number] = {
          id,
          name: artist.artist,
          avatar_url: artist.cover ?? null,
          monthly_listeners: 0,
          is_verified: false,
        };
        queryClient.setQueryData<Followed>(FOLLOWED_KEY, (old) => [optimistic, ...(old ?? [])]);
      }
      return { prev, wasFollowing: currentlyFollowing };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(FOLLOWED_KEY, ctx.prev);
      toast.error("Couldn't update follow");
    },
    onSuccess: (res) => {
      toast.success(res.following ? `Following ${artist.artist}` : `Unfollowed ${artist.artist}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });

  return (
    <div className="pb-6">
      <div className="relative h-80">
        <img src={artist.cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background" />
        <div className="absolute inset-x-0 top-14 flex items-center justify-between px-5">
          <Link to="/search" className="grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <button className="grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur">
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute inset-x-5 bottom-6">
          <h1 className="flex items-center gap-2 text-3xl font-black">
            {artist.artist}
            <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">✓</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">257K monthly listeners</p>
        </div>
      </div>

      <div className="px-5">
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => followMut.mutate()}
            disabled={followMut.isPending}
            className={
              isFollowing
                ? "flex items-center gap-1.5 rounded-full border border-border px-5 py-2 text-sm font-semibold"
                : "rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
            }
          >
            {isFollowing ? (
              <>
                <Check className="h-4 w-4" /> Following
              </>
            ) : (
              "Follow"
            )}
          </button>
          <button className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground">
            <MoreHorizontal className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground">
            <Shuffle className="h-5 w-5" />
          </button>
          <button
            onClick={() => play(shown[0], shown)}
            className="grid h-14 w-14 place-items-center rounded-full bg-gradient-primary shadow-glow"
          >
            <Play className="h-6 w-6 pl-0.5" fill="currentColor" />
          </button>
        </div>

        <h2 className="mb-2 text-base font-bold">Popular</h2>
        <div className="space-y-1">
          {shown.map((t, i) => (
            <TrackRow key={t.id} track={t} queue={shown} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
