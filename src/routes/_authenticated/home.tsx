import { createFileRoute } from "@tanstack/react-router";
import { Bell, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrackRow } from "@/components/track-row";
import { RecommendedForYou } from "@/components/recommended-for-you";
import { demoTracks, madeForYou } from "@/lib/mock-data";
import { usePlayer } from "@/lib/player";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

function HomePage() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).single();
      return data;
    },
  });

  const { play } = usePlayer();
  const trending = demoTracks.slice(0, 3);
  const newReleases = demoTracks.slice(3, 6);

  return (
    <div className="px-5 pt-14">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Good Morning<br />
            <span className="flex items-center gap-2">
              {profile?.display_name ?? "there"} <span>👋</span>
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative grid h-11 w-11 place-items-center rounded-full bg-surface">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          </button>
        </div>
      </div>

      <Section title="Made for you">
        <RecommendedForYou limit={10} />
      </Section>

      <Section title="Trending in Zimbabwe">
        <div className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
          {trending.map((t) => (
            <button
              key={t.id}
              onClick={() => play(t, trending)}
              className="w-32 shrink-0 snap-start text-left"
            >
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
            <div
              key={m.name}
              className={`aspect-square rounded-2xl bg-gradient-to-br p-3 text-left shadow-card ${m.color}`}
            >
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
