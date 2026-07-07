import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { RecTrack } from "./recommendations.functions";

export type SearchArtist = { id: string; name: string; cover_url: string | null };
export type SearchResults = { tracks: RecTrack[]; artists: SearchArtist[] };

export const searchCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { q: string; limit?: number }) => ({
    q: (data.q ?? "").trim().slice(0, 80),
    limit: Math.min(Math.max(data.limit ?? 6, 1), 20),
  }))
  .handler(async ({ data, context }): Promise<SearchResults> => {
    const { supabase } = context;
    if (data.q.length < 1) return { tracks: [], artists: [] };

    // Escape PostgREST ilike wildcards
    const safe = data.q.replace(/[%_\\]/g, (m) => `\\${m}`);
    const pattern = `%${safe}%`;

    const { data: tracks, error } = await supabase
      .from("tracks")
      .select("id, title, artist_name, artist_id, cover_url, audio_url, duration_seconds, genre, play_count")
      .eq("is_published", true)
      .or(`title.ilike.${pattern},artist_name.ilike.${pattern},album.ilike.${pattern}`)
      .order("play_count", { ascending: false })
      .limit(data.limit);
    if (error) throw error;

    const artistMap = new Map<string, SearchArtist>();
    for (const t of tracks ?? []) {
      if (!artistMap.has(t.artist_id) && t.artist_name.toLowerCase().includes(data.q.toLowerCase())) {
        artistMap.set(t.artist_id, { id: t.artist_id, name: t.artist_name, cover_url: t.cover_url });
      }
    }

    return {
      tracks: (tracks ?? []) as RecTrack[],
      artists: Array.from(artistMap.values()).slice(0, 4),
    };
  });
