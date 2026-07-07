import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Music2, Mail, Apple } from "lucide-react";
import heroArtist from "@/assets/hero-artist.jpg";
import { BeatifyLogo } from "@/components/logo";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Beatify" },
      { name: "description", content: "Sign in to Beatify to stream, upload and connect." },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"welcome" | "email">("welcome");
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function google() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/home" });
  }

  async function apple() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Apple sign-in unavailable");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/home" });
  }

  async function emailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: name || email.split("@")[0] },
        },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success("Welcome to Beatify!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
    }
    navigate({ to: "/home" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Hero image with red overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroArtist}
          alt=""
          className="h-full w-full object-cover opacity-70"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-6 pb-10 pt-6 safe-area">
        {mode === "welcome" ? (
          <>
            {/* Top-left brand mark */}
            <div className="flex items-center">
              <BeatifyLogo size={64} className="drop-shadow-[0_6px_24px_rgba(255,68,51,0.5)]" />
            </div>

            <div className="flex-1 flex flex-col justify-end">
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight">
                Welcome to<br />
                <span className="text-gradient-primary">Beatify</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Stream. Upload. Connect.<br />
                Grow your music journey.
              </p>
            </div>


            <div className="mt-10 space-y-3">
              <button
                onClick={google}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-surface-2 py-4 text-sm font-semibold shadow-card transition hover:bg-surface disabled:opacity-50"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <button
                onClick={apple}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-surface-2 py-4 text-sm font-semibold shadow-card transition hover:bg-surface disabled:opacity-50"
              >
                <Apple className="h-5 w-5" fill="currentColor" />
                Continue with Apple
              </button>
              <button
                onClick={() => { setMode("email"); setIsSignup(true); }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-primary py-4 text-sm font-semibold text-primary-foreground shadow-glow"
              >
                <Mail className="h-5 w-5" />
                Continue with Email
              </button>
              <button
                onClick={() => { setMode("email"); setIsSignup(false); }}
                className="w-full py-4 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Log in
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setMode("welcome")}
              className="mb-8 self-start text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
                <Music2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{isSignup ? "Create account" : "Welcome back"}</h1>
                <p className="text-xs text-muted-foreground">
                  {isSignup ? "Join Beatify today" : "Log in to Beatify"}
                </p>
              </div>
            </div>

            <form onSubmit={emailSubmit} className="space-y-3">
              {isSignup && (
                <input
                  type="text"
                  placeholder="Display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl bg-surface px-4 py-4 text-sm outline-none ring-1 ring-border focus:ring-primary"
                />
              )}
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-surface px-4 py-4 text-sm outline-none ring-1 ring-border focus:ring-primary"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-surface px-4 py-4 text-sm outline-none ring-1 ring-border focus:ring-primary"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-primary py-4 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
              >
                {loading ? "Please wait…" : isSignup ? "Create account" : "Log in"}
              </button>
            </form>

            <button
              onClick={() => setIsSignup(!isSignup)}
              className="mt-6 text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {isSignup ? "Already have an account? Log in" : "New to Beatify? Sign up"}
            </button>
          </>
        )}

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          <Link to="/home" className="hover:text-foreground">Skip for now →</Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
