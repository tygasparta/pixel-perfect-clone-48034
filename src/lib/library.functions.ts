import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { RecTrack } from "./recommendations.functions";

const TRACK_COLUMNS =
  "id, title, artist_name, artist_id, album, cover_url, audio_url, duration_seconds, genre, play_count, created_at";

export type LibraryTrack = RecTrack & { album: string | null; created_at?: string };

// ────────────────────────────────────────────────────────────
// Overview / counts
// ────────────────────────────────────────────────────────────
export type LibraryCounts = {
  liked: number;
  playlists: number;
  artists: number;
  history: number;
};

export const getLibraryCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LibraryCounts> => {
    const { supabase, userId } = context;
    const [likes, playlists, follows, plays] = await Promise.all([
      supabase.from("likes").select("track_id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("playlists").select("id", { count: "exact", head: true }).eq("owner_id", userId),
      supabase.from("follows").select("artist_id", { count: "exact", head: true }).eq("follower_id", userId),
      supabase.from("plays").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);
    return {
      liked: likes.count ?? 0,
      playlists: playlists.count ?? 0,
      artists: follows.count ?? 0,
      history: plays.count ?? 0,
    };
  });

// ────────────────────────────────────────────────────────────
// Liked songs
// ────────────────────────────────────────────────────────────
export const getLikedTracks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LibraryTrack[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("likes")
      .select(`created_at, tracks(${TRACK_COLUMNS})`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? [])
      .map((row) => row.tracks as LibraryTrack | null)
      .filter((t): t is LibraryTrack => Boolean(t));
  });

// ────────────────────────────────────────────────────────────
// Playlists
// ────────────────────────────────────────────────────────────
export type PlaylistSummary = {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean;
  created_at: string;
  track_count: number;
  cover_thumbs: string[]; // up to 4 first-track covers for a mosaic fallback
};

export const listMyPlaylists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlaylistSummary[]> => {
    const { supabase, userId } = context;
    const { data: playlists, error } = await supabase
      .from("playlists")
      .select("id, name, description, cover_url, is_public, created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!playlists?.length) return [];

    const ids = playlists.map((p) => p.id);
    const { data: pts } = await supabase
      .from("playlist_tracks")
      .select("playlist_id, position, tracks(cover_url)")
      .in("playlist_id", ids)
      .order("position", { ascending: true });

    const byPlaylist = new Map<string, { count: number; thumbs: string[] }>();
    for (const p of playlists) byPlaylist.set(p.id, { count: 0, thumbs: [] });
    for (const pt of pts ?? []) {
      const entry = byPlaylist.get(pt.playlist_id);
      if (!entry) continue;
      entry.count += 1;
      const cover = (pt.tracks as { cover_url: string | null } | null)?.cover_url;
      if (cover && entry.thumbs.length < 4) entry.thumbs.push(cover);
    }

    return playlists.map((p) => ({
      ...p,
      track_count: byPlaylist.get(p.id)?.count ?? 0,
      cover_thumbs: byPlaylist.get(p.id)?.thumbs ?? [],
    }));
  });

export type PlaylistDetail = {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean;
  owner_id: string;
  created_at: string;
  tracks: LibraryTrack[];
};

export const getPlaylist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }): Promise<PlaylistDetail> => {
    const { supabase } = context;
    const { data: p, error } = await supabase
      .from("playlists")
      .select("id, name, description, cover_url, is_public, owner_id, created_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!p) throw new Error("Playlist not found");

    const { data: rows, error: e2 } = await supabase
      .from("playlist_tracks")
      .select(`position, tracks(${TRACK_COLUMNS})`)
      .eq("playlist_id", data.id)
      .order("position", { ascending: true });
    if (e2) throw e2;
    const tracks = (rows ?? [])
      .map((r) => r.tracks as LibraryTrack | null)
      .filter((t): t is LibraryTrack => Boolean(t));
    return { ...p, tracks };
  });

export const createPlaylist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { name: string; description?: string; is_public?: boolean }) => ({
    name: String(data.name ?? "").trim().slice(0, 60),
    description: (data.description ?? "").trim().slice(0, 240) || null,
    is_public: Boolean(data.is_public ?? false),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.name) throw new Error("Name is required");
    const { data: row, error } = await supabase
      .from("playlists")
      .insert({
        owner_id: userId,
        name: data.name,
        description: data.description,
        is_public: data.is_public,
      })
      .select("id, name, is_public")
      .single();
    if (error) throw error;
    return row;
  });

