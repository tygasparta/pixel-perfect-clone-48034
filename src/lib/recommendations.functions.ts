import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RecTrack = {
  id: string;
  title: string;
  artist_name: string;
  artist_id: string;
  cover_url: string | null;
  audio_url: string;
  duration_seconds: number;
  genre: string | null;
  play_count: number;
  score?: number;
  reason?: string;
};

/**
 * Content-based recommendations scored from the user's own likes and recent plays.
 *
 * Signals:
 *  - +5 per track by an artist the user has liked or played recently
 *  - +3 per track sharing a genre the user has liked or played recently
 *  - + log10(1 + play_count) as a mild popularity prior
 *  - excludes tracks the user has liked or played in the last 30 plays
 *
 * Cold start (no history) → top tracks by play_count.
 */
export const getRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { limit?: number } | undefined) => ({
    limit: Math.min(Math.max(data?.limit ?? 12, 1), 50),
  }))
  .handler(async ({ data, context }): Promise<RecTrack[]> => {
    const { supabase, userId } = context;

    const [likesRes, playsRes, tracksRes] = await Promise.all([
      supabase
        .from("likes")
        .select("track_id, tracks(artist_id, genre)")
        .eq("user_id", userId),
      supabase
        .from("plays")
        .select("track_id, tracks(artist_id, genre)")
        .eq("user_id", userId)
        .order("played_at", { ascending: false })
        .limit(50),
      supabase
        .from("tracks")
        .select(
          "id, title, artist_name, artist_id, cover_url, audio_url, duration_seconds, genre, play_count",
        )
        .eq("is_published", true),
    ]);

    if (tracksRes.error) throw tracksRes.error;
    const tracks = tracksRes.data ?? [];

    const artistAffinity = new Map<string, number>();
    const genreAffinity = new Map<string, number>();
    const excluded = new Set<string>();

    const bump = (m: Map<string, number>, k: string | null | undefined, w: number) => {
      if (!k) return;
      m.set(k, (m.get(k) ?? 0) + w);
    };

    for (const l of likesRes.data ?? []) {
      excluded.add(l.track_id);
      const t = l.tracks as { artist_id: string; genre: string | null } | null;
      bump(artistAffinity, t?.artist_id, 2);
      bump(genreAffinity, t?.genre, 2);
    }
    for (const p of (playsRes.data ?? []).slice(0, 30)) {
      excluded.add(p.track_id);
    }
    for (const p of playsRes.data ?? []) {
      const t = p.tracks as { artist_id: string; genre: string | null } | null;
      bump(artistAffinity, t?.artist_id, 1);
      bump(genreAffinity, t?.genre, 1);
    }

    const hasHistory = artistAffinity.size > 0 || genreAffinity.size > 0;

    const scored: RecTrack[] = tracks
      .filter((t) => !excluded.has(t.id))
      .map((t) => {
        const artistW = artistAffinity.get(t.artist_id) ?? 0;
        const genreW = t.genre ? genreAffinity.get(t.genre) ?? 0 : 0;
        const popularity = Math.log10(1 + Number(t.play_count ?? 0));
        const score = artistW * 5 + genreW * 3 + popularity;
        const reason = !hasHistory
          ? "Trending"
          : artistW > 0
            ? `More from ${t.artist_name}`
            : genreW > 0 && t.genre
              ? `Because you like ${t.genre}`
              : "Popular right now";
        return { ...t, score, reason };
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, data.limit);

    return scored;
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { trackId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("likes")
      .select("track_id")
      .eq("user_id", userId)
      .eq("track_id", data.trackId)
      .maybeSingle();
    if (existing) {
      await supabase.from("likes").delete().eq("user_id", userId).eq("track_id", data.trackId);
      return { liked: false };
    }
    await supabase.from("likes").insert({ user_id: userId, track_id: data.trackId });
    return { liked: true };
  });

export const recordPlay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { trackId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("plays").insert({ track_id: data.trackId, user_id: userId });
    return { ok: true };
  });

export const getLikedIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("likes")
      .select("track_id")
      .eq("user_id", context.userId);
    return (data ?? []).map((l) => l.track_id);
  });
