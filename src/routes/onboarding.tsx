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

const slides = [
  {
    icon: Headphones,
    title: "Sound that moves you",
    body: "Immersive, high-fidelity streaming built for the moments that matter most.",
    from: "#8B1E5C",
    to: "#2A0A1F",
  },
  {
    icon: Radio,
    title: "Made for your taste",
    body: "Personalized mixes, trending drops, and stations that learn as you listen.",
    from: "#B02579",
    to: "#3A0C2A",
  },
  {
    icon: Upload,
    title: "Share your sound",
    body: "Upload tracks, grow your audience, and get paid for every play.",
    from: "#D4318E",
    to: "#4A0F35",
  },
  {
    icon: Sparkles,
    title: "Let's begin",
    body: "Your next favorite song is one tap away.",
    from: "#5B1E5C",
    to: "#1A0512",
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
      className="relative flex min-h-screen w-full flex-col overflow-hidden text-white"
      style={{
        backgroundImage: `radial-gradient(120% 80% at 50% 0%, ${slide.from} 0%, ${slide.to} 60%, #0a0208 100%)`,
        transition: "background-image 700ms ease",
      }}
    >
      {/* animated blobs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full blur-3xl"
        style={{ background: slide.from, opacity: 0.35 }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: slide.to, opacity: 0.55 }}
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6">
        <motion.img
          src={logoMark}
          alt="Beatify"
          className="h-9 w-auto drop-shadow-[0_4px_20px_rgba(212,49,142,0.55)]"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          draggable={false}
        />
        <button
          onClick={finish}
          className="rounded-full px-4 py-1.5 text-xs font-semibold text-white/70 transition hover:text-white"
        >
          Skip
        </button>
      </div>

      {/* content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <motion.div
              className="mb-10 flex h-32 w-32 items-center justify-center rounded-[2rem] bg-white/10 p-5 backdrop-blur-xl ring-1 ring-white/15"
              animate={{ rotate: [0, -3, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {i === slides.length - 1 ? (
                <img
                  src={logoMark}
                  alt="Beatify"
                  className="h-full w-full object-contain drop-shadow-[0_6px_24px_rgba(255,68,51,0.6)]"
                  draggable={false}
                />
              ) : (
                <Icon className="h-14 w-14 text-white" strokeWidth={1.6} />
              )}
            </motion.div>

            <h1 className="mb-4 text-3xl font-black leading-tight tracking-tight">
              {slide.title}
            </h1>
            <p className="max-w-xs text-base leading-relaxed text-white/75">
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
              className="h-1.5 rounded-full bg-white/40"
              animate={{ width: idx === i ? 28 : 8, opacity: idx === i ? 1 : 0.5 }}
              transition={{ duration: 0.35 }}
            />
          ))}
        </div>

        <motion.button
          onClick={next}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className="w-full max-w-sm rounded-full bg-white py-4 text-base font-bold text-[#5B1E5C] shadow-[0_10px_40px_-10px_rgba(212,49,142,0.8)]"
        >
          {i < slides.length - 1 ? "Continue" : "Get started"}
        </motion.button>
      </div>
    </div>
  );
}
