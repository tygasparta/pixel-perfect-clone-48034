import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic, Search as SearchIcon } from "lucide-react";
import { genres, moods, trendingSearches, demoTracks } from "@/lib/mock-data";
import { RecommendedForYou } from "@/components/recommended-for-you";

export const Route = createFileRoute("/_authenticated/search")({
  component: SearchPage,
});

function SearchPage() {
  const artists = Array.from(
    new Map(demoTracks.map((t) => [t.artistId, { id: t.artistId, name: t.artist, cover: t.cover }])).values(),
  ).slice(0, 6);

  return (
    <div className="mx-auto max-w-3xl px-5 pt-14 md:px-8 md:pt-10">
      <div className="relative mb-6">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search for songs, artists, albums…"
          className="w-full rounded-full bg-surface py-3.5 pl-11 pr-11 text-sm outline-none ring-1 ring-border focus:ring-primary"
        />
        <Mic className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
      </div>

      <div className="mb-6">
        <SectionTitle>Recommended for you</SectionTitle>
        <RecommendedForYou limit={6} variant="list" />
      </div>

      <SectionTitle>Trending Searches</SectionTitle>
      <div className="mb-6 flex flex-wrap gap-2">
        {trendingSearches.map((q) => (
          <button
            key={q}
            className="rounded-full bg-surface px-3.5 py-1.5 text-xs font-medium ring-1 ring-border hover:bg-surface-2"
          >
            {q}
          </button>
        ))}
      </div>

      <SectionTitle rightAction="See all">Browse Genres</SectionTitle>
      <div className="mb-6 grid grid-cols-3 gap-2.5">
        {genres.map((g) => (
          <div
            key={g.name}
            className={`aspect-[5/3] rounded-xl bg-gradient-to-br p-2.5 text-[13px] font-bold shadow-card ${g.color}`}
          >
            {g.name}
          </div>
        ))}
      </div>

      <SectionTitle rightAction="See all">Mood</SectionTitle>
      <div className="mb-6 grid grid-cols-3 gap-2.5">
        {moods.map((m, i) => (
          <div
            key={m}
            className={`aspect-[5/3] rounded-xl bg-gradient-to-br p-2.5 text-[13px] font-bold shadow-card ${
              ["from-slate-600 to-slate-800","from-amber-500 to-orange-700","from-rose-500 to-red-700","from-pink-500 to-rose-700","from-purple-500 to-fuchsia-700","from-cyan-500 to-blue-700"][i]
            }`}
          >
            {m}
          </div>
        ))}
      </div>

      <SectionTitle rightAction="See all">Top Artists</SectionTitle>
      <div className="scrollbar-none -mx-5 flex gap-4 overflow-x-auto px-5 pb-4">
        {artists.map((a) => (
          <Link key={a.id} to="/artist/$id" params={{ id: a.id }} className="w-20 shrink-0 text-center">
            <img src={a.cover} alt="" className="mx-auto h-20 w-20 rounded-full object-cover ring-1 ring-border" />
            <div className="mt-2 truncate text-xs font-semibold">{a.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ children, rightAction }: { children: React.ReactNode; rightAction?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold">{children}</h2>
      {rightAction && <button className="text-xs font-medium text-primary">{rightAction}</button>}
    </div>
  );
}
