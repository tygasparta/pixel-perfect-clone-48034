import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Headphones, Radio, Sparkles, Upload } from "lucide-react";
import logoMark from "@/assets/beatify-mark.png";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  component: Onboarding,
  head: () => ({
    meta: [
      { title: "Welcome to Beatify" },
      { name: "description", content: "Discover, stream, and share the music that moves you." },
    ],
  }),
});

// Theme: dark background (#0a0208) with red→ember accents (#FF4433 → #FF7A45)
const slides = [
  {
    icon: Headphones,
    title: "Sound that moves you",
    body: "Immersive, high-fidelity streaming built for the moments that matter most.",
    accent: "#FF4433",
    glow: "#FF7A45",
  },
  {
    icon: Radio,
    title: "Made for your taste",
    body: "Personalized mixes, trending drops, and stations that learn as you listen.",
    accent: "#FF5A3C",
    glow: "#FF9557",
  },
  {
    icon: Upload,
    title: "Share your sound",
    body: "Upload tracks, grow your audience, and get paid for every play.",
    accent: "#FF7A45",
    glow: "#FFA060",
  },
  {
    icon: Sparkles,
    title: "Let's begin",
    body: "Your next favorite song is one tap away.",
    accent: "#FF4433",
    glow: "#FF7A45",
  },
];


function Onboarding() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);

  // desktop: skip straight through
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    try {
      localStorage.setItem("beatify.onboarded", "1");
    } catch {}
    navigate({ to: "/auth" });
  };

  const next = () => {
    if (i < slides.length - 1) setI(i + 1);
    else finish();
  };

  const slide = slides[i];
  const Icon = slide.icon;

  return (
    <div
      className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#0a0208] text-white"
    >
      {/* subtle radial theme glow that shifts per slide */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(80% 55% at 50% 0%, ${slide.accent}33 0%, transparent 60%), radial-gradient(60% 40% at 50% 100%, ${slide.glow}22 0%, transparent 70%)`,
          transition: "background-image 700ms ease",
        }}
      />
      {/* soft grain / noise via animated blobs in brand color */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl"
        style={{ background: slide.accent, opacity: 0.18 }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full blur-3xl"
        style={{ background: slide.glow, opacity: 0.15 }}
        animate={{ x: [0, -24, 0], y: [0, -16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* top bar — full themed logo lockup, clearly visible */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6">
        <motion.img
          src={logoMark}
          alt="Beatify"
          className="h-11 w-auto drop-shadow-[0_4px_18px_rgba(255,68,51,0.55)]"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          draggable={false}
        />
        <button
          onClick={finish}
          className="rounded-full px-4 py-1.5 text-xs font-semibold text-white/60 transition hover:text-white"
        >
          Skip
        </button>
      </div>

      {/* content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <motion.div
              className="mb-10 flex h-40 w-40 items-center justify-center rounded-[2.25rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
              style={{
                boxShadow: `0 20px 60px -20px ${slide.accent}66, inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {i === slides.length - 1 ? (
                <img
                  src={logoMark}
                  alt="Beatify"
                  className="h-full w-full object-contain drop-shadow-[0_8px_28px_rgba(255,68,51,0.7)]"
                  draggable={false}
                />
              ) : (
                <Icon
                  className="h-16 w-16"
                  strokeWidth={1.5}
                  style={{ color: slide.glow }}
                />
              )}
            </motion.div>

            <h1 className="mb-3 text-[28px] font-black leading-tight tracking-tight">
              {slide.title}
            </h1>
            <p className="max-w-xs text-[15px] leading-relaxed text-white/65">
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* footer */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 pb-10">
        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <motion.span
              key={idx}
              className="h-1.5 rounded-full"
              animate={{
                width: idx === i ? 28 : 8,
                backgroundColor: idx === i ? slide.accent : "rgba(255,255,255,0.22)",
              }}
              transition={{ duration: 0.35 }}
            />
          ))}
        </div>

        <motion.button
          onClick={next}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          className="w-full max-w-sm rounded-full py-4 text-base font-bold text-white"
          style={{
            backgroundImage: `linear-gradient(135deg, ${slide.accent}, ${slide.glow})`,
            boxShadow: `0 14px 40px -12px ${slide.accent}cc`,
          }}
        >
          {i < slides.length - 1 ? "Continue" : "Get started"}
        </motion.button>
      </div>
    </div>
  );
}

