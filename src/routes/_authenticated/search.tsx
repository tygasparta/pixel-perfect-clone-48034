import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Loader2, Mic, Pause, Play, Search as SearchIcon, X } from "lucide-react";
import { genres, moods, trendingSearches } from "@/lib/mock-data";
import { RecommendedForYou } from "@/components/recommended-for-you";
import { searchCatalog } from "@/lib/search.functions";
import { getTopArtists } from "@/lib/catalog.functions";
import { dbTrackToTrack } from "@/lib/track-mapper";
import { usePlayer } from "@/lib/player";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  genre: fallback(z.string(), "").default(""),
  tab: fallback(z.string(), "all").default("all"),
  sort: fallback(z.string(), "relevant").default("relevant"),
  duration: fallback(z.string(), "any").default("any"),
});

const SORT_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "relevant", label: "Most Relevant" },
  { id: "popular", label: "Popular" },
  { id: "newest", label: "Newest" },
];
const DURATION_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "any", label: "Any length" },
  { id: "short", label: "< 2 min" },
  { id: "medium", label: "2–5 min" },
  { id: "long", label: "5 min+" },
];

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: zodValidator(searchSchema),
  component: SearchPage,
});

const RECENTS_KEY = "beatify.recent-searches";
const moodColors = [
  "from-slate-600 to-slate-800",
  "from-amber-500 to-orange-700",
  "from-rose-500 to-red-700",
  "from-pink-500 to-rose-700",
  "from-purple-500 to-fuchsia-700",
  "from-cyan-500 to-blue-700",
];

