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
