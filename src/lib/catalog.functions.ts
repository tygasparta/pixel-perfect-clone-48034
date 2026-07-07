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