export const renamePlaylist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; name: string; description?: string; is_public?: boolean }) => ({
    id: String(data.id),
    name: String(data.name ?? "").trim().slice(0, 60),
    description: data.description !== undefined ? (data.description ?? "").trim().slice(0, 240) || null : undefined,
    is_public: data.is_public,
  }))
  .handler(async ({ data, context }) => {
    if (!data.name) throw new Error("Name is required");
    const patch: Record<string, unknown> = { name: data.name };
    if (data.description !== undefined) patch.description = data.description;
    if (data.is_public !== undefined) patch.is_public = data.is_public;
    const { error } = await context.supabase
      .from("playlists")
      .update(patch)
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const deletePlaylist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("playlists")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const addTrackToPlaylist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { playlistId: string; trackId: string }) => ({
    playlistId: String(data.playlistId),
    trackId: String(data.trackId),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify ownership
    const { data: p } = await supabase
      .from("playlists")
      .select("id")
      .eq("id", data.playlistId)
      .eq("owner_id", userId)
      .maybeSingle();
    if (!p) throw new Error("Playlist not found");

    // Prevent duplicates
    const { data: existing } = await supabase
      .from("playlist_tracks")
      .select("track_id")
      .eq("playlist_id", data.playlistId)
      .eq("track_id", data.trackId)
      .maybeSingle();
    if (existing) return { added: false, reason: "already-in-playlist" as const };

    const { data: last } = await supabase
      .from("playlist_tracks")
      .select("position")
      .eq("playlist_id", data.playlistId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPosition = (last?.position ?? -1) + 1;

    const { error } = await supabase.from("playlist_tracks").insert({
      playlist_id: data.playlistId,
      track_id: data.trackId,
      position: nextPosition,
    });
    if (error) throw error;
    return { added: true };
  });

export const removeTrackFromPlaylist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { playlistId: string; trackId: string }) => ({
    playlistId: String(data.playlistId),
    trackId: String(data.trackId),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: p } = await supabase
      .from("playlists")
      .select("id")
      .eq("id", data.playlistId)
      .eq("owner_id", userId)
      .maybeSingle();
    if (!p) throw new Error("Playlist not found");
    const { error } = await supabase
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", data.playlistId)
      .eq("track_id", data.trackId);
    if (error) throw error;
    return { removed: true };
  });

// ────────────────────────────────────────────────────────────
// Followed artists
// ────────────────────────────────────────────────────────────
export type FollowedArtist = {
  id: string;
  name: string;
  avatar_url: string | null;
  monthly_listeners: number;
  is_verified: boolean;
};

export const getFollowedArtists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FollowedArtist[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("follows")
      .select("artist_id, created_at, profiles!follows_artist_id_fkey(id, display_name, avatar_url, monthly_listeners, is_verified)")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? [])
      .map((row) => {
        const p = row.profiles as {
          id: string;
          display_name: string;
          avatar_url: string | null;
          monthly_listeners: number;
          is_verified: boolean;
        } | null;
        if (!p) return null;
        return {
          id: p.id,
          name: p.display_name,
          avatar_url: p.avatar_url,
          monthly_listeners: p.monthly_listeners ?? 0,
          is_verified: p.is_verified ?? false,
        };
      })
      .filter((a): a is FollowedArtist => Boolean(a));
  });

export const toggleFollowArtist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { artistId: string }) => ({ artistId: String(data.artistId) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("follows")
      .select("artist_id")
      .eq("follower_id", userId)
      .eq("artist_id", data.artistId)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", userId)
        .eq("artist_id", data.artistId);
      return { following: false };
    }
    await supabase.from("follows").insert({ follower_id: userId, artist_id: data.artistId });
    return { following: true };
  });

// ────────────────────────────────────────────────────────────
// Play history
// ────────────────────────────────────────────────────────────
export type HistoryEntry = LibraryTrack & { played_at: string };

export const getPlayHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { limit?: number } | undefined) => ({
    limit: Math.min(Math.max(data?.limit ?? 50, 1), 200),
  }))
  .handler(async ({ data, context }): Promise<HistoryEntry[]> => {
    const { supabase, userId } = context;
    const { data: plays, error } = await supabase
      .from("plays")
      .select(`played_at, tracks(${TRACK_COLUMNS})`)
      .eq("user_id", userId)
      .order("played_at", { ascending: false })
      .limit(data.limit);
    if (error) throw error;
    return (plays ?? [])
      .map((p) => {
        const t = p.tracks as LibraryTrack | null;
        if (!t) return null;
        return { ...t, played_at: p.played_at };
      })
      .filter((t): t is HistoryEntry => Boolean(t));
  });

export const clearPlayHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("plays")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ────────────────────────────────────────────────────────────
// Albums (derived: distinct album names across liked + played tracks)
// ────────────────────────────────────────────────────────────
export type AlbumSummary = {
  key: string; // artist_id + '|' + album name
  album: string;
  artist_id: string;
  artist_name: string;
  cover_url: string | null;
  track_count: number;
};

export const getYourAlbums = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AlbumSummary[]> => {
    const { supabase, userId } = context;
    const [likesRes, playsRes] = await Promise.all([
      supabase
        .from("likes")
        .select(`tracks(artist_id, artist_name, album, cover_url)`)
        .eq("user_id", userId),
      supabase
        .from("plays")
        .select(`tracks(artist_id, artist_name, album, cover_url)`)
        .eq("user_id", userId)
        .order("played_at", { ascending: false })
        .limit(200),
    ]);

    const byKey = new Map<string, AlbumSummary>();
    const collect = (rows: unknown[] | null) => {
      for (const row of rows ?? []) {
        const t = (row as { tracks: { artist_id: string; artist_name: string; album: string | null; cover_url: string | null } | null }).tracks;
        if (!t || !t.album) continue;
        const key = `${t.artist_id}|${t.album}`;
        const cur = byKey.get(key);
        if (cur) cur.track_count += 1;
        else
          byKey.set(key, {
            key,
            album: t.album,
            artist_id: t.artist_id,
            artist_name: t.artist_name,
            cover_url: t.cover_url,
            track_count: 1,
          });
      }
    };
    collect(likesRes.data as unknown[] | null);
    collect(playsRes.data as unknown[] | null);
    return Array.from(byKey.values()).sort((a, b) => b.track_count - a.track_count);
  });
