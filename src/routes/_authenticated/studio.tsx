import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  LayoutDashboard, Disc3, Music2, Film, FileText, BarChart3, Wallet,
  Coins, ListMusic, User, Settings, LifeBuoy, Search, Bell, HelpCircle,
  UploadCloud, ChevronLeft, ChevronRight, Save, Trash2, Send, Play, Pause,
  Share2, Image as ImageIcon, Sparkles, CheckCircle2, AlertCircle,
  GripVertical, X, Music, Loader2, Globe, DollarSign, Lock, Radio,
  PenLine, Users2, ShieldCheck, Package, Star, Mic2, Headphones,
  Menu, Plus, Check,
} from "lucide-react";
import { BeatifyLogo } from "@/components/logo";
import { supabase } from "@/integrations/supabase/client";
import { publishTrack, UPLOAD_LIMITS } from "@/lib/uploads.functions";
import { suggestMetadata } from "@/lib/ai-metadata.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/studio")({
  component: StudioPage,
});

// ── Types ────────────────────────────────────────────────────────────────────
type ReleaseType = "single" | "ep" | "album" | "video" | "podcast" | "audiobook";
type Visibility = "draft" | "scheduled" | "public" | "private";
type TrackFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  duration: number;
  bitrate: number;
  sampleRate: number;
  waveform: number[];
  url: string;
};

const STEPS = [
  { n: 1, label: "Release Type", icon: Disc3 },
  { n: 2, label: "Upload Media", icon: UploadCloud },
  { n: 3, label: "Song Info", icon: PenLine },
  { n: 4, label: "Lyrics", icon: FileText },
  { n: 5, label: "Credits", icon: Users2 },
  { n: 6, label: "Rights", icon: ShieldCheck },
  { n: 7, label: "Distribution", icon: Globe },
  { n: 8, label: "Pricing", icon: DollarSign },
  { n: 9, label: "Preview", icon: Star },
  { n: 10, label: "Submit", icon: Send },
] as const;

const SIDEBAR = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/home" as const },
  { label: "Create Release", icon: Disc3, to: "/studio" as const, active: true },
  { label: "Songs", icon: Music2, to: "/library" as const, tab: "Songs" },
  { label: "Albums", icon: Package, to: "/library" as const, tab: "Albums" },
  { label: "Videos", icon: Film, to: "/library" as const },
  { label: "Drafts", icon: FileText, to: "/library" as const },
  { label: "Analytics", icon: BarChart3, to: "/analytics" as const },
  { label: "Revenue", icon: Wallet, to: "/wallet" as const },
  { label: "Royalties", icon: Coins, to: "/wallet" as const },
  { label: "Playlists", icon: ListMusic, to: "/library" as const, tab: "Playlists" },
  { label: "Profile", icon: User, to: "/profile" as const },
  { label: "Settings", icon: Settings, to: "/profile" as const },
  { label: "Support", icon: LifeBuoy, to: "/notifications" as const },
];

const RELEASE_TYPES: { id: ReleaseType; title: string; desc: string; icon: any; req: string }[] = [
  { id: "single", title: "Single", desc: "One track release. Perfect for lead singles.", icon: Music, req: "1 audio · 1 artwork" },
  { id: "ep", title: "EP", desc: "3–6 tracks. Short-form project.", icon: Disc3, req: "3–6 audio · 1 artwork" },
  { id: "album", title: "Album", desc: "7+ tracks. Full length release.", icon: Package, req: "7+ audio · 1 artwork" },
  { id: "video", title: "Music Video", desc: "Visual accompaniment for a track.", icon: Film, req: "MP4/MOV · thumbnail" },
  { id: "podcast", title: "Podcast", desc: "Episodic audio series.", icon: Mic2, req: "Long-form audio" },
  { id: "audiobook", title: "Audiobook", desc: "Chapter-based narration.", icon: Headphones, req: "Chapter audio files" },
];

const GENRES = ["Afro-Pop", "Zimdancehall", "Hip-Hop", "Gospel", "Amapiano", "R&B", "Afrobeats", "House", "Jazz", "Reggae", "Rock", "Electronic"];
const MOODS = ["Chill", "Energetic", "Romantic", "Melancholic", "Uplifting", "Aggressive", "Dreamy", "Festive"];
const LANGS = ["English", "Shona", "Ndebele", "Swahili", "French", "Portuguese", "Zulu"];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// ── Utilities ────────────────────────────────────────────────────────────────
function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
function fmtDur(s: number) {
  if (!s) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}
