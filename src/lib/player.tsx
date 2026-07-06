import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Track } from "./mock-data";
import { recordPlay } from "./recommendations.functions";
import { isDbTrackId } from "./track-mapper";

type PlayerCtx = {
  current: Track | null;
  queue: Track[];
  isPlaying: boolean;
  progress: number; // 0..1
  currentTime: number;
  duration: number;
  play: (track: Track, queue?: Track[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (fraction: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
};

const Ctx = createContext<PlayerCtx | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime);
    const onLoad = () => setDuration(el.duration || 0);
    const onEnd = () => nextInternal();
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onLoad);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onLoad);
      el.removeEventListener("ended", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const play = (track: Track, q?: Track[]) => {
    setCurrent(track);
    if (q) setQueue(q);
    setPlaying(true);
    if (isDbTrackId(track.id)) {
      recordPlay({ data: { trackId: track.id } }).catch(() => {});
    }
    requestAnimationFrame(() => {
      const el = audioRef.current;
      if (!el) return;
      if (el.src !== track.audio) el.src = track.audio;
      el.play().catch(() => setPlaying(false));
    });
  };

  const toggle = () => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (el.paused) {
      el.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const nextInternal = () => {
    if (!current || queue.length === 0) return;
    const i = queue.findIndex((t) => t.id === current.id);
    const nxt = queue[(i + 1) % queue.length];
    if (nxt) play(nxt, queue);
  };

  const prev = () => {
    if (!current || queue.length === 0) return;
    const i = queue.findIndex((t) => t.id === current.id);
    const p = queue[(i - 1 + queue.length) % queue.length];
    if (p) play(p, queue);
  };

  const seek = (frac: number) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    el.currentTime = frac * duration;
  };

  return (
    <Ctx.Provider
      value={{
        current,
        queue,
        isPlaying,
        progress: duration ? currentTime / duration : 0,
        currentTime,
        duration,
        play,
        toggle,
        next: nextInternal,
        prev,
        seek,
        audioRef,
      }}
    >
      {children}
      <audio ref={audioRef} preload="metadata" />
    </Ctx.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
