import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Server-enforced limits
export const UPLOAD_LIMITS = {
  audio: {
    maxBytes: 300 * 1024 * 1024, // 300 MB — room for full-quality MP3/WAV/FLAC
    minDurationSec: 5,
    maxDurationSec: 60 * 60, // up to 60 minutes
    allowedMime: [
      "audio/mpeg",
      "audio/mp3",
      "audio/mpeg3",
      "audio/x-mpeg-3",
      "audio/mpegurl",
      "audio/wav",
      "audio/x-wav",
      "audio/wave",
      "audio/vnd.wave",
      "audio/flac",
      "audio/x-flac",
      "audio/aac",
      "audio/aacp",
      "audio/mp4",
      "audio/x-m4a",
      "audio/m4a",
      "audio/ogg",
      "audio/vorbis",
      "audio/opus",
      "audio/webm",
    ],
  },
  cover: {
    maxBytes: 5 * 1024 * 1024, // 5 MB
    allowedMime: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
} as const;

const publishSchema = z.object({
  audioPath: z.string().min(1),
  coverPath: z.string().nullable().optional(),
  title: z.string().trim().min(1, "Title is required").max(120, "Title too long"),
  artistName: z.string().trim().min(1, "Artist name is required").max(120),
  album: z.string().trim().max(120).nullable().optional(),
  genre: z.string().trim().max(60).nullable().optional(),
  durationSeconds: z.number().int().nonnegative(),
});

type ObjInfo = { size: number; mimetype: string | null };

async function fetchObjectInfo(
  supabase: any,
  bucket: string,
  path: string,
  userId: string,
): Promise<ObjInfo | null> {
  const [ownerId, ...rest] = path.split("/");
  if (ownerId !== userId || rest.length === 0) return null;
  const filename = rest.join("/");
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(ownerId, { search: filename, limit: 100 });
  if (error || !data) return null;
  const match = data.find((o: { name: string }) => o.name === filename);
  if (!match) return null;
  const meta = (match.metadata ?? {}) as { size?: number; mimetype?: string };
  return { size: Number(meta.size ?? 0), mimetype: meta.mimetype ?? null };
}


async function removeObject(supabase: any, bucket: string, path: string) {
  try {
    await supabase.storage.from(bucket).remove([path]);
  } catch {
    // ignore cleanup errors
  }
}

export const publishTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => publishSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const audioInfo = await fetchObjectInfo(supabase, "audio", data.audioPath, userId);
    if (!audioInfo) {
      throw new Error("We couldn't find your audio upload. Please try again.");
    }

    if (audioInfo.size > UPLOAD_LIMITS.audio.maxBytes) {
      await removeObject(supabase, "audio", data.audioPath);
      throw new Error(
        `Audio file is too large (${(audioInfo.size / 1024 / 1024).toFixed(1)} MB). Max ${UPLOAD_LIMITS.audio.maxBytes / 1024 / 1024} MB.`,
      );
    }

    if (
      audioInfo.mimetype &&
      !UPLOAD_LIMITS.audio.allowedMime.includes(audioInfo.mimetype as (typeof UPLOAD_LIMITS.audio.allowedMime)[number])
    ) {
      await removeObject(supabase, "audio", data.audioPath);
      throw new Error(
        `Unsupported audio format "${audioInfo.mimetype}". Use MP3, WAV, FLAC, AAC, M4A or OGG.`,
      );
    }

    if (
      data.durationSeconds < UPLOAD_LIMITS.audio.minDurationSec ||
      data.durationSeconds > UPLOAD_LIMITS.audio.maxDurationSec
    ) {
      await removeObject(supabase, "audio", data.audioPath);
      if (data.coverPath) await removeObject(supabase, "covers", data.coverPath);
      throw new Error(
        `Track must be between ${UPLOAD_LIMITS.audio.minDurationSec}s and ${Math.floor(
          UPLOAD_LIMITS.audio.maxDurationSec / 60,
        )} minutes. Yours is ${data.durationSeconds}s.`,
      );
    }

    let coverUrl: string | null = null;
    if (data.coverPath) {
      const coverInfo = await fetchObjectInfo(supabase, "covers", data.coverPath, userId);
      if (!coverInfo) {
        throw new Error("We couldn't find your cover image upload.");
      }
      if (coverInfo.size > UPLOAD_LIMITS.cover.maxBytes) {
        await removeObject(supabase, "covers", data.coverPath);
        throw new Error(
          `Cover image is too large. Max ${UPLOAD_LIMITS.cover.maxBytes / 1024 / 1024} MB.`,
        );
      }
      if (
        coverInfo.mimetype &&
        !UPLOAD_LIMITS.cover.allowedMime.includes(coverInfo.mimetype as (typeof UPLOAD_LIMITS.cover.allowedMime)[number])
      ) {
        await removeObject(supabase, "covers", data.coverPath);
        throw new Error(
          `Unsupported cover format "${coverInfo.mimetype}". Use JPG, PNG, WEBP or GIF.`,
        );
      }
      const { data: cs } = await supabase.storage
        .from("covers")
        .createSignedUrl(data.coverPath, 60 * 60 * 24 * 365);
      coverUrl = cs?.signedUrl ?? null;
    }

    const { data: audioSigned, error: signErr } = await supabase.storage
      .from("audio")
      .createSignedUrl(data.audioPath, 60 * 60 * 24 * 365);
    if (signErr || !audioSigned?.signedUrl) {
      throw new Error("Failed to prepare the audio for playback.");
    }

    const { data: inserted, error: dbErr } = await supabase
      .from("tracks")
      .insert({
        artist_id: userId,
        title: data.title,
        artist_name: data.artistName,
        album: data.album ?? null,
        genre: data.genre ?? null,
        cover_url: coverUrl,
        audio_url: audioSigned.signedUrl,
        duration_seconds: data.durationSeconds,
        is_published: true,
      })
      .select("id")
      .single();
    if (dbErr) throw new Error(dbErr.message);

    return { id: inserted.id };
  });
