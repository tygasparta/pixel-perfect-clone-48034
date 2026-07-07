import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Play, Search, User, X } from "lucide-react";
import { searchCatalog } from "@/lib/search.functions";
import { dbTrackToTrack } from "@/lib/track-mapper";
import { usePlayer } from "@/lib/player";

export function SearchCommand({ className = "" }: { className?: string }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { play } = usePlayer();
  const runSearch = useServerFn(searchCatalog);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 220);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const query = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => runSearch({ data: { q: debounced, limit: 6 } }),
    enabled: debounced.length >= 1,
    staleTime: 30_000,
  });

  const results = query.data;
  const showPanel = open && q.trim().length >= 1;
  const isLoading = query.isFetching && !query.data;
  const isEmpty =
    !isLoading && results && results.tracks.length === 0 && results.artists.length === 0;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === "Enter" && q.trim()) {
            setOpen(false);
            navigate({ to: "/search" });
          }
        }}
        placeholder="Search songs, artists, albums…"
        aria-label="Search"
        className="h-11 w-full rounded-full bg-surface/80 pl-11 pr-11 text-sm outline-none ring-1 ring-border focus:ring-primary/60"
      />
      {q && (
        <button
          onClick={() => {
            setQ("");
            setOpen(false);
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {showPanel && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl bg-surface/95 p-2 shadow-2xl ring-1 ring-border backdrop-blur"
        >
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          )}

          {query.isError && (
            <div className="px-3 py-6 text-sm text-destructive">
              Couldn't load results. Try again.
            </div>
          )}

          {isEmpty && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matches for <span className="font-semibold text-foreground">"{q}"</span>
            </div>
          )}

          {!isLoading && results && results.artists.length > 0 && (
            <>
              <SectionHeader>Artists</SectionHeader>
              {results.artists.map((a) => (
                <Link
                  key={a.id}
                  to="/artist/$id"
                  params={{ id: a.id }}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5"
                >
                  {a.cover_url ? (
                    <img src={a.cover_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/20 text-primary">
                      <User className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{a.name}</div>
                    <div className="text-[11px] text-muted-foreground">Artist</div>
                  </div>
                </Link>
              ))}
            </>
          )}

          {!isLoading && results && results.tracks.length > 0 && (
            <>
              <SectionHeader>Songs</SectionHeader>
              {results.tracks.map((t) => {
                const track = dbTrackToTrack(t);
                const queue = results.tracks.map(dbTrackToTrack);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      play(track, queue);
                      setOpen(false);
                    }}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/5"
                  >
                    <img src={track.cover} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{t.title}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{t.artist_name}</div>
                    </div>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/90 text-primary-foreground opacity-0 transition group-hover:opacity-100">
                      <Play className="h-3.5 w-3.5" fill="currentColor" />
                    </span>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/search" });
                }}
                className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-primary hover:bg-primary/10"
              >
                See all results for "{q}" →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </div>
  );
}
