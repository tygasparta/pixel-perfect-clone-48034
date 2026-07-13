import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ChevronLeft,
  Clock,
  Disc3,
  Globe,
  Heart,
  ListMusic,
  Loader2,
  Lock,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Plus,
  Search as SearchIcon,
  Shuffle,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { usePlayer } from "@/lib/player";
import { dbTrackToTrack } from "@/lib/track-mapper";
import type { Track } from "@/lib/mock-data";
import { useInfiniteVisible } from "@/hooks/use-infinite-visible";
import {
  clearPlayHistory,
  deletePlaylist,
  getFollowedArtists,
  getLibraryCounts,
  getLikedTracks,
  getPlayHistory,
  getPlaylist,
  getYourAlbums,
  listMyPlaylists,
  removeTrackFromPlaylist,
  renamePlaylist,
} from "@/lib/library.functions";
import { toggleLike } from "@/lib/recommendations.functions";
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const tabs = ["Playlists", "Liked", "Artists", "Albums", "History"] as const;
type Tab = (typeof tabs)[number];

function InfiniteSentinel({
  sentinelRef,
  hasMore,
}: {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
}) {
  if (!hasMore) return null;
  return (
    <div ref={sentinelRef} className="flex items-center justify-center py-6">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/library")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: (typeof s.tab === "string" && (tabs as readonly string[]).includes(s.tab) ? (s.tab as Tab) : "Playlists") as Tab,
    playlist: typeof s.playlist === "string" ? (s.playlist as string) : undefined,
    q: typeof s.q === "string" ? (s.q as string) : "",
  }),
  component: LibraryPage,
});

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.round(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(iso).toLocaleDateString();
}

type LibrarySearch = { tab: Tab; playlist: string | undefined; q: string };

function LibraryPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/library" });
  const setTab = (t: Tab) =>
    navigate({ search: (prev: LibrarySearch) => ({ ...prev, tab: t, playlist: undefined }), replace: true });
  const setQuery = (q: string) =>
    navigate({ search: (prev: LibrarySearch) => ({ ...prev, q }), replace: true });
  const openPlaylist = (id: string) =>
    navigate({ search: (prev: LibrarySearch) => ({ ...prev, playlist: id }), replace: false });
  const closePlaylist = () =>
    navigate({ search: (prev: LibrarySearch) => ({ ...prev, playlist: undefined }), replace: false });

  return (
    <LibraryInner
      tab={search.tab}
      q={search.q}
      playlist={search.playlist}
      setTab={setTab}
      setQuery={setQuery}
      openPlaylist={openPlaylist}
      closePlaylist={closePlaylist}
    />
  );
}

