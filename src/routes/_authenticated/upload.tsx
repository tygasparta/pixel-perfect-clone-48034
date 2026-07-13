import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { publishTrack, UPLOAD_LIMITS } from "@/lib/uploads.functions";

export const Route = createFileRoute("/_authenticated/upload")({
  component: UploadPage,
});

const AUDIO_EXT = /\.(mp3|wav|flac|aac|m4a|ogg|oga|webm)$/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

function fmtMB(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

async function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const a = document.createElement("audio");
    a.preload = "metadata";
    const url = URL.createObjectURL(file);
    a.src = url;
    const done = (n: number) => {
      URL.revokeObjectURL(url);
      resolve(n);
    };
    a.onloadedmetadata = () => done(Math.floor(a.duration || 0));
    a.onerror = () => done(0);
  });
}

function validateAudioFile(file: File): string | null {
  if (file.size > UPLOAD_LIMITS.audio.maxBytes) {
    return `Audio must be under ${fmtMB(UPLOAD_LIMITS.audio.maxBytes)} (yours: ${fmtMB(file.size)}).`;
  }
  const okMime = !file.type || UPLOAD_LIMITS.audio.allowedMime.includes(file.type as (typeof UPLOAD_LIMITS.audio.allowedMime)[number]);
  const okExt = AUDIO_EXT.test(file.name);
  if (!okMime && !okExt) {
    return `Unsupported audio format. Use MP3, WAV, FLAC, AAC, M4A or OGG.`;
  }
  return null;
}

function validateCoverFile(file: File): string | null {
  if (file.size > UPLOAD_LIMITS.cover.maxBytes) {
    return `Cover must be under ${fmtMB(UPLOAD_LIMITS.cover.maxBytes)}.`;
  }
  const okMime = !file.type || UPLOAD_LIMITS.cover.allowedMime.includes(file.type as (typeof UPLOAD_LIMITS.cover.allowedMime)[number]);
  const okExt = IMAGE_EXT.test(file.name);
  if (!okMime && !okExt) return `Unsupported image format. Use JPG, PNG, WEBP or GIF.`;
  return null;
}

function UploadPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const publishFn = useServerFn(publishTrack);

  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [cover, setCover] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("");
  const [album, setAlbum] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).single();
      if (data && !artistName) setArtistName(data.display_name ?? "");
      return data;
    },
  });

  useEffect(() => {
    if (!file) {
      setDuration(0);
      return;
    }
    readAudioDuration(file).then(setDuration);
  }, [file]);

  const onPickAudio = (f: File | null) => {
    setErrors([]);
    if (!f) {
      setFile(null);
      return;
    }
    const err = validateAudioFile(f);
    if (err) {
      setErrors([err]);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFile(f);
  };

  const onPickCover = (f: File | null) => {
    setErrors([]);
    if (!f) {
      setCover(null);
      return;
    }
    const err = validateCoverFile(f);
    if (err) {
      setErrors([err]);
      setCover(null);
      if (coverRef.current) coverRef.current.value = "";
      return;
    }
    setCover(f);
  };

  const upload = useMutation({
    mutationFn: async () => {
      const errs: string[] = [];
      if (!file) errs.push("Select an audio file.");
      if (!title.trim()) errs.push("Song title is required.");
      if (!artistName.trim()) errs.push("Artist name is required.");
      if (file) {
        const fe = validateAudioFile(file);
        if (fe) errs.push(fe);
      }
      if (duration && duration < UPLOAD_LIMITS.audio.minDurationSec) {
        errs.push(`Track is too short (${duration}s). Minimum ${UPLOAD_LIMITS.audio.minDurationSec}s.`);
      }
      if (duration > UPLOAD_LIMITS.audio.maxDurationSec) {
        errs.push(`Track is too long. Maximum ${Math.floor(UPLOAD_LIMITS.audio.maxDurationSec / 60)} minutes.`);
      }
      if (errs.length) {
        setErrors(errs);
        throw new Error(errs[0]);
      }
      setErrors([]);

      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const uid = u.user.id;

      const audioPath = `${uid}/${crypto.randomUUID()}-${file!.name}`;
      const { error: aErr } = await supabase.storage.from("audio").upload(audioPath, file!, {
        contentType: file!.type || undefined,
        upsert: false,
      });
      if (aErr) throw new Error(aErr.message);

      let coverPath: string | null = null;
      if (cover) {
        coverPath = `${uid}/${crypto.randomUUID()}-${cover.name}`;
        const { error: cErr } = await supabase.storage.from("covers").upload(coverPath, cover, {
          contentType: cover.type || undefined,
          upsert: false,
        });
        if (cErr) {
          await supabase.storage.from("audio").remove([audioPath]);
          throw new Error(cErr.message);
        }
      }

      try {
        return await publishFn({
          data: {
            audioPath,
            coverPath,
            title: title.trim(),
            artistName: artistName.trim() || profile?.display_name || "Unknown",
            album: album.trim() || null,
            genre: genre.trim() || null,
            durationSeconds: duration,
          },
        });
      } catch (e) {
        // Server rejected — clean up any orphaned uploads best-effort.
        await supabase.storage.from("audio").remove([audioPath]).catch(() => {});
        if (coverPath) await supabase.storage.from("covers").remove([coverPath]).catch(() => {});
        throw e;
      }
    },
    onSuccess: () => {
      toast.success("Track uploaded — you're live!");
      qc.invalidateQueries({ queryKey: ["my-tracks"] });
      navigate({ to: "/library" });
    },
    onError: (e: Error) => {
      const msg = e.message || "Upload failed.";
      setErrors((prev) => (prev.length ? prev : [msg]));
      toast.error(msg);
    },
  });

  const audioLimitLabel = `MP3/WAV/FLAC/AAC/M4A/OGG · up to ${fmtMB(UPLOAD_LIMITS.audio.maxBytes)} · ${UPLOAD_LIMITS.audio.minDurationSec}s–${Math.floor(UPLOAD_LIMITS.audio.maxDurationSec / 60)}min`;

  return (
    <div className="mx-auto max-w-3xl px-5 pt-14 md:px-8 md:pt-10">
      <h1 className="mb-2 text-2xl font-bold">Upload Your Music</h1>
      <p className="mb-6 text-sm text-muted-foreground">Distribute your track worldwide from Beatify.</p>

      <div className="mb-4 flex gap-2 text-xs font-semibold">
        <Step n={1} label="Details" active />
        <Step n={2} label="Distribution" />
        <Step n={3} label="Publish" />
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        className="mb-2 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface/60 px-6 py-10 text-center hover:border-primary/60"
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-primary shadow-glow">
          <UploadCloud className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="text-sm font-medium">
          {file ? file.name : "Drag & drop your audio file here"}
        </div>
        {file && duration > 0 && (
          <div className="text-xs text-muted-foreground">
            {fmtMB(file.size)} · {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
          </div>
        )}
        <div className="text-xs text-muted-foreground">or</div>
        <span className="rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold">Choose File</span>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          hidden
          onChange={(e) => onPickAudio(e.target.files?.[0] ?? null)}
        />
      </button>
      <p className="mb-4 text-center text-[11px] text-muted-foreground">{audioLimitLabel}</p>

      {errors.length > 0 && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <div className="mb-1 flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            Please fix the following:
          </div>
          <ul className="list-inside list-disc space-y-0.5 text-xs">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <Field label="Song Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter song title"
          maxLength={120}
          className="w-full rounded-xl bg-surface px-4 py-3.5 text-sm outline-none ring-1 ring-border focus:ring-primary"
        />
      </Field>
      <Field label="Artist Name">
        <input
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          placeholder="Enter artist name"
          maxLength={120}
          className="w-full rounded-xl bg-surface px-4 py-3.5 text-sm outline-none ring-1 ring-border focus:ring-primary"
        />
      </Field>
      <Field label="Featured Artists">
        <input
          placeholder="Add featured artists"
          className="w-full rounded-xl bg-surface px-4 py-3.5 text-sm outline-none ring-1 ring-border focus:ring-primary"
        />
      </Field>
      <Field label="Genre">
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full rounded-xl bg-surface px-4 py-3.5 text-sm outline-none ring-1 ring-border focus:ring-primary"
        >
          <option value="">Select genre</option>
          <optgroup label="Zimbabwean">
            <option>Zimdancehall</option>
            <option>Sungura</option>
            <option>Chimurenga</option>
            <option>Museve</option>
            <option>Jiti</option>
            <option>Mbira</option>
            <option>Zim Hip-Hop</option>
            <option>Zim Gospel</option>
            <option>Urban Grooves</option>
            <option>Tuku Music</option>
            <option>Borrowdale</option>
          </optgroup>
          <optgroup label="African">
            <option>Afro-Pop</option>
            <option>Afrobeats</option>
            <option>Amapiano</option>
            <option>Gqom</option>
            <option>Kwaito</option>
            <option>Bongo Flava</option>
            <option>Kwassa Kwassa</option>
            <option>Soukous</option>
            <option>Highlife</option>
            <option>Kizomba</option>
            <option>Maskandi</option>
            <option>Mbaqanga</option>
          </optgroup>
          <optgroup label="Urban & Hip-Hop">
            <option>Hip-Hop</option>
            <option>Rap</option>
            <option>Trap</option>
            <option>R&B</option>
            <option>Soul</option>
            <option>Neo-Soul</option>
            <option>Drill</option>
            <option>Grime</option>
          </optgroup>
          <optgroup label="Electronic & Dance">
            <option>House</option>
            <option>Deep House</option>
            <option>Afro House</option>
            <option>Techno</option>
            <option>EDM</option>
            <option>Drum & Bass</option>
            <option>Dubstep</option>
            <option>Garage</option>
            <option>Trance</option>
          </optgroup>
          <optgroup label="Caribbean & Latin">
            <option>Dancehall</option>
            <option>Reggae</option>
            <option>Roots Reggae</option>
            <option>Soca</option>
            <option>Reggaeton</option>
            <option>Latin Pop</option>
            <option>Salsa</option>
            <option>Bachata</option>
          </optgroup>
          <optgroup label="Pop, Rock & Alternative">
            <option>Pop</option>
            <option>Rock</option>
            <option>Alternative</option>
            <option>Indie</option>
            <option>Metal</option>
            <option>Punk</option>
            <option>Folk</option>
            <option>Country</option>
          </optgroup>
          <optgroup label="Gospel & Spiritual">
            <option>Gospel</option>
            <option>Contemporary Gospel</option>
            <option>Worship</option>
            <option>Christian</option>
          </optgroup>
          <optgroup label="Jazz, Classical & Other">
            <option>Jazz</option>
            <option>Afro-Jazz</option>
            <option>Blues</option>
            <option>Classical</option>
            <option>Instrumental</option>
            <option>Lo-fi</option>
            <option>Ambient</option>
            <option>Spoken Word</option>
            <option>Podcast</option>
            <option>Other</option>
          </optgroup>
        </select>
      </Field>
      <Field label="Album (optional)">
        <input
          value={album}
          onChange={(e) => setAlbum(e.target.value)}
          placeholder="Enter album name"
          maxLength={120}
          className="w-full rounded-xl bg-surface px-4 py-3.5 text-sm outline-none ring-1 ring-border focus:ring-primary"
        />
      </Field>
      <Field label="Cover Art">
        <button
          onClick={() => coverRef.current?.click()}
          className="w-full rounded-xl bg-surface px-4 py-3.5 text-left text-sm ring-1 ring-border hover:bg-surface-2"
        >
          {cover ? cover.name : "Upload cover image"}
        </button>
        <p className="mt-1 text-[11px] text-muted-foreground">
          JPG/PNG/WEBP · up to {fmtMB(UPLOAD_LIMITS.cover.maxBytes)}
        </p>
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => onPickCover(e.target.files?.[0] ?? null)}
        />
      </Field>

      <div className="mt-6 flex gap-2">
        <button className="flex-1 rounded-xl bg-surface py-3.5 text-sm font-semibold ring-1 ring-border">
          Save Draft
        </button>
        <button
          onClick={() => upload.mutate()}
          disabled={upload.isPending}
          className="flex-1 rounded-xl bg-gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {upload.isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Publish"}
        </button>
      </div>
    </div>
  );
}

function Step({ n, label, active }: { n: number; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${active ? "bg-primary/15 text-primary" : "bg-surface text-muted-foreground"}`}>
      <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${active ? "bg-primary text-primary-foreground" : "bg-white/10"}`}>{n}</span>
      {label}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
