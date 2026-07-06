import type { Track } from "./mock-data";
import type { RecTrack } from "./recommendations.functions";

export function dbTrackToTrack(t: RecTrack): Track {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist_name,
    artistId: t.artist_id,
    cover: t.cover_url ?? "https://picsum.photos/seed/beatify/400",
    audio: t.audio_url,
    duration: t.duration_seconds,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isDbTrackId = (id: string) => UUID_RE.test(id);