function LibraryInner({
  tab,
  q,
  playlist,
  setTab,
  setQuery,
  openPlaylist,
  closePlaylist,
}: {
  tab: Tab;
  q: string;
  playlist: string | undefined;
  setTab: (t: Tab) => void;
  setQuery: (q: string) => void;
  openPlaylist: (id: string) => void;
  closePlaylist: () => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const fetchCounts = useServerFn(getLibraryCounts);
  const fetchPlaylists = useServerFn(listMyPlaylists);
  const fetchLiked = useServerFn(getLikedTracks);
  const fetchArtists = useServerFn(getFollowedArtists);
  const fetchAlbums = useServerFn(getYourAlbums);
  const fetchHistory = useServerFn(getPlayHistory);

  const countsQ = useQuery({ queryKey: ["library", "counts"], queryFn: () => fetchCounts(), staleTime: 15_000 });
  const playlistsQ = useQuery({ queryKey: ["library", "playlists"], queryFn: () => fetchPlaylists(), staleTime: 15_000 });
  const likedQ = useQuery({
    queryKey: ["library", "liked"],
    queryFn: () => fetchLiked(),
    enabled: tab === "Liked",
    staleTime: 15_000,
  });
  const artistsQ = useQuery({
    queryKey: ["library", "artists"],
    queryFn: () => fetchArtists(),
    enabled: tab === "Artists",
    staleTime: 15_000,
  });
  const albumsQ = useQuery({
    queryKey: ["library", "albums"],
    queryFn: () => fetchAlbums(),
    enabled: tab === "Albums",
    staleTime: 30_000,
  });
  const historyQ = useQuery({
    queryKey: ["library", "history"],
    queryFn: () => fetchHistory({ data: { limit: 100 } }),
    enabled: tab === "History",
    staleTime: 10_000,
  });

  const counts = countsQ.data;

  return (
    <div className="px-5 pt-14 md:px-10 md:pt-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <div>
          <h1 className="text-2xl font-bold md:text-4xl md:font-black">Your Library</h1>
          <p className="hidden text-sm text-muted-foreground md:mt-1 md:block">
            {counts
              ? `${counts.playlists} playlists · ${counts.liked} liked · ${counts.artists} artists`
              : "Everything you save, in one place"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow transition hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" /> New playlist
          </button>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="mb-4 flex flex-wrap items-center gap-2 md:mb-6">
        <div className="scrollbar-none -mx-5 flex flex-1 gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground ring-1 ring-border hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search in ${tab.toLowerCase()}…`}
            className="w-full rounded-full bg-surface py-2 pl-8 pr-8 text-xs outline-none ring-1 ring-border focus:ring-primary"
          />
          {q && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-white/5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Playlist detail overlay */}
      {playlist ? (
        <PlaylistDetailView playlistId={playlist} onClose={closePlaylist} />
      ) : (
        <>
          {tab === "Playlists" && (
            <PlaylistsGrid
              q={q}
              loading={playlistsQ.isLoading}
              playlists={playlistsQ.data ?? []}
              onOpen={openPlaylist}
              onNew={() => setCreateOpen(true)}
            />
          )}
          {tab === "Liked" && <LikedTab q={q} loading={likedQ.isLoading} tracks={likedQ.data ?? []} />}
          {tab === "Artists" && (
            <ArtistsTab q={q} loading={artistsQ.isLoading} artists={artistsQ.data ?? []} />
          )}
          {tab === "Albums" && <AlbumsTab q={q} loading={albumsQ.isLoading} albums={albumsQ.data ?? []} />}
          {tab === "History" && (
            <HistoryTab q={q} loading={historyQ.isLoading} entries={historyQ.data ?? []} />
          )}
        </>
      )}

      <CreatePlaylistDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => openPlaylist(id)}
      />
    </div>
  );
}

// ────────────────────────────────────────────────
// Playlists tab
// ────────────────────────────────────────────────
function PlaylistCover({
  cover_url,
  thumbs,
  name,
  className = "aspect-square w-full",
}: {
  cover_url: string | null;
  thumbs: string[];
  name: string;
  className?: string;
}) {
  if (cover_url) {
    return <img src={cover_url} alt="" className={`${className} rounded-xl object-cover shadow-card`} />;
  }
  if (thumbs.length >= 4) {
    return (
      <div className={`${className} grid grid-cols-2 overflow-hidden rounded-xl shadow-card`}>
        {thumbs.slice(0, 4).map((t, i) => (
          <img key={i} src={t} alt="" className="h-full w-full object-cover" />
        ))}
      </div>
    );
  }
  if (thumbs.length > 0) {
    return <img src={thumbs[0]} alt="" className={`${className} rounded-xl object-cover shadow-card`} />;
  }
  return (
    <div
      className={`${className} grid place-items-center rounded-xl bg-gradient-to-br from-primary/60 to-primary shadow-card`}
    >
      <ListMusic className="h-1/3 w-1/3 text-white/90" />
      <span className="sr-only">{name}</span>
    </div>
  );
}

function PlaylistsGrid({
  q,
  loading,
  playlists,
  onOpen,
  onNew,
}: {
  q: string;
  loading: boolean;
  playlists: Awaited<ReturnType<typeof listMyPlaylists>>;
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const filtered = useMemo(
    () => playlists.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())),
    [playlists, q],
  );
  const { visible, sentinelRef, hasMore } = useInfiniteVisible({
    total: filtered.length,
    pageSize: 24,
    resetKey: q,
  });
  const visiblePlaylists = filtered.slice(0, visible);

  if (loading) return <LoadingBlock />;
  if (playlists.length === 0)
    return (
      <EmptyState
        icon={<ListMusic className="h-6 w-6" />}
        title="No playlists yet"
        subtitle="Create your first playlist to organise your favourite songs."
        action={{ label: "New playlist", onClick: onNew }}
      />
    );

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {/* Create card */}
        <button
          onClick={onNew}
          className="group flex flex-col gap-3 rounded-2xl bg-surface/60 p-3 text-left ring-1 ring-dashed ring-border transition hover:bg-surface-2"
        >
          <div className="grid aspect-square w-full place-items-center rounded-xl bg-surface-2 text-muted-foreground group-hover:text-primary">
            <Plus className="h-8 w-8" />
          </div>
          <div>
            <div className="truncate text-sm font-bold">New playlist</div>
            <div className="text-xs text-muted-foreground">Start collecting tracks</div>
          </div>
        </button>

        {visiblePlaylists.map((p) => (
          <button
            key={p.id}
            onClick={() => onOpen(p.id)}
            className="group flex flex-col gap-3 rounded-2xl bg-surface/60 p-3 text-left ring-1 ring-border transition hover:bg-surface-2 hover:shadow-card"
          >
            <PlaylistCover cover_url={p.cover_url} thumbs={p.cover_thumbs} name={p.name} />
            <div>
              <div className="truncate text-sm font-bold">{p.name}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {p.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                <span>{p.track_count} tracks</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
    </>
  );
}

// ────────────────────────────────────────────────
// Liked tab
// ────────────────────────────────────────────────
function TrackList({
  tracks,
  queue,
  onRemove,
}: {
  tracks: Track[];
  queue: Track[];
  onRemove?: (t: Track) => void;
}) {
  const { current, isPlaying, play, toggle } = usePlayer();
  return (
    <ul className="overflow-hidden rounded-2xl bg-surface/40 ring-1 ring-border">
      {tracks.map((t, i) => {
        const isCurrent = current?.id === t.id;
        return (
          <li
            key={t.id}
            className="group grid grid-cols-[32px_minmax(0,3fr)_minmax(0,2fr)_64px_40px] items-center gap-3 border-b border-border/40 px-3 py-2 last:border-0 hover:bg-white/5"
          >
            <button
              onClick={() => (isCurrent ? toggle() : play(t, queue))}
              className={`grid h-8 w-8 place-items-center rounded-full text-xs transition ${
                isCurrent ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              }`}
              aria-label={isCurrent && isPlaying ? "Pause" : "Play"}
            >
              {isCurrent && isPlaying ? (
                <Pause className="h-3.5 w-3.5" fill="currentColor" />
              ) : (
                <Play className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" fill="currentColor" />
              )}
              <span className="absolute group-hover:hidden">{i + 1}</span>
            </button>
            <div className="flex min-w-0 items-center gap-3">
              <img src={t.cover} alt="" className="h-10 w-10 rounded-lg object-cover" />
              <div className="min-w-0">
                <div className={`truncate text-sm font-semibold ${isCurrent ? "text-primary" : ""}`}>{t.title}</div>
                <Link
                  to="/artist/$id"
                  params={{ id: t.artistId }}
                  className="truncate text-xs text-muted-foreground hover:text-foreground"
                >
                  {t.artist}
                </Link>
              </div>
            </div>
            <span className="hidden truncate text-sm text-muted-foreground md:inline">{t.album ?? "—"}</span>
            <span className="text-right text-xs text-muted-foreground">{fmt(t.duration)}</span>
            {onRemove ? (
              <button
                onClick={() => onRemove(t)}
                aria-label="Remove"
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-white/5 hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function LikedTab({ q, loading, tracks }: { q: string; loading: boolean; tracks: Awaited<ReturnType<typeof getLikedTracks>> }) {
  const queryClient = useQueryClient();
  const doUnlike = useServerFn(toggleLike);
  const unlikeMut = useMutation({
    mutationFn: (trackId: string) => doUnlike({ data: { trackId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["likes"] });
      toast.success("Removed from Liked Songs");
    },
    onError: () => toast.error("Couldn't remove"),
  });

  const filtered = useMemo(
    () =>
      tracks.filter((t) => {
        const s = q.trim().toLowerCase();
        return !s || t.title.toLowerCase().includes(s) || t.artist_name.toLowerCase().includes(s);
      }),
    [tracks, q],
  );
  const mapped = filtered.map(dbTrackToTrack);
  const { visible, sentinelRef, hasMore } = useInfiniteVisible({
    total: filtered.length,
    pageSize: 30,
    resetKey: q,
  });
  const visibleMapped = mapped.slice(0, visible);
  const { play } = usePlayer();

  if (loading) return <LoadingBlock />;
  if (tracks.length === 0)
    return (
      <EmptyState
        icon={<Heart className="h-6 w-6" />}
        title="No liked songs yet"
        subtitle="Tap the heart on any track to save it here."
      />
    );

  return (
    <div>
      <div className="mb-5 flex items-center gap-4 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-surface p-5 ring-1 ring-border">
        <div className="grid h-20 w-20 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-glow">
          <Heart className="h-10 w-10 text-white" fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Playlist</div>
          <h2 className="text-2xl font-black md:text-3xl">Liked Songs</h2>
          <p className="text-xs text-muted-foreground">{tracks.length} songs</p>
        </div>
        <button
          onClick={() => mapped.length && play(mapped[0], mapped)}
          className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow"
          aria-label="Play all"
        >
          <Play className="h-5 w-5" fill="currentColor" />
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No matches for "{q}".</div>
      ) : (
        <>
          <TrackList tracks={visibleMapped} queue={mapped} onRemove={(t) => unlikeMut.mutate(t.id)} />
          <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Artists tab
// ────────────────────────────────────────────────
function ArtistsTab({ q, loading, artists }: { q: string; loading: boolean; artists: Awaited<ReturnType<typeof getFollowedArtists>> }) {
  const filtered = useMemo(
    () => artists.filter((a) => a.name.toLowerCase().includes(q.trim().toLowerCase())),
    [artists, q],
  );
  const { visible, sentinelRef, hasMore } = useInfiniteVisible({
    total: filtered.length,
    pageSize: 24,
    resetKey: q,
  });
  const visibleArtists = filtered.slice(0, visible);

  if (loading) return <LoadingBlock />;
  if (artists.length === 0)
    return (
      <EmptyState
        icon={<Users className="h-6 w-6" />}
        title="No artists followed"
        subtitle="Follow artists from their profile to see them here."
      />
    );

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {visibleArtists.map((a) => (
          <Link
            key={a.id}
            to="/artist/$id"
            params={{ id: a.id }}
            className="group flex flex-col items-center gap-3 rounded-2xl bg-surface/60 p-4 text-center ring-1 ring-border transition hover:bg-surface-2"
          >
            {a.avatar_url ? (
              <img src={a.avatar_url} alt="" className="h-28 w-28 rounded-full object-cover ring-1 ring-border" />
            ) : (
              <div className="grid h-28 w-28 place-items-center rounded-full bg-primary/20 text-2xl font-black text-primary">
                {a.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center justify-center gap-1 truncate text-sm font-bold">
                {a.name}
                {a.is_verified && (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] text-primary-foreground">
                    ✓
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {Intl.NumberFormat("en", { notation: "compact" }).format(a.monthly_listeners)} monthly
              </div>
            </div>
          </Link>
        ))}
      </div>
      <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
    </>
  );
}

// ────────────────────────────────────────────────
// Albums tab (derived)
// ────────────────────────────────────────────────
function AlbumsTab({ q, loading, albums }: { q: string; loading: boolean; albums: Awaited<ReturnType<typeof getYourAlbums>> }) {
  const filtered = useMemo(
    () =>
      albums.filter((a) => {
        const s = q.trim().toLowerCase();
        return !s || a.album.toLowerCase().includes(s) || a.artist_name.toLowerCase().includes(s);
      }),
    [albums, q],
  );
  const { visible, sentinelRef, hasMore } = useInfiniteVisible({
    total: filtered.length,
    pageSize: 24,
    resetKey: q,
  });
  const visibleAlbums = filtered.slice(0, visible);

  if (loading) return <LoadingBlock />;
  if (albums.length === 0)
    return (
      <EmptyState
        icon={<Disc3 className="h-6 w-6" />}
        title="No albums yet"
        subtitle="Albums from the tracks you like and play will show up here."
      />
    );

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {visibleAlbums.map((a) => (
          <Link
            key={a.key}
            to="/search"
            search={{ q: a.album, genre: "", tab: "songs", sort: "relevant", duration: "any" }}
            className="group flex flex-col gap-3 rounded-2xl bg-surface/60 p-3 ring-1 ring-border transition hover:bg-surface-2"
          >
            {a.cover_url ? (
              <img src={a.cover_url} alt="" className="aspect-square w-full rounded-xl object-cover shadow-card" />
            ) : (
              <div className="grid aspect-square w-full place-items-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-card">
                <Music2 className="h-1/3 w-1/3 text-white/90" />
              </div>
            )}
            <div>
              <div className="truncate text-sm font-bold">{a.album}</div>
              <Link
                to="/artist/$id"
                params={{ id: a.artist_id }}
                onClick={(e) => e.stopPropagation()}
                className="truncate text-xs text-muted-foreground hover:text-foreground"
              >
                {a.artist_name}
              </Link>
              <div className="text-xs text-muted-foreground">{a.track_count} tracks</div>
            </div>
          </Link>
        ))}
      </div>
      <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
    </>
  );
}

// ────────────────────────────────────────────────
// History tab
// ────────────────────────────────────────────────
function HistoryTab({
  q,
  loading,
  entries,
}: {
  q: string;
  loading: boolean;
  entries: Awaited<ReturnType<typeof getPlayHistory>>;
}) {
  const queryClient = useQueryClient();
  const doClear = useServerFn(clearPlayHistory);
  const clearMut = useMutation({
    mutationFn: () => doClear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast.success("History cleared");
    },
  });

  const filtered = useMemo(
    () =>
      entries.filter((t) => {
        const s = q.trim().toLowerCase();
        return !s || t.title.toLowerCase().includes(s) || t.artist_name.toLowerCase().includes(s);
      }),
    [entries, q],
  );
  const mapped = filtered.map(dbTrackToTrack);
  const { current, isPlaying, play, toggle } = usePlayer();

  if (loading) return <LoadingBlock />;
  if (entries.length === 0)
    return (
      <EmptyState
        icon={<Clock className="h-6 w-6" />}
        title="No listening history"
        subtitle="Tracks you play will appear here so you can quickly return to them."
      />
    );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Showing {filtered.length} of {entries.length}
        </div>
        <button
          onClick={() => {
            if (confirm("Clear your entire listening history?")) clearMut.mutate();
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-white/5 hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" /> Clear history
        </button>
      </div>
      <ul className="overflow-hidden rounded-2xl bg-surface/40 ring-1 ring-border">
        {filtered.map((t, i) => {
          const track = mapped[i];
          const isCurrent = current?.id === t.id;
          return (
            <li
              key={`${t.id}-${t.played_at}`}
              className="grid grid-cols-[40px_minmax(0,3fr)_minmax(0,2fr)_60px] items-center gap-3 border-b border-border/40 px-3 py-2 last:border-0 hover:bg-white/5"
            >
              <button
                onClick={() => (isCurrent ? toggle() : play(track, mapped))}
                className="grid h-8 w-8 place-items-center rounded-full text-primary"
                aria-label="Play"
              >
                {isCurrent && isPlaying ? (
                  <Pause className="h-4 w-4" fill="currentColor" />
                ) : (
                  <Play className="h-4 w-4" fill="currentColor" />
                )}
              </button>
              <div className="flex min-w-0 items-center gap-3">
                <img src={track.cover} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <div className="min-w-0">
                  <div className={`truncate text-sm font-semibold ${isCurrent ? "text-primary" : ""}`}>{t.title}</div>
                  <Link
                    to="/artist/$id"
                    params={{ id: t.artist_id }}
                    className="truncate text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t.artist_name}
                  </Link>
                </div>
              </div>
              <span className="hidden truncate text-xs text-muted-foreground md:inline">{relTime(t.played_at)}</span>
              <span className="text-right text-xs text-muted-foreground">{fmt(t.duration_seconds)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ────────────────────────────────────────────────
// Playlist detail overlay
// ────────────────────────────────────────────────
function PlaylistDetailView({ playlistId, onClose }: { playlistId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const fetchPlaylist = useServerFn(getPlaylist);
  const doRemove = useServerFn(removeTrackFromPlaylist);
  const doRename = useServerFn(renamePlaylist);
  const doDelete = useServerFn(deletePlaylist);

  const q = useQuery({
    queryKey: ["library", "playlist", playlistId],
    queryFn: () => fetchPlaylist({ data: { id: playlistId } }),
  });

  const removeMut = useMutation({
    mutationFn: (trackId: string) => doRemove({ data: { playlistId, trackId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast.success("Removed from playlist");
    },
    onError: () => toast.error("Couldn't remove"),
  });

  const renameMut = useMutation({
    mutationFn: (vars: { name: string; description?: string; is_public?: boolean }) =>
      doRename({
        data: {
          id: playlistId,
          name: vars.name,
          description: vars.description,
          is_public: vars.is_public,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
    onError: () => toast.error("Couldn't update playlist"),
  });

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Track | null>(null);

  const deleteMut = useMutation({
    mutationFn: () => doDelete({ data: { id: playlistId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast.success("Playlist deleted");
      onClose();
    },
    onError: () => toast.error("Couldn't delete playlist"),
  });

  const { play } = usePlayer();

  if (q.isLoading) return <LoadingBlock />;
  if (q.isError || !q.data)
    return (
      <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
        Couldn't load this playlist.{" "}
        <button onClick={onClose} className="underline">
          Back
        </button>
      </div>
    );

  const p = q.data;
  const mapped = p.tracks.map(dbTrackToTrack);
  const totalSeconds = p.tracks.reduce((s, t) => s + (t.duration_seconds ?? 0), 0);

  return (
    <div>
      <button
        onClick={onClose}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to library
      </button>

      <div className="mb-6 flex flex-col items-start gap-5 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-surface p-5 ring-1 ring-border md:flex-row md:items-end">
        <PlaylistCover
          cover_url={p.cover_url}
          thumbs={p.tracks.slice(0, 4).map((t) => t.cover_url ?? "").filter(Boolean)}
          name={p.name}
          className="h-40 w-40 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {p.is_public ? "Public playlist" : "Private playlist"}
          </div>
          <h1 className="mt-1 truncate text-3xl font-black md:text-4xl">{p.name}</h1>
          {p.description && <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>}
          <div className="mt-3 text-xs text-muted-foreground">
            {p.tracks.length} tracks · {Math.round(totalSeconds / 60)} min
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => mapped.length && play(mapped[0], mapped)}
              disabled={mapped.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-40"
            >
              <Play className="h-4 w-4" fill="currentColor" /> Play
            </button>
            <button
              onClick={() => {
                if (mapped.length === 0) return;
                const shuffled = [...mapped].sort(() => Math.random() - 0.5);
                play(shuffled[0], shuffled);
              }}
              disabled={mapped.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold ring-1 ring-border hover:bg-surface-2 disabled:opacity-40"
            >
              <Shuffle className="h-4 w-4" /> Shuffle
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="More"
                  className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-white/5"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px]">
                <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                  Edit details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    renameMut.mutate(
                      { name: p.name, is_public: !p.is_public },
                      {
                        onSuccess: () =>
                          toast.success(
                            p.is_public ? "Playlist is now private" : "Playlist is now public",
                          ),
                      },
                    );
                  }}
                >
                  {p.is_public ? "Make private" : "Make public"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setConfirmDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {mapped.length === 0 ? (
        <EmptyState
          icon={<Music2 className="h-6 w-6" />}
          title="This playlist is empty"
          subtitle="Search for songs and use the track menu to add them here."
        />
      ) : (
        <TrackList tracks={mapped} queue={mapped} onRemove={(t) => setRemoveTarget(t)} />
      )}

      <EditPlaylistDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={{ name: p.name, description: p.description ?? "", is_public: p.is_public }}
        onSubmit={(values) =>
          renameMut.mutate(values, {
            onSuccess: () => {
              toast.success("Playlist updated");
              setEditOpen(false);
            },
          })
        }
        pending={renameMut.isPending}
      />

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{p.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the playlist and remove all its tracks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMut.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{removeTarget?.title}" from "{p.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removeTarget) removeMut.mutate(removeTarget.id);
                setRemoveTarget(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditPlaylistDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: { name: string; description: string; is_public: boolean };
  onSubmit: (values: { name: string; description: string; is_public: boolean }) => void;
  pending: boolean;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [isPublic, setIsPublic] = useState(initial.is_public);

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setName(initial.name);
      setDescription(initial.description);
      setIsPublic(initial.is_public);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && !pending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit playlist</DialogTitle>
          <DialogDescription>Update the name, description, and visibility.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pl-name">Name</Label>
            <Input
              id="pl-name"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder="My playlist"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-desc">Description</Label>
            <Textarea
              id="pl-desc"
              value={description}
              maxLength={240}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this playlist about?"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-surface/60 px-3 py-2.5">
            <div>
              <div className="text-sm font-semibold">Public</div>
              <div className="text-xs text-muted-foreground">Anyone can find and view this playlist</div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            onClick={() => canSave && onSubmit({ name: trimmed, description: description.trim(), is_public: isPublic })}
            disabled={!canSave}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────
function LoadingBlock() {
  return (
    <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-surface/40 p-10 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
        {icon}
      </div>
      <div className="text-base font-bold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow transition hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" /> {action.label}
        </button>
      )}
    </div>
  );
}
