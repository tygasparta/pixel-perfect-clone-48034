import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { RecTrack } from "./recommendations.functions";

const TRACK_COLUMNS =
  "id, title, artist_name, artist_id, cover_url, audio_url, duration_seconds, genre, play_count";

function clampLimit(n: number | undefined, def: number) {
  return Math.min(Math.max(n ?? def, 1), 50);
}

/** Most-played published tracks. Sorted by play_count DESC, then created_at DESC as tiebreak. */
export const getTrendingTracks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { limit?: number } | undefined) => ({ limit: clampLimit(data?.limit, 10) }))
  .handler(async ({ data, context }): Promise<RecTrack[]> => {
    const { data: rows, error } = await context.supabase
      .from("tracks")
      .select(TRACK_COLUMNS)
      .eq("is_published", true)
      .order("play_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw error;
    return (rows ?? []) as RecTrack[];
  });

/** Newest published tracks. Sorted by created_at DESC, then play_count DESC as tiebreak. */
export const getNewReleases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { limit?: number } | undefined) => ({ limit: clampLimit(data?.limit, 12) }))
  .handler(async ({ data, context }): Promise<RecTrack[]> => {
    const { data: rows, error } = await context.supabase
      .from("tracks")
      .select(TRACK_COLUMNS)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .order("play_count", { ascending: false })
      .limit(data.limit);
    if (error) throw error;
    return (rows ?? []) as RecTrack[];
  });

/** The signed-in user's most recently played tracks, de-duplicated by track. */
export const getRecentlyPlayed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { limit?: number } | undefined) => ({ limit: clampLimit(data?.limit, 8) }))
  .handler(async ({ data, context }): Promise<RecTrack[]> => {
    const { supabase, userId } = context;
    // Pull a wider window of recent plays so we can de-dupe by track_id and still return `limit` unique tracks.
    const { data: plays, error: playsErr } = await supabase
      .from("plays")
      .select("track_id, played_at")
      .eq("user_id", userId)
      .order("played_at", { ascending: false })
      .limit(data.limit * 6);
    if (playsErr) throw playsErr;

    const orderedIds: string[] = [];
    const seen = new Set<string>();
    for (const p of plays ?? []) {
      if (seen.has(p.track_id)) continue;
      seen.add(p.track_id);
      orderedIds.push(p.track_id);
      if (orderedIds.length >= data.limit) break;
    }
    if (orderedIds.length === 0) return [];

    const { data: rows, error } = await supabase
      .from("tracks")
      .select(TRACK_COLUMNS)
      .in("id", orderedIds);
    if (error) throw error;

    const byId = new Map((rows ?? []).map((r) => [r.id, r] as const));
    return orderedIds
      .map((id) => byId.get(id))
      .filter((t): t is NonNullable<typeof t> => Boolean(t)) as RecTrack[];
  });

export type TopArtist = {
  id: string;
  name: string;
  cover: string | null;
  plays: number;
  tracks: number;
};

/** Top artists ranked by aggregate play_count across their published tracks. */
export const getTopArtists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { limit?: number } | undefined) => ({ limit: clampLimit(data?.limit, 5) }))
  .handler(async ({ data, context }): Promise<TopArtist[]> => {
    const { data: rows, error } = await context.supabase
      .from("tracks")
      .select("artist_id, artist_name, cover_url, play_count")
      .eq("is_published", true);
    if (error) throw error;

    const agg = new Map<string, TopArtist>();
    for (const r of rows ?? []) {
      if (!r.artist_id) continue;
      const cur = agg.get(r.artist_id);
      if (cur) {
        cur.plays += r.play_count ?? 0;
        cur.tracks += 1;
        if (!cur.cover && r.cover_url) cur.cover = r.cover_url;
      } else {
        agg.set(r.artist_id, {
          id: r.artist_id,
          name: r.artist_name,
          cover: r.cover_url ?? null,
          plays: r.play_count ?? 0,
          tracks: 1,
        });
      }
    }

    const artists = Array.from(agg.values()).sort((a, b) => b.plays - a.plays).slice(0, data.limit);

    // Enrich with profile avatars when available
    const ids = artists.map((a) => a.id);
    if (ids.length > 0) {
      const { data: profiles } = await context.supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ids);
      const byId = new Map((profiles ?? []).map((p) => [p.id, p] as const));
      for (const a of artists) {
        const p = byId.get(a.id);
        if (p?.avatar_url) a.cover = p.avatar_url;
        if (p?.display_name) a.name = p.display_name;
      }
    }
    return artists;
  });
