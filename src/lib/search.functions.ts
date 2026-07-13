import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { RecTrack } from "./recommendations.functions";

export type SearchArtist = { id: string; name: string; cover_url: string | null };
export type SearchResults = { tracks: RecTrack[]; artists: SearchArtist[] };

export const searchCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { q?: string; genre?: string; limit?: number }) => ({
    q: (data.q ?? "").trim().slice(0, 80),
    genre: (data.genre ?? "").trim().slice(0, 40),
    limit: Math.min(Math.max(data.limit ?? 12, 1), 50),
  }))
  .handler(async ({ data, context }): Promise<SearchResults> => {
    const { supabase } = context;
    if (data.q.length < 1 && data.genre.length < 1) return { tracks: [], artists: [] };

    let query = supabase
      .from("tracks")
      .select("id, title, artist_name, artist_id, cover_url, audio_url, duration_seconds, genre, play_count")
      .eq("is_published", true);

    if (data.q.length >= 1) {
      const safe = data.q.replace(/[%_\\]/g, (m) => `\\${m}`);
      const pattern = `%${safe}%`;
      query = query.or(`title.ilike.${pattern},artist_name.ilike.${pattern},album.ilike.${pattern}`);
    }
    if (data.genre.length >= 1) {
      query = query.ilike("genre", data.genre);
    }

    const { data: tracks, error } = await query
      .order("play_count", { ascending: false })
      .limit(data.limit);
    if (error) throw error;

    const artistMap = new Map<string, SearchArtist>();
    const qLower = data.q.toLowerCase();
    for (const t of tracks ?? []) {
      if (data.q.length >= 1 && !artistMap.has(t.artist_id) && t.artist_name.toLowerCase().includes(qLower)) {
        artistMap.set(t.artist_id, { id: t.artist_id, name: t.artist_name, cover_url: t.cover_url });
      }
    }

    return {
      tracks: (tracks ?? []) as RecTrack[],
      artists: Array.from(artistMap.values()).slice(0, 6),
    };
  });
