import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import logoMark from "@/assets/beatify-mark.svg";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  component: Onboarding,
  head: () => ({
    meta: [
      { title: "Welcome to Beatify" },
      { name: "description", content: "Zimbabwe's Music. The World's Stage." },
    ],
  }),
});

const RED = "#FF3B2F";

const slides = [
  {
    title: "Beatify",
    tagline: "Zimbabwe's Music.\nThe World's Stage.",
  },
  {
    title: "Discover",
    tagline: "Fresh drops and stations\ntuned to your taste.",
  },
  {
    title: "Create",
    tagline: "Upload your sound.\nGet paid for every play.",
  },
  {
    title: "Ready?",
    tagline: "Your next favorite track\nis one tap away.",
  },
];

// Deterministic bar heights so the waveform looks composed, not random
const BARS = 64;
const barHeights = Array.from({ length: BARS }, (_, k) => {
  const x = k / BARS;
  // envelope shape: rises to center, falls off edges
  const env = Math.sin(Math.PI * x);
  const jitter = 0.35 + 0.65 * Math.abs(Math.sin(k * 1.7) * Math.cos(k * 0.9));
  return Math.max(0.08, env * jitter);
});

function Waveform() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="flex h-[62%] w-[130%] items-center justify-center gap-[3px]">
        {barHeights.map((h, k) => (
          <motion.span
            key={k}
            className="block w-[3px] rounded-full"
            style={{ backgroundColor: RED, opacity: 0.55 }}
            initial={{ scaleY: h }}
            animate={{
              scaleY: [h * 0.6, h, h * 0.7, h * 1.05, h * 0.65],
            }}
            transition={{
              duration: 2.2 + (k % 5) * 0.18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (k % 7) * 0.06,
            }}
          />
        ))}
      </div>
      {/* soften edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 50%, transparent 30%, #000 85%)",
        }}
      />
    </div>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches
    ) {
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

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-black text-white">
      {/* animated red waveform backdrop */}
      <Waveform />

      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50">
          0{i + 1}
        </span>
        <button
          onClick={finish}
          className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50 transition hover:text-white"
        >
          Skip
        </button>
      </div>

      {/* content */}
      <div className="relative z-10 flex flex-1 flex-col items-start justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-start"
          >
            <h1
              className="text-[64px] font-black leading-[0.95] tracking-tight"
              style={{ color: RED }}
            >
              {slide.title}
            </h1>
            <p className="mt-5 whitespace-pre-line text-[15px] font-medium leading-snug text-white/85">
              {slide.tagline}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* bottom: real logo mark + controls */}
      <div className="relative z-10 flex flex-col items-center gap-5 px-8 pb-10">
        <motion.img
          src={logoMark}
          alt="Beatify"
          className="h-14 w-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          draggable={false}
        />

        <div className="flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <motion.span
              key={idx}
              className="h-1 rounded-full"
              animate={{
                width: idx === i ? 24 : 6,
                backgroundColor: idx === i ? RED : "rgba(255,255,255,0.25)",
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        <motion.button
          onClick={next}
          whileTap={{ scale: 0.97 }}
          className="w-full max-w-sm rounded-none py-4 text-sm font-bold uppercase tracking-[0.2em] text-white"
          style={{ backgroundColor: RED }}
        >
          {i < slides.length - 1 ? "Continue" : "Enter Beatify"}
        </motion.button>
      </div>
    </div>
  );
}