function SearchPage() {
  const { q, genre, tab, sort, duration } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [input, setInput] = useState(q);
  const [debounced, setDebounced] = useState(q);
  const [recents, setRecents] = useState<string[]>([]);
  const { play, current, isPlaying, toggle } = usePlayer();

  const runSearch = useServerFn(searchCatalog);
  const fetchTopArtists = useServerFn(getTopArtists);

  useEffect(() => setInput(q), [q]);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(input.trim());
      if (input.trim() !== q) {
        navigate({ search: (prev: { q: string; genre: string; tab: string; sort: string; duration: string }) => ({ ...prev, q: input.trim() }), replace: true });
      }
    }, 250);
    return () => clearTimeout(id);
  }, [input]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch {}
  }, []);

  const pushRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setRecents((prev: string[]) => {
      const next = [t, ...prev.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearRecents = () => {
    setRecents([]);
    try {
      localStorage.removeItem(RECENTS_KEY);
    } catch {}
  };

  const hasQuery = debounced.length >= 1 || genre.length >= 1;

  const PAGE_SIZE = 24;
  const resultsQ = useInfiniteQuery({
    queryKey: ["search-page", debounced, genre, sort, duration, PAGE_SIZE],
    queryFn: ({ pageParam }) =>
      runSearch({ data: { q: debounced, genre, limit: PAGE_SIZE, offset: pageParam as number, sort, duration } }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset ?? undefined,
    enabled: hasQuery,
    staleTime: 30_000,
  });

  const topArtistsQ = useQuery({
    queryKey: ["top-artists", 8],
    queryFn: () => fetchTopArtists({ data: { limit: 8 } }),
    staleTime: 60_000,
  });

  const pages = resultsQ.data?.pages ?? [];
  const tracks = pages.flatMap((p) => p.tracks);
  const artistsMap = new Map<string, typeof pages[number]["artists"][number]>();
  for (const p of pages) for (const a of p.artists) if (!artistsMap.has(a.id)) artistsMap.set(a.id, a);
  const artists = Array.from(artistsMap.values());
  const queue = tracks.map(dbTrackToTrack);

  const filteredTracks = tab === "artists" ? [] : tracks;
  const filteredArtists = tab === "songs" ? [] : artists;

  // Infinite-scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && resultsQ.hasNextPage && !resultsQ.isFetchingNextPage) {
          resultsQ.fetchNextPage();
        }
      },
      { rootMargin: "600px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [resultsQ.hasNextPage, resultsQ.isFetchingNextPage, hasQuery, tab]);

  const submitSearch = (term: string) => {
    pushRecent(term);
    setInput(term);
    navigate({ search: (prev: { q: string; genre: string; tab: string; sort: string; duration: string }) => ({ ...prev, q: term, genre: "" }), replace: false });
  };

  const applyGenre = (g: string) => {
    navigate({ search: (prev: { q: string; genre: string; tab: string; sort: string; duration: string }) => ({ ...prev, genre: g, q: "" }), replace: false });
    setInput("");
  };

  const clearAll = () => {
    setInput("");
    navigate({ search: () => ({ q: "", genre: "", tab: "all", sort: "relevant", duration: "any" }), replace: true });
  };

  const setSort = (v: string) => navigate({ search: (prev: { q: string; genre: string; tab: string; sort: string; duration: string }) => ({ ...prev, sort: v }), replace: true });
  const setDuration = (v: string) => navigate({ search: (prev: { q: string; genre: string; tab: string; sort: string; duration: string }) => ({ ...prev, duration: v }), replace: true });

  const hasActiveFilter = sort !== "relevant" || duration !== "any";



  return (
    <div className="mx-auto max-w-5xl px-5 pt-14 md:px-8 md:pt-10">
      {/* Search bar */}
      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) submitSearch(input.trim());
            if (e.key === "Escape") clearAll();
          }}
          placeholder="Search for songs, artists, albums…"
          aria-label="Search"
          className="w-full rounded-full bg-surface py-3.5 pl-11 pr-11 text-sm outline-none ring-1 ring-border focus:ring-primary"
        />
        {input || genre ? (
          <button
            onClick={clearAll}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <Mic className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        )}
      </div>

      {/* Active filter chip */}
      {genre && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtering by</span>
          <button
            onClick={() => navigate({ search: (prev: { q: string; genre: string; tab: string; sort: string; duration: string }) => ({ ...prev, genre: "" }) })}
            className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/30"
          >
            {genre}
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Results view */}
      {hasQuery ? (
        <div>
          {/* Tabs */}
          <div className="mb-4 flex gap-2">
            {(["all", "songs", "artists"] as const).map((t) => (
              <button
                key={t}
                onClick={() => navigate({ search: (prev: { q: string; genre: string; tab: string; sort: string; duration: string }) => ({ ...prev, tab: t }) })}
                className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize transition ${
                  tab === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground ring-1 ring-border hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Sort + duration filters */}
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl bg-surface/40 p-2.5 ring-1 ring-border">
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Sort
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold outline-none ring-1 ring-border focus:ring-primary"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Duration</span>
              {DURATION_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setDuration(o.id)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                    duration === o.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground ring-1 ring-border hover:text-foreground"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {hasActiveFilter && (
              <button
                onClick={() => navigate({ search: (prev: { q: string; genre: string; tab: string; sort: string; duration: string }) => ({ ...prev, sort: "relevant", duration: "any" }), replace: true })}
                className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <X className="h-3 w-3" /> Reset filters
              </button>
            )}
          </div>


          {resultsQ.isLoading && (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          )}

          {resultsQ.isError && (
            <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
              Couldn't load results. Try again.
            </div>
          )}

          {!resultsQ.isLoading &&
            pages.length > 0 &&
            filteredTracks.length === 0 &&
            filteredArtists.length === 0 && (
              <div className="py-16 text-center">
                <div className="text-lg font-bold">No results</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Nothing matched {debounced ? `"${debounced}"` : genre}. Try another search.
                </div>
              </div>
            )}

          {filteredArtists.length > 0 && (
            <section className="mb-6">
              <SectionTitle>Artists</SectionTitle>
              <div className="scrollbar-none -mx-5 flex gap-4 overflow-x-auto px-5 pb-2">
                {filteredArtists.map((a) => (
                  <Link
                    key={a.id}
                    to="/artist/$id"
                    params={{ id: a.id }}
                    className="w-24 shrink-0 text-center"
                  >
                    {a.cover_url ? (
                      <img
                        src={a.cover_url}
                        alt=""
                        className="mx-auto h-24 w-24 rounded-full object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-primary/20 text-primary">
                        {a.name.slice(0, 1)}
                      </div>
                    )}
                    <div className="mt-2 truncate text-xs font-semibold">{a.name}</div>
                    <div className="text-[10px] text-muted-foreground">Artist</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {filteredTracks.length > 0 && (
            <section>
              <SectionTitle>Songs</SectionTitle>
              <ul className="divide-y divide-border/60 rounded-2xl bg-surface/50 ring-1 ring-border">
                {filteredTracks.map((t, i) => {
                  const track = dbTrackToTrack(t);
                  const isCurrent = current?.id === t.id;
                  return (
                    <li key={t.id} className="group flex items-center gap-3 px-3 py-2.5">
                      <span className="w-6 text-center text-xs text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="relative">
                        <img src={track.cover} alt="" className="h-11 w-11 rounded-lg object-cover" />
                        <button
                          onClick={() => (isCurrent ? toggle() : (play(track, queue), pushRecent(t.title)))}
                          className={`absolute inset-0 grid place-items-center rounded-lg bg-black/50 text-white transition ${
                            isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                          aria-label={isCurrent && isPlaying ? "Pause" : "Play"}
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="h-4 w-4" fill="currentColor" />
                          ) : (
                            <Play className="h-4 w-4" fill="currentColor" />
                          )}
                        </button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`truncate text-sm font-bold ${isCurrent ? "text-primary" : ""}`}>
                          {t.title}
                        </div>
                        <Link
                          to="/artist/$id"
                          params={{ id: t.artist_id }}
                          className="truncate text-xs text-muted-foreground hover:text-foreground"
                        >
                          {t.artist_name}
                        </Link>
                      </div>
                      {t.genre && (
                        <span className="hidden rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-border md:inline">
                          {t.genre}
                        </span>
                      )}
                      <span className="hidden text-xs text-muted-foreground md:inline">
                        {formatDuration(t.duration_seconds)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <div>
          {/* Recent searches */}
          {recents.length > 0 && (
            <section className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold">Recent searches</h2>
                <button
                  onClick={clearRecents}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recents.map((r) => (
                  <button
                    key={r}
                    onClick={() => submitSearch(r)}
                    className="rounded-full bg-surface px-3.5 py-1.5 text-xs font-medium ring-1 ring-border hover:bg-surface-2"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="mb-6">
            <SectionTitle>Recommended for you</SectionTitle>
            <RecommendedForYou limit={6} variant="list" />
          </section>

          <section className="mb-6">
            <SectionTitle>Trending Searches</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => submitSearch(s)}
                  className="rounded-full bg-surface px-3.5 py-1.5 text-xs font-medium ring-1 ring-border hover:bg-surface-2"
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section className="mb-6">
            <SectionTitle>Browse Genres</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
              {genres.map((g) => (
                <button
                  key={g.name}
                  onClick={() => applyGenre(g.name)}
                  className={`aspect-[5/3] rounded-xl bg-gradient-to-br p-3 text-left text-sm font-bold shadow-card transition hover:scale-[1.02] ${g.color}`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </section>

          <section className="mb-6">
            <SectionTitle>Mood</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
              {moods.map((m, i) => (
                <button
                  key={m}
                  onClick={() => submitSearch(m)}
                  className={`aspect-[5/3] rounded-xl bg-gradient-to-br p-3 text-left text-sm font-bold shadow-card transition hover:scale-[1.02] ${moodColors[i % moodColors.length]}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <SectionTitle>Top Artists</SectionTitle>
            {topArtistsQ.isLoading ? (
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 w-24 shrink-0 animate-pulse rounded-full bg-surface" />
                ))}
              </div>
            ) : (
              <div className="scrollbar-none -mx-5 flex gap-4 overflow-x-auto px-5 pb-2">
                {(topArtistsQ.data ?? []).map((a) => (
                  <Link
                    key={a.id}
                    to="/artist/$id"
                    params={{ id: a.id }}
                    className="w-24 shrink-0 text-center"
                  >
                    {a.cover ? (
                      <img
                        src={a.cover}
                        alt=""
                        className="mx-auto h-24 w-24 rounded-full object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-primary/20 text-primary">
                        {a.name.slice(0, 1)}
                      </div>
                    )}
                    <div className="mt-2 truncate text-xs font-semibold">{a.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {a.plays.toLocaleString()} plays
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold">{children}</h2>
    </div>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