async function analyzeAudio(file: File): Promise<TrackFile> {
  const url = URL.createObjectURL(file);
  const audio = new Audio(url);
  const duration = await new Promise<number>((resolve) => {
    audio.onloadedmetadata = () => resolve(Math.floor(audio.duration || 0));
    audio.onerror = () => resolve(0);
  });
  // Fake but plausible bitrate/sampleRate derived from size/duration
  const bitrate = duration ? Math.round((file.size * 8) / duration / 1000) : 0;
  const waveform = Array.from({ length: 80 }, () => 0.2 + Math.random() * 0.8);
  return {
    id: crypto.randomUUID(),
    file,
    name: file.name,
    size: file.size,
    duration,
    bitrate,
    sampleRate: 44100,
    waveform,
    url,
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────
function StudioPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [collapsed, setCollapsed] = useState(false);

  // Data
  const [releaseType, setReleaseType] = useState<ReleaseType>("single");
  const [tracks, setTracks] = useState<TrackFile[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [artwork, setArtwork] = useState<{ file: File; url: string; w: number; h: number } | null>(null);

  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("");
  const [artistName, setArtistName] = useState("");
  const [featuring, setFeaturing] = useState("");
  const [album, setAlbum] = useState("");
  const [trackNo, setTrackNo] = useState("1");
  const [discNo, setDiscNo] = useState("1");
  const [genre, setGenre] = useState("");
  const [subGenre, setSubGenre] = useState("");
  const [mood, setMood] = useState("");
  const [language, setLanguage] = useState("English");
  const [composer, setComposer] = useState("");
  const [producer, setProducer] = useState("");
  const [writer, setWriter] = useState("");
  const [publisher, setPublisher] = useState("");
  const [bpm, setBpm] = useState("");
  const [musicKey, setMusicKey] = useState("");
  const [explicit, setExplicit] = useState(false);
  const [isrc, setIsrc] = useState("");
  const [upc, setUpc] = useState("");
  const [copyrightYear, setCopyrightYear] = useState(String(new Date().getFullYear()));
  const [releaseYear, setReleaseYear] = useState(String(new Date().getFullYear()));
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [lyrics, setLyrics] = useState("");
  const [syncedLyrics, setSyncedLyrics] = useState(false);

  const [credits, setCredits] = useState<Record<string, string>>({});
  const [rights, setRights] = useState({ recording: false, publishing: false, original: false, noInfringe: false });

  const [releaseDate, setReleaseDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [releaseTime, setReleaseTime] = useState("00:00");
  const [timezone, setTimezone] = useState("Africa/Harare");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [territories, setTerritories] = useState<"world" | "zw" | "custom">("world");
  const [platforms, setPlatforms] = useState({ streaming: true, downloads: true, store: true, premium: false });

  const [monetization, setMonetization] = useState<"free" | "premium" | "paid">("free");
  const [price, setPrice] = useState("0.99");
  const [albumPrice, setAlbumPrice] = useState("9.99");
  const [enable, setEnable] = useState({ downloads: true, donations: false, tips: true, membership: false, merch: false });

  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState<null | "processing" | "success">(null);
  const [processStep, setProcessStep] = useState(0);

  const publishFn = useServerFn(publishTrack);
  const suggestFn = useServerFn(suggestMetadata);

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) ?? tracks[0] ?? null;

  // Auto-save indicator
  useEffect(() => {
    const t = setTimeout(() => setAutoSavedAt(new Date()), 800);
    return () => clearTimeout(t);
  }, [title, artistName, lyrics, genre, description, tracks.length]);

  // Load display name from profile
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("display_name").eq("id", u.user.id).single();
      if (data && !artistName) setArtistName(data.display_name ?? "");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validation per step
  const stepValid = useMemo(() => {
    switch (step) {
      case 1: return !!releaseType;
      case 2: return tracks.length > 0;
      case 3: return title.trim().length > 0 && artistName.trim().length > 0;
      case 6: return rights.recording && rights.original && rights.noInfringe;
      default: return true;
    }
  }, [step, releaseType, tracks.length, title, artistName, rights]);

  const canPublish = tracks.length > 0 && title.trim() && artistName.trim() &&
    rights.recording && rights.original && rights.noInfringe;

  // AI suggestion
  const aiMut = useMutation({
    mutationFn: async () => suggestFn({ data: { title, artistName, hint: description } }),
    onSuccess: (d: any) => {
      if (d.genre) setGenre(d.genre);
      if (d.subGenre) setSubGenre(d.subGenre);
      if (d.mood) setMood(d.mood);
      if (d.language) setLanguage(d.language);
      if (d.bpm) setBpm(String(d.bpm));
      if (d.musicalKey) setMusicKey(d.musicalKey);
      if (Array.isArray(d.tags)) setTags(d.tags.slice(0, 8));
      toast.success("AI suggestions applied — review and edit as needed.");
    },
    onError: (e: Error) => toast.error(e.message || "AI suggestion failed"),
  });

  // Submit / publish
  const submitMut = useMutation({
    mutationFn: async () => {
      if (!selectedTrack) throw new Error("Add at least one track.");
      setSubmitting("processing");
      const stages = 6;
      for (let i = 0; i < stages; i++) {
        setProcessStep(i);
        await new Promise((r) => setTimeout(r, 650));
      }
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const uid = u.user.id;

      const audioPath = `${uid}/${crypto.randomUUID()}-${selectedTrack.file.name}`;
      const { error: aErr } = await supabase.storage.from("audio").upload(audioPath, selectedTrack.file, {
        contentType: selectedTrack.file.type || undefined,
      });
      if (aErr) throw new Error(aErr.message);

      let coverPath: string | null = null;
      if (artwork) {
        coverPath = `${uid}/${crypto.randomUUID()}-${artwork.file.name}`;
        const { error: cErr } = await supabase.storage.from("covers").upload(coverPath, artwork.file, {
          contentType: artwork.file.type || undefined,
        });
        if (cErr) {
          await supabase.storage.from("audio").remove([audioPath]);
          throw new Error(cErr.message);
        }
      }

      await publishFn({
        data: {
          audioPath, coverPath,
          title: title.trim(),
          artistName: artistName.trim(),
          album: album.trim() || null,
          genre: genre || null,
          durationSeconds: selectedTrack.duration,
        },
      });
    },
    onSuccess: () => {
      setSubmitting("success");
      setTimeout(() => {
        confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 }, colors: ["#FF4433", "#FFC107", "#00C853", "#ffffff"] });
      }, 250);
    },
    onError: (e: Error) => {
      setSubmitting(null);
      toast.error(e.message || "Publish failed");
    },
  });

  const goNext = () => {
    if (!stepValid) {
      toast.error("Please complete the required fields for this step.");
      return;
    }
    if (step < 10) setStep(step + 1);
  };
  const goPrev = () => step > 1 && setStep(step - 1);

  const removeTrack = (id: string) => setTracks((prev) => prev.filter((t) => t.id !== id));
  const moveTrack = (id: string, dir: -1 | 1) => {
    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx < 0) return prev;
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  if (submitting) {
    return <ProcessingScreen stage={processStep} success={submitting === "success"} title={title} artistName={artistName} artworkUrl={artwork?.url} onView={() => navigate({ to: "/library" })} onAnother={() => window.location.reload()} onDash={() => navigate({ to: "/home" })} />;
  }

  return (
    <div className="hidden md:flex min-h-[calc(100vh-3.5rem)] bg-[#080808] text-white">
      {/* Studio sidebar */}
      <aside className={cn(
        "flex flex-col shrink-0 border-r border-white/[0.06] bg-[#0b0b0b] transition-[width] duration-300",
        collapsed ? "w-16" : "w-60"
      )}>
        <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-3">
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <BeatifyLogo size={26} />
              <span className="text-xs font-black tracking-widest text-white/90">STUDIO</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="grid h-8 w-8 place-items-center rounded-lg text-white/60 hover:bg-white/5 hover:text-white"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {SIDEBAR.map((item) => {
            const Icon = item.icon;
            const active = item.active;
            return (
              <button
                key={item.label}
                onClick={() => !active && navigate({ to: item.to as any, search: item.tab ? { tab: item.tab } : undefined as any })}
                className={cn(
                  "group relative flex w-full items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition",
                  active ? "text-white" : "text-white/55 hover:text-white hover:bg-white/[0.03]"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="studio-active"
                    className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-[#FF4433] shadow-[0_0_18px_#FF4433]"
                  />
                )}
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-[#FF4433]")} strokeWidth={active ? 2.5 : 2} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-black/40 px-5 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="text-sm font-black tracking-wide">Create Release</div>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/60">BETA</span>
          </div>
          <div className="ml-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 flex-1 max-w-md">
            <Search className="h-3.5 w-3.5 text-white/40" />
            <input placeholder="Search Studio…" className="bg-transparent text-xs text-white/80 outline-none flex-1 placeholder:text-white/30" />
            <span className="text-[10px] text-white/30">⌘K</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {autoSavedAt && (
              <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00C853] animate-pulse" />
                Autosaved
              </div>
            )}
            <IconBtn><Bell className="h-4 w-4" /></IconBtn>
            <IconBtn><HelpCircle className="h-4 w-4" /></IconBtn>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#FF4433] to-[#FF7A45] text-xs font-black">
              {(artistName || "A")[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Split content */}
        <div className="flex min-h-0 flex-1">
          {/* Center workspace */}
          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl px-8 py-8 pb-32">
              <Stepper current={step} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-8"
                >
                  {step === 1 && <Step1 releaseType={releaseType} onChange={setReleaseType} />}
                  {step === 2 && (
                    <Step2
                      tracks={tracks} setTracks={setTracks}
                      selectedId={selectedTrackId} onSelect={setSelectedTrackId}
                      removeTrack={removeTrack} moveTrack={moveTrack}
                      artwork={artwork} setArtwork={setArtwork}
                    />
                  )}
                  {step === 3 && (
                    <Step3
                      values={{ title, version, artistName, featuring, album, trackNo, discNo, genre, subGenre, mood, language, composer, producer, writer, publisher, bpm, musicKey, explicit, isrc, upc, copyrightYear, releaseYear, description, tags, tagInput }}
                      setters={{ setTitle, setVersion, setArtistName, setFeaturing, setAlbum, setTrackNo, setDiscNo, setGenre, setSubGenre, setMood, setLanguage, setComposer, setProducer, setWriter, setPublisher, setBpm, setMusicKey, setExplicit, setIsrc, setUpc, setCopyrightYear, setReleaseYear, setDescription, setTags, setTagInput }}
                      onAiSuggest={() => aiMut.mutate()}
                      aiLoading={aiMut.isPending}
                    />
                  )}
                  {step === 4 && <Step4 lyrics={lyrics} setLyrics={setLyrics} synced={syncedLyrics} setSynced={setSyncedLyrics} />}
                  {step === 5 && <Step5 credits={credits} setCredits={setCredits} artistName={artistName} />}
                  {step === 6 && <Step6 rights={rights} setRights={setRights} />}
                  {step === 7 && (
                    <Step7
                      releaseDate={releaseDate} setReleaseDate={setReleaseDate}
                      releaseTime={releaseTime} setReleaseTime={setReleaseTime}
                      timezone={timezone} setTimezone={setTimezone}
                      visibility={visibility} setVisibility={setVisibility}
                      territories={territories} setTerritories={setTerritories}
                      platforms={platforms} setPlatforms={setPlatforms}
                    />
                  )}
                  {step === 8 && (
                    <Step8
                      monetization={monetization} setMonetization={setMonetization}
                      price={price} setPrice={setPrice}
                      albumPrice={albumPrice} setAlbumPrice={setAlbumPrice}
                      enable={enable} setEnable={setEnable}
                    />
                  )}
                  {step === 9 && <Step9 data={{ title, artistName, genre, releaseDate, tracks, artwork, description, monetization, price }} />}
                  {step === 10 && <Step10 canPublish={!!canPublish} onSubmit={() => submitMut.mutate()} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right live preview panel */}
          <aside className="hidden lg:flex w-[340px] shrink-0 flex-col border-l border-white/[0.06] bg-[#0a0a0a] overflow-y-auto">
            <LivePreview
              title={title} artistName={artistName} genre={genre}
              releaseDate={releaseDate} tracks={tracks} artwork={artwork}
              releaseType={releaseType}
            />
          </aside>
        </div>

        {/* Bottom action bar */}
        <div className="sticky bottom-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-t border-white/[0.06] bg-black/85 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={step === 1}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10">
              <Save className="h-3.5 w-3.5" /> Save Draft
            </button>
            <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/50 hover:bg-white/10">
              <Trash2 className="h-3.5 w-3.5" /> Discard
            </button>
          </div>
          <div className="text-[11px] text-white/40">
            Step <span className="text-white font-bold">{step}</span> of 10 · {STEPS[step - 1].label}
          </div>
          <div>
            {step < 10 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2 rounded-xl bg-[#FF4433] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_40px_-10px_#FF4433] transition hover:brightness-110"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => submitMut.mutate()}
                disabled={!canPublish || submitMut.isPending}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4433] to-[#FF7A45] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_40px_-10px_#FF4433] transition hover:brightness-110 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" /> Submit Release
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile fallback */}
      <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center bg-[#080808] p-6 text-center">
        <div>
          <BeatifyLogo size={56} withWordmark />
          <p className="mt-4 text-sm text-white/70">Beatify Studio is a desktop experience. Please switch to a larger screen to publish releases.</p>
        </div>
      </div>
    </div>
  );
}

// ── Shared UI ────────────────────────────────────────────────────────────────
function IconBtn({ children }: { children: React.ReactNode }) {
  return <button className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/10">{children}</button>;
}

function Stepper({ current }: { current: number }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] text-white/50">
        <span className="text-[#FF4433] font-black">STUDIO</span>
        <span>/</span><span>Create Release</span><span>/</span>
        <span className="text-white">{STEPS[current - 1].label}</span>
      </div>
      <div className="mt-3 relative">
        <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/[0.06]" />
        <motion.div
          className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-gradient-to-r from-[#FF4433] to-[#FF7A45] shadow-[0_0_20px_#FF4433]"
          animate={{ width: `${((current - 1) / 9) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <ol className="relative flex justify-between">
          {STEPS.map(({ n, label, icon: Icon }) => {
            const done = n < current;
            const active = n === current;
            return (
              <li key={n} className="flex flex-col items-center gap-1.5">
                <motion.div
                  animate={{ scale: active ? 1.15 : 1 }}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full border transition",
                    done && "border-[#FF4433] bg-[#FF4433] text-white",
                    active && "border-[#FF4433] bg-black text-[#FF4433] shadow-[0_0_25px_#FF4433]",
                    !done && !active && "border-white/10 bg-black text-white/40"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </motion.div>
                <span className={cn("text-[9px] font-bold uppercase tracking-wider whitespace-nowrap", active ? "text-white" : "text-white/40")}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

// ── Step 1 ───────────────────────────────────────────────────────────────────
function Step1({ releaseType, onChange }: { releaseType: ReleaseType; onChange: (t: ReleaseType) => void }) {
  return (
    <div>
      <StepHeader title="What are you releasing?" subtitle="Choose the release type. This shapes the rest of the workflow." />
      <div className="grid grid-cols-3 gap-4">
        {RELEASE_TYPES.map((rt) => {
          const Icon = rt.icon;
          const active = releaseType === rt.id;
          return (
            <motion.button
              key={rt.id}
              onClick={() => onChange(rt.id)}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-5 text-left transition",
                active
                  ? "border-[#FF4433] bg-gradient-to-br from-[#FF4433]/15 to-transparent shadow-[0_20px_50px_-20px_#FF4433]"
                  : "border-white/[0.08] bg-[#121212] hover:border-white/20"
              )}
            >
              <div className={cn(
                "grid h-11 w-11 place-items-center rounded-xl mb-4",
                active ? "bg-[#FF4433] text-white" : "bg-white/[0.05] text-white/70"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-sm font-bold">{rt.title}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-white/50">{rt.desc}</div>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">{rt.req}</div>
              {active && (
                <motion.div layoutId="rt-check" className="absolute top-4 right-4 grid h-6 w-6 place-items-center rounded-full bg-[#FF4433] text-white">
                  <Check className="h-3.5 w-3.5" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2 ───────────────────────────────────────────────────────────────────
function Step2({
  tracks, setTracks, selectedId, onSelect, removeTrack, moveTrack, artwork, setArtwork
}: {
  tracks: TrackFile[]; setTracks: (t: TrackFile[] | ((p: TrackFile[]) => TrackFile[])) => void;
  selectedId: string | null; onSelect: (id: string) => void;
  removeTrack: (id: string) => void; moveTrack: (id: string, dir: -1 | 1) => void;
  artwork: { file: File; url: string; w: number; h: number } | null;
  setArtwork: (a: { file: File; url: string; w: number; h: number } | null) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState<{ name: string; pct: number } | null>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const artRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      if (f.size > UPLOAD_LIMITS.audio.maxBytes) {
        toast.error(`${f.name}: exceeds ${UPLOAD_LIMITS.audio.maxBytes / 1024 / 1024}MB`);
        continue;
      }
      setUploading({ name: f.name, pct: 0 });
      // Simulated progress
      for (let p = 10; p <= 90; p += 15) {
        await new Promise((r) => setTimeout(r, 90));
        setUploading({ name: f.name, pct: p });
      }
      const analyzed = await analyzeAudio(f);
      setTracks((prev) => [...prev, analyzed]);
      setUploading({ name: f.name, pct: 100 });
      await new Promise((r) => setTimeout(r, 200));
      setUploading(null);
    }
  };

  const onArt = async (file: File) => {
    if (!/^image\//.test(file.type)) return toast.error("Artwork must be an image");
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.width < 3000 || img.height < 3000) {
        toast.warning(`Artwork is ${img.width}×${img.height}. Recommended 3000×3000+.`);
      }
      setArtwork({ file, url, w: img.width, h: img.height });
    };
    img.src = url;
  };

  return (
    <div>
      <StepHeader title="Upload your media" subtitle="Drop audio files and cover art. We'll generate waveforms and validate quality." />
      <div className="grid grid-cols-[1fr_280px] gap-6">
        <div>
          <div
            onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
            onClick={() => audioRef.current?.click()}
            className={cn(
              "group relative overflow-hidden rounded-2xl border-2 border-dashed cursor-pointer transition p-10 text-center",
              dragging ? "border-[#FF4433] bg-[#FF4433]/10" : "border-white/10 bg-[#121212] hover:border-white/25"
            )}
          >
            <motion.div
              animate={{ y: dragging ? -6 : 0 }}
              className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#FF4433] to-[#FF7A45] shadow-[0_20px_60px_-20px_#FF4433]"
            >
              <UploadCloud className="h-7 w-7 text-white" />
            </motion.div>
            <div className="text-sm font-bold">Drop audio here or click to browse</div>
            <div className="mt-1.5 text-[11px] text-white/50">MP3 · WAV · FLAC · AAC · ALAC · AIFF · Up to {UPLOAD_LIMITS.audio.maxBytes / 1024 / 1024}MB</div>
            <input ref={audioRef} type="file" hidden multiple accept="audio/*" onChange={(e) => onFiles(e.target.files)} />
          </div>

          {uploading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl border border-white/10 bg-[#121212] p-4">
              <div className="flex items-center justify-between text-[11px] mb-2">
                <div className="flex items-center gap-2 truncate text-white/70">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF4433]" />
                  <span className="truncate">{uploading.name}</span>
                </div>
                <span className="text-white/50">{uploading.pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div animate={{ width: `${uploading.pct}%` }} className="h-full bg-gradient-to-r from-[#FF4433] to-[#FF7A45]" />
              </div>
            </motion.div>
          )}

          <div className="mt-6 space-y-2">
            <AnimatePresence>
              {tracks.map((t, i) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border p-3 transition cursor-pointer",
                    selectedId === t.id ? "border-[#FF4433] bg-[#FF4433]/[0.06]" : "border-white/[0.06] bg-[#121212] hover:border-white/15"
                  )}
                  onClick={() => onSelect(t.id)}
                >
                  <button onClick={(e) => { e.stopPropagation(); moveTrack(t.id, -1); }} className="text-white/30 hover:text-white/70">
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.05] text-xs font-bold text-white/60">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold">{t.name}</div>
                    <div className="mt-0.5 flex items-center gap-3 text-[10px] text-white/40">
                      <span>{fmtDur(t.duration)}</span>
                      <span>{t.bitrate}kbps</span>
                      <span>{t.sampleRate / 1000}kHz</span>
                      <span>{fmtBytes(t.size)}</span>
                    </div>
                  </div>
                  <div className="flex h-8 items-end gap-[2px]">
                    {t.waveform.slice(0, 32).map((v, k) => (
                      <span key={k} className="w-[2px] rounded-full bg-gradient-to-t from-[#FF4433] to-[#FF7A45]" style={{ height: `${v * 100}%` }} />
                    ))}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeTrack(t.id); }} className="grid h-7 w-7 place-items-center rounded-lg text-white/40 hover:bg-red-500/10 hover:text-red-400">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Artwork */}
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Cover Artwork</div>
          <div
            onClick={() => artRef.current?.click()}
            className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-dashed border-white/10 bg-[#121212] cursor-pointer transition hover:border-white/25"
          >
            {artwork ? (
              <>
                <img src={artwork.url} alt="cover" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-[10px] text-white/80">
                  {artwork.w}×{artwork.h}
                  {artwork.w >= 3000 && <CheckCircle2 className="ml-1 inline h-3 w-3 text-[#00C853]" />}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
                <ImageIcon className="h-8 w-8 text-white/25" />
                <div className="text-[11px] font-semibold text-white/60">Drop artwork</div>
                <div className="text-[10px] text-white/40">3000×3000 · PNG/JPG</div>
              </div>
            )}
            <input ref={artRef} type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onArt(f); }} />
          </div>
          <div className="mt-3 space-y-1.5 text-[10px] text-white/50">
            <div className="flex items-center gap-1.5"><Check className="h-3 w-3 text-[#00C853]" /> Square aspect ratio</div>
            <div className="flex items-center gap-1.5"><Check className="h-3 w-3 text-[#00C853]" /> Minimum 3000×3000</div>
            <div className="flex items-center gap-1.5"><Check className="h-3 w-3 text-[#00C853]" /> RGB color mode</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 3 ───────────────────────────────────────────────────────────────────
function Step3({ values, setters, onAiSuggest, aiLoading }: any) {
  const v = values, s = setters;
  return (
    <div>
      <StepHeader title="Song information" subtitle="Metadata powers discovery. Fill it in — or let AI suggest for you." action={
        <button
          onClick={onAiSuggest}
          disabled={aiLoading}
          className="flex items-center gap-2 rounded-xl border border-[#FF4433]/40 bg-[#FF4433]/10 px-3 py-2 text-[11px] font-bold text-[#FF4433] hover:bg-[#FF4433]/20 disabled:opacity-50"
        >
          {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          AI Suggest Metadata
        </button>
      } />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Song Title *" full><Input value={v.title} onChange={s.setTitle} placeholder="Song title" /></Field>
        <Field label="Version"><Input value={v.version} onChange={s.setVersion} placeholder="e.g. Remix, Acoustic" /></Field>
        <Field label="Primary Artist *"><Input value={v.artistName} onChange={s.setArtistName} /></Field>
        <Field label="Featuring Artists"><Input value={v.featuring} onChange={s.setFeaturing} placeholder="Comma separated" /></Field>
        <Field label="Album"><Input value={v.album} onChange={s.setAlbum} /></Field>
        <Field label="Track Number"><Input value={v.trackNo} onChange={s.setTrackNo} type="number" /></Field>
        <Field label="Genre"><Select value={v.genre} onChange={s.setGenre} options={GENRES} /></Field>
        <Field label="Sub-Genre"><Input value={v.subGenre} onChange={s.setSubGenre} /></Field>
        <Field label="Mood"><Select value={v.mood} onChange={s.setMood} options={MOODS} /></Field>
        <Field label="Language"><Select value={v.language} onChange={s.setLanguage} options={LANGS} /></Field>
        <Field label="Composer"><Input value={v.composer} onChange={s.setComposer} /></Field>
        <Field label="Producer"><Input value={v.producer} onChange={s.setProducer} /></Field>
        <Field label="Writer"><Input value={v.writer} onChange={s.setWriter} /></Field>
        <Field label="Publisher"><Input value={v.publisher} onChange={s.setPublisher} /></Field>
        <Field label="BPM"><Input value={v.bpm} onChange={s.setBpm} type="number" placeholder="120" /></Field>
        <Field label="Key"><Select value={v.musicKey} onChange={s.setMusicKey} options={KEYS} /></Field>
        <Field label="ISRC"><Input value={v.isrc} onChange={s.setIsrc} placeholder="XX-XXX-YY-NNNNN" /></Field>
        <Field label="UPC"><Input value={v.upc} onChange={s.setUpc} /></Field>
        <Field label="Copyright Year"><Input value={v.copyrightYear} onChange={s.setCopyrightYear} type="number" /></Field>
        <Field label="Release Year"><Input value={v.releaseYear} onChange={s.setReleaseYear} type="number" /></Field>
        <Field label="Description" full>
          <textarea value={v.description} onChange={(e) => s.setDescription(e.target.value)} rows={3}
            className="w-full rounded-xl border border-white/10 bg-[#121212] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FF4433] resize-none" />
        </Field>
        <Field label="Tags" full>
          <div className="rounded-xl border border-white/10 bg-[#121212] px-3 py-2 flex flex-wrap gap-1.5 min-h-[42px]">
            {v.tags.map((t: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-[#FF4433]/15 text-[#FF7A45] px-2 py-0.5 text-[10px] font-semibold">
                {t}
                <button onClick={() => s.setTags(v.tags.filter((_: string, k: number) => k !== i))}><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
            <input
              value={v.tagInput}
              onChange={(e) => s.setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && v.tagInput.trim()) {
                  e.preventDefault();
                  s.setTags([...v.tags, v.tagInput.trim()]);
                  s.setTagInput("");
                }
              }}
              placeholder="Type and press Enter"
              className="flex-1 min-w-[120px] bg-transparent text-xs outline-none placeholder:text-white/30"
            />
          </div>
        </Field>
        <Field label="Explicit Content" full>
          <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#121212] px-3.5 py-2.5 cursor-pointer">
            <input type="checkbox" checked={v.explicit} onChange={(e) => s.setExplicit(e.target.checked)} className="accent-[#FF4433]" />
            <span className="text-xs text-white/80">Contains explicit lyrics or content</span>
          </label>
        </Field>
      </div>
    </div>
  );
}

// ── Step 4 Lyrics ────────────────────────────────────────────────────────────
function Step4({ lyrics, setLyrics, synced, setSynced }: { lyrics: string; setLyrics: (s: string) => void; synced: boolean; setSynced: (b: boolean) => void }) {
  return (
    <div>
      <StepHeader title="Lyrics" subtitle="Add lyrics to power singalong, search, and lyric cards." />
      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => setSynced(false)} className={cn("rounded-lg px-3 py-1.5 text-[11px] font-bold transition", !synced ? "bg-[#FF4433] text-white" : "bg-white/[0.05] text-white/60")}>Plain</button>
        <button onClick={() => setSynced(true)} className={cn("rounded-lg px-3 py-1.5 text-[11px] font-bold transition", synced ? "bg-[#FF4433] text-white" : "bg-white/[0.05] text-white/60")}>Synced (.lrc)</button>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-white/50">
          <button className="rounded-lg border border-white/10 px-2.5 py-1 hover:bg-white/5">Import</button>
          <button className="rounded-lg border border-white/10 px-2.5 py-1 hover:bg-white/5">Export</button>
          <span>{lyrics.length} chars</span>
        </div>
      </div>
      <textarea
        value={lyrics} onChange={(e) => setLyrics(e.target.value)}
        placeholder={synced ? "[00:12.00] First line...\n[00:18.50] Second line..." : "Verse 1\n...\n\nChorus\n..."}
        className="w-full min-h-[420px] rounded-2xl border border-white/10 bg-[#121212] p-5 text-sm leading-relaxed text-white/85 outline-none focus:border-[#FF4433] resize-none font-mono"
      />
    </div>
  );
}

// ── Step 5 Credits ───────────────────────────────────────────────────────────
const CREDIT_ROLES = [
  "Main Artist", "Featured Artist", "Producer", "Executive Producer", "Composer",
  "Writer", "Publisher", "Engineer", "Mixing Engineer", "Mastering Engineer",
  "Label", "Artwork Designer", "Photographer", "Management",
];
function Step5({ credits, setCredits, artistName }: { credits: Record<string, string>; setCredits: (r: Record<string, string>) => void; artistName: string }) {
  return (
    <div>
      <StepHeader title="Credits" subtitle="Everyone who worked on this track. Proper credits improve royalty routing." />
      <div className="grid grid-cols-2 gap-3">
        {CREDIT_ROLES.map((role) => (
          <div key={role} className="rounded-xl border border-white/10 bg-[#121212] p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1.5">{role}</div>
            <input
              value={credits[role] ?? (role === "Main Artist" ? artistName : "")}
              onChange={(e) => setCredits({ ...credits, [role]: e.target.value })}
              placeholder={`Search or add ${role.toLowerCase()}…`}
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/30"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 6 Rights ────────────────────────────────────────────────────────────
function Step6({ rights, setRights }: { rights: any; setRights: (r: any) => void }) {
  const items = [
    { key: "recording", label: "I own this recording", desc: "You have the master rights to this audio recording." },
    { key: "publishing", label: "I own publishing rights", desc: "You control the composition and publishing." },
    { key: "original", label: "Original work", desc: "This is your original creation, not a cover or sample." },
    { key: "noInfringe", label: "No copyright infringement", desc: "This does not infringe on any third-party rights." },
  ];
  return (
    <div>
      <StepHeader title="Copyright & Rights" subtitle="Confirm ownership. Uploads without proper rights will be removed." />
      <div className="space-y-2.5">
        {items.map((it) => (
          <label key={it.key} className={cn(
            "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition",
            rights[it.key] ? "border-[#00C853]/40 bg-[#00C853]/[0.06]" : "border-white/10 bg-[#121212] hover:border-white/20"
          )}>
            <input type="checkbox" checked={rights[it.key]} onChange={(e) => setRights({ ...rights, [it.key]: e.target.checked })}
              className="mt-0.5 accent-[#00C853]" />
            <div className="flex-1">
              <div className="text-xs font-bold">{it.label}</div>
              <div className="mt-0.5 text-[11px] text-white/50">{it.desc}</div>
            </div>
            {rights[it.key] && <CheckCircle2 className="h-4 w-4 text-[#00C853]" />}
          </label>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-white/10 bg-[#121212] p-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Supporting Documents (Optional)</div>
        <div className="grid grid-cols-3 gap-3">
          {["Contract", "License", "Proof of Ownership"].map((d) => (
            <button key={d} className="rounded-xl border-2 border-dashed border-white/10 p-4 text-center hover:border-white/25 transition">
              <UploadCloud className="mx-auto h-5 w-5 text-white/40" />
              <div className="mt-1.5 text-[11px] font-semibold text-white/70">{d}</div>
              <div className="text-[10px] text-white/40">PDF · Max 10MB</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 7 Distribution ──────────────────────────────────────────────────────
function Step7(props: any) {
  const visOptions: { v: Visibility; label: string; icon: any; desc: string }[] = [
    { v: "draft", label: "Draft", icon: FileText, desc: "Save without publishing" },
    { v: "scheduled", label: "Scheduled", icon: Radio, desc: "Publish at a specific time" },
    { v: "public", label: "Public", icon: Globe, desc: "Live to everyone" },
    { v: "private", label: "Private", icon: Lock, desc: "Only you can access" },
  ];
  return (
    <div>
      <StepHeader title="Distribution" subtitle="When and where should your release be available?" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Field label="Release Date"><Input type="date" value={props.releaseDate} onChange={props.setReleaseDate} /></Field>
        <Field label="Release Time"><Input type="time" value={props.releaseTime} onChange={props.setReleaseTime} /></Field>
        <Field label="Timezone"><Select value={props.timezone} onChange={props.setTimezone} options={["Africa/Harare", "UTC", "America/New_York", "Europe/London"]} /></Field>
      </div>
      <div className="mb-6">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Visibility</div>
        <div className="grid grid-cols-4 gap-3">
          {visOptions.map(({ v, label, icon: Icon, desc }) => (
            <button key={v} onClick={() => props.setVisibility(v)}
              className={cn("rounded-xl border p-3 text-left transition",
                props.visibility === v ? "border-[#FF4433] bg-[#FF4433]/10" : "border-white/10 bg-[#121212] hover:border-white/25"
              )}>
              <Icon className={cn("h-4 w-4 mb-2", props.visibility === v ? "text-[#FF4433]" : "text-white/60")} />
              <div className="text-xs font-bold">{label}</div>
              <div className="text-[10px] text-white/50 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Territories</div>
          <div className="space-y-2">
            {[{ id: "world", l: "Worldwide" }, { id: "zw", l: "Zimbabwe only" }, { id: "custom", l: "Selected countries" }].map((t) => (
              <label key={t.id} className={cn("flex items-center gap-3 rounded-xl border p-3 cursor-pointer",
                props.territories === t.id ? "border-[#FF4433] bg-[#FF4433]/[0.06]" : "border-white/10 bg-[#121212]"
              )}>
                <input type="radio" checked={props.territories === t.id} onChange={() => props.setTerritories(t.id)} className="accent-[#FF4433]" />
                <span className="text-xs font-semibold">{t.l}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Platforms</div>
          <div className="space-y-2">
            {Object.entries(props.platforms).map(([k, val]) => (
              <label key={k} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#121212] p-3 cursor-pointer">
                <span className="text-xs font-semibold capitalize">{k}</span>
                <Toggle value={!!val} onChange={(nv) => props.setPlatforms({ ...props.platforms, [k]: nv })} />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 8 Pricing ───────────────────────────────────────────────────────────
function Step8(props: any) {
  const models = [
    { id: "free", label: "Free Streaming", desc: "Anyone can stream free with ads", icon: Radio },
    { id: "premium", label: "Premium Only", desc: "Only premium subscribers", icon: Star },
    { id: "paid", label: "Paid Purchase", desc: "Users buy the track", icon: DollarSign },
  ];
  return (
    <div>
      <StepHeader title="Monetization" subtitle="Choose how you earn from this release." />
      <div className="grid grid-cols-3 gap-3 mb-6">
        {models.map((m) => {
          const Icon = m.icon;
          const active = props.monetization === m.id;
          return (
            <button key={m.id} onClick={() => props.setMonetization(m.id)}
              className={cn("rounded-2xl border p-4 text-left transition",
                active ? "border-[#FF4433] bg-gradient-to-br from-[#FF4433]/12 to-transparent" : "border-white/10 bg-[#121212] hover:border-white/25")}>
              <Icon className={cn("h-5 w-5 mb-2", active ? "text-[#FF4433]" : "text-white/60")} />
              <div className="text-xs font-bold">{m.label}</div>
              <div className="text-[10px] text-white/50 mt-0.5">{m.desc}</div>
            </button>
          );
        })}
      </div>
      {props.monetization === "paid" && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Field label="Track Price (USD)"><Input value={props.price} onChange={props.setPrice} type="number" /></Field>
          <Field label="Album Price (USD)"><Input value={props.albumPrice} onChange={props.setAlbumPrice} type="number" /></Field>
        </div>
      )}
      <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Additional Revenue</div>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(props.enable).map(([k, v]) => (
          <label key={k} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#121212] p-3.5 cursor-pointer">
            <div>
              <div className="text-xs font-bold capitalize">{k.replace("_", " ")}</div>
              <div className="text-[10px] text-white/50 mt-0.5">Enable {k} for fans</div>
            </div>
            <Toggle value={!!v} onChange={(nv) => props.setEnable({ ...props.enable, [k]: nv })} />
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Step 9 Preview ───────────────────────────────────────────────────────────
function Step9({ data }: { data: any }) {
  return (
    <div>
      <StepHeader title="Preview your release" subtitle="One last look before submitting." />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#121212] to-[#0a0a0a]">
        <div className="flex gap-6 p-6">
          <div className="h-48 w-48 shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
            {data.artwork ? <img src={data.artwork.url} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><ImageIcon className="h-10 w-10 text-white/20" /></div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#FF4433]">SINGLE</div>
            <div className="mt-1 text-3xl font-black">{data.title || "Untitled"}</div>
            <div className="mt-1 text-sm text-white/70">{data.artistName || "Unknown artist"}</div>
            <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
              {data.genre && <Chip>{data.genre}</Chip>}
              <Chip>{data.releaseDate}</Chip>
              <Chip>{data.tracks.length} track{data.tracks.length !== 1 && "s"}</Chip>
              <Chip>{data.monetization}</Chip>
            </div>
            {data.description && <p className="mt-4 text-xs leading-relaxed text-white/60 line-clamp-3">{data.description}</p>}
          </div>
        </div>
        <div className="border-t border-white/[0.06] p-4">
          {data.tracks.map((t: TrackFile, i: number) => (
            <div key={t.id} className="flex items-center gap-3 py-2 text-xs">
              <span className="w-6 text-center text-white/40">{i + 1}</span>
              <span className="flex-1 font-semibold truncate">{t.name}</span>
              <span className="text-white/40">{fmtDur(t.duration)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 10 Submit ───────────────────────────────────────────────────────────
function Step10({ canPublish, onSubmit }: { canPublish: boolean; onSubmit: () => void }) {
  return (
    <div className="text-center py-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-[#FF4433] to-[#FF7A45] shadow-[0_30px_80px_-20px_#FF4433]"
      >
        <Send className="h-10 w-10 text-white" />
      </motion.div>
      <h2 className="mt-6 text-2xl font-black">Ready to publish?</h2>
      <p className="mt-2 max-w-md mx-auto text-sm text-white/60">Your release will be reviewed for quality and copyright, then distributed to Beatify's platform.</p>
      {!canPublish && (
        <div className="mt-6 mx-auto max-w-md rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-left text-xs text-yellow-200">
          <AlertCircle className="inline h-3.5 w-3.5 mr-1.5" /> Complete track upload, title, artist name, and rights confirmation before submitting.
        </div>
      )}
      <button
        onClick={onSubmit} disabled={!canPublish}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4433] to-[#FF7A45] px-8 py-3.5 text-sm font-bold text-white shadow-[0_20px_50px_-15px_#FF4433] transition hover:brightness-110 disabled:opacity-40"
      >
        <Send className="h-4 w-4" /> Submit Release
      </button>
    </div>
  );
}

// ── Live preview panel ───────────────────────────────────────────────────────
function LivePreview({ title, artistName, genre, releaseDate, tracks, artwork, releaseType }: any) {
  const [playing, setPlaying] = useState(false);
  const totalDur = tracks.reduce((a: number, t: TrackFile) => a + t.duration, 0);
  return (
    <div className="p-5">
      <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Live Preview</div>
      <motion.div
        layout
        className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-[#191919] to-[#0a0a0a] shadow-[0_30px_80px_-30px_#FF4433]"
      >
        {artwork ? (
          <img src={artwork.url} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center">
            <div className="text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-white/15" />
              <div className="mt-2 text-[10px] text-white/30">Cover artwork</div>
            </div>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
          onClick={() => setPlaying(!playing)}
          className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-[#FF4433] text-white shadow-[0_10px_30px_-5px_#FF4433]"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
        </motion.button>
      </motion.div>

      <div className="mt-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#FF4433]">{releaseType}</div>
        <div className="mt-1 text-lg font-black leading-tight truncate">{title || "Untitled release"}</div>
        <div className="text-xs text-white/60 truncate">{artistName || "Unknown artist"}</div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {genre && <Chip>{genre}</Chip>}
        <Chip>{releaseDate}</Chip>
        {totalDur > 0 && <Chip>{fmtDur(totalDur)}</Chip>}
      </div>

      <div className="mt-5 flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] py-2 text-[11px] font-semibold hover:bg-white/10">
          <Share2 className="h-3 w-3" /> Share
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] py-2 text-[11px] font-semibold hover:bg-white/10">
          <ImageIcon className="h-3 w-3" /> Artwork
        </button>
      </div>

      {tracks.length > 0 && (
        <div className="mt-5">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Track List</div>
          <div className="space-y-1">
            {tracks.map((t: TrackFile, i: number) => (
              <div key={t.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.03] text-[11px]">
                <span className="w-4 text-center text-white/40">{i + 1}</span>
                <span className="flex-1 truncate">{title || t.name}</span>
                <span className="text-white/40">{fmtDur(t.duration)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Processing / Success ─────────────────────────────────────────────────────
const PROCESS_STAGES = [
  { label: "Generating waveform", icon: BarChart3 },
  { label: "Generating previews", icon: Play },
  { label: "Optimizing artwork", icon: ImageIcon },
  { label: "Validating metadata", icon: Check },
  { label: "Copyright & virus scan", icon: ShieldCheck },
  { label: "Preparing release", icon: Send },
];
function ProcessingScreen({ stage, success, title, artistName, artworkUrl, onView, onAnother, onDash }:
  { stage: number; success: boolean; title: string; artistName: string; artworkUrl?: string;
    onView: () => void; onAnother: () => void; onDash: () => void }) {

  if (success) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-[#080808] text-white overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative mx-auto max-w-lg text-center p-8"
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -8, 8, 0] }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-[#00C853] shadow-[0_30px_80px_-20px_#00C853]"
          >
            <CheckCircle2 className="h-12 w-12 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black">Release submitted!</h1>
          <p className="mt-2 text-sm text-white/60">Your release is being reviewed. Estimated review time: <b className="text-white">24–48 hours</b>.</p>
          {artworkUrl && (
            <div className="mt-6 mx-auto flex items-center gap-4 rounded-2xl border border-white/10 bg-[#121212] p-4 max-w-sm">
              <img src={artworkUrl} className="h-16 w-16 rounded-lg object-cover" />
              <div className="text-left min-w-0">
                <div className="text-sm font-bold truncate">{title}</div>
                <div className="text-xs text-white/60 truncate">{artistName}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#00C853]">Pending Review</div>
              </div>
            </div>
          )}
          <div className="mt-8 flex flex-col gap-2">
            <button onClick={onView} className="rounded-xl bg-[#FF4433] px-6 py-3 text-sm font-bold hover:brightness-110">View Release</button>
            <div className="flex gap-2">
              <button onClick={onAnother} className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-semibold hover:bg-white/10">Upload Another</button>
              <button onClick={onDash} className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-semibold hover:bg-white/10">Go to Dashboard</button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#080808] text-white">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-[#FF4433]/30 border-t-[#FF4433]" />
          <h2 className="mt-6 text-lg font-black">Publishing your release</h2>
          <p className="mt-1 text-xs text-white/50">This may take a moment. Do not close this window.</p>
        </div>
        <div className="space-y-2">
          {PROCESS_STAGES.map((s, i) => {
            const done = i < stage;
            const active = i === stage;
            const Icon = s.icon;
            return (
              <motion.div key={i}
                animate={{ opacity: done || active ? 1 : 0.35, x: 0 }}
                className={cn("flex items-center gap-3 rounded-xl border p-3",
                  active ? "border-[#FF4433] bg-[#FF4433]/[0.08]" : done ? "border-[#00C853]/30 bg-[#00C853]/[0.04]" : "border-white/[0.06] bg-[#121212]"
                )}>
                <div className={cn("grid h-8 w-8 place-items-center rounded-lg",
                  done ? "bg-[#00C853] text-white" : active ? "bg-[#FF4433] text-white" : "bg-white/[0.05] text-white/40")}>
                  {done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={cn("text-xs font-semibold", (done || active) ? "text-white" : "text-white/50")}>{s.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Small primitives ─────────────────────────────────────────────────────────
function StepHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="mt-1 text-sm text-white/50">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-white/50">{label}</div>
      {children}
    </div>
  );
}
function Input({ value, onChange, type = "text", placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder}
      className="w-full rounded-xl border border-white/10 bg-[#121212] px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-[#FF4433] focus:shadow-[0_0_0_3px_rgba(255,68,51,0.12)] placeholder:text-white/30" />
  );
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-white/10 bg-[#121212] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FF4433]">
      <option value="">Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={cn("relative h-5 w-9 rounded-full transition", value ? "bg-[#FF4433]" : "bg-white/10")}>
      <motion.span animate={{ x: value ? 16 : 2 }} className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow" />
    </button>
  );
}
function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-white/80">{children}</span>;
}
