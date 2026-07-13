import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Music2, Mail, Apple, Play, Headphones, Radio, Sparkles } from "lucide-react";
import heroArtist from "@/assets/hero-artist.jpg";
import artistTakura from "@/assets/artist-takura.jpg";
import coverMafeelings from "@/assets/cover-mafeelings.jpg";
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
    <>
      {/* MOBILE (< md) — unchanged existing design */}
      <MobileAuth
        mode={mode}
        setMode={setMode}
        isSignup={isSignup}
        setIsSignup={setIsSignup}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        name={name}
        setName={setName}
        loading={loading}
        google={google}
        apple={apple}
        emailSubmit={emailSubmit}
      />

      {/* DESKTOP (md+) — unique split editorial layout */}
      <DesktopAuth
        isSignup={isSignup}
        setIsSignup={setIsSignup}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        name={name}
        setName={setName}
        loading={loading}
        google={google}
        apple={apple}
        emailSubmit={emailSubmit}
      />
    </>
  );
}

/* -------------------------- DESKTOP -------------------------- */

type DesktopProps = {
  isSignup: boolean;
  setIsSignup: (v: boolean) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  name: string; setName: (v: string) => void;
  loading: boolean;
  google: () => void;
  apple: () => void;
  emailSubmit: (e: React.FormEvent) => void;
};

function DesktopAuth(p: DesktopProps) {
  return (
    <div className="relative hidden md:flex min-h-screen w-full overflow-hidden bg-background">
      {/* LEFT: quiet image pane */}
      <aside className="relative hidden lg:block w-[52%]">
        <img src={heroArtist} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/70" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <BeatifyLogo size={44} />
            <span className="text-base font-black tracking-tight">Beatify</span>
          </div>

          <div>
            <h2 className="text-4xl xl:text-5xl font-black leading-[1.05] tracking-tight max-w-md">
              Zimbabwe's music.<br />
              <span className="text-gradient-primary">The world's stage.</span>
            </h2>
          </div>
        </div>
      </aside>

      {/* RIGHT: auth panel */}
      <main className="relative z-10 flex w-full lg:w-[48%] items-center justify-center p-8 xl:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <BeatifyLogo size={40} />
            <span className="text-base font-black tracking-tight">Beatify</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            {p.isSignup ? "Create your account" : "Sign in to Beatify"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {p.isSignup
              ? "Join to stream, upload and connect."
              : "Welcome back. Pick up where you left off."}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              onClick={p.google}
              disabled={p.loading}
              className="group flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface/60 py-3 text-sm font-semibold backdrop-blur transition hover:border-white/20 hover:bg-surface disabled:opacity-50"
            >
              <GoogleIcon />
              Google
            </button>
            <button
              onClick={p.apple}
              disabled={p.loading}
              className="group flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface/60 py-3 text-sm font-semibold backdrop-blur transition hover:border-white/20 hover:bg-surface disabled:opacity-50"
            >
              <Apple className="h-4 w-4" fill="currentColor" />
              Apple
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">or with email</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Form */}
          <form onSubmit={p.emailSubmit} className="space-y-3">
            {p.isSignup && (
              <Field
                label="Display name"
                value={p.name}
                onChange={p.setName}
                placeholder="e.g. Takura"
              />
            )}
            <Field
              label="Email"
              type="email"
              required
              value={p.email}
              onChange={p.setEmail}
              placeholder="you@beatify.zw"
            />
            <Field
              label="Password"
              type="password"
              required
              minLength={6}
              value={p.password}
              onChange={p.setPassword}
              placeholder="At least 6 characters"
            />

            {!p.isSignup && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={p.loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50"
            >
              <Mail className="h-4 w-4" />
              {p.loading ? "Please wait…" : p.isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to Beatify's{" "}
            <a className="underline hover:text-foreground" href="#">Terms</a> and{" "}
            <a className="underline hover:text-foreground" href="#">Privacy Policy</a>.
          </p>

          <div className="mt-4 text-center">
            <Link to="/home" className="text-xs text-muted-foreground hover:text-foreground">
              Skip for now →
            </Link>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-primary">{icon}<span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span></div>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, minLength, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-surface/60 px-4 py-3 text-sm outline-none backdrop-blur transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}

/* -------------------------- MOBILE (unchanged) -------------------------- */

type MobileProps = DesktopProps & {
  mode: "welcome" | "email";
  setMode: (m: "welcome" | "email") => void;
};

function MobileAuth(p: MobileProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background md:hidden">
      <div className="absolute inset-0 z-0">
        <img src={heroArtist} alt="" className="h-full w-full object-cover opacity-70" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-6 pb-10 pt-6 safe-area">
        {p.mode === "welcome" ? (
          <>
            <div className="flex items-center">
              <BeatifyLogo size={64} className="drop-shadow-[0_6px_24px_rgba(255,68,51,0.5)]" />
            </div>

            <div className="flex-1 flex flex-col justify-end">
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight">
                Welcome to<br />
                <span className="text-gradient-primary">Beatify</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Stream. Upload. Connect.<br />Grow your music journey.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              <button onClick={p.google} disabled={p.loading} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-surface-2 py-4 text-sm font-semibold shadow-card transition hover:bg-surface disabled:opacity-50">
                <GoogleIcon />Continue with Google
              </button>
              <button onClick={p.apple} disabled={p.loading} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-surface-2 py-4 text-sm font-semibold shadow-card transition hover:bg-surface disabled:opacity-50">
                <Apple className="h-5 w-5" fill="currentColor" />Continue with Apple
              </button>
              <button onClick={() => { p.setMode("email"); p.setIsSignup(true); }} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-primary py-4 text-sm font-semibold text-primary-foreground shadow-glow">
                <Mail className="h-5 w-5" />Continue with Email
              </button>
              <button onClick={() => { p.setMode("email"); p.setIsSignup(false); }} className="w-full py-4 text-sm font-medium text-muted-foreground hover:text-foreground">
                Log in
              </button>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => p.setMode("welcome")} className="mb-8 self-start text-sm text-muted-foreground hover:text-foreground">← Back</button>
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
                <Music2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{p.isSignup ? "Create account" : "Welcome back"}</h1>
                <p className="text-xs text-muted-foreground">{p.isSignup ? "Join Beatify today" : "Log in to Beatify"}</p>
              </div>
            </div>

            <form onSubmit={p.emailSubmit} className="space-y-3">
              {p.isSignup && (
                <input type="text" placeholder="Display name" value={p.name} onChange={(e) => p.setName(e.target.value)} className="w-full rounded-2xl bg-surface px-4 py-4 text-sm outline-none ring-1 ring-border focus:ring-primary" />
              )}
              <input type="email" required placeholder="Email" value={p.email} onChange={(e) => p.setEmail(e.target.value)} className="w-full rounded-2xl bg-surface px-4 py-4 text-sm outline-none ring-1 ring-border focus:ring-primary" />
              <input type="password" required minLength={6} placeholder="Password" value={p.password} onChange={(e) => p.setPassword(e.target.value)} className="w-full rounded-2xl bg-surface px-4 py-4 text-sm outline-none ring-1 ring-border focus:ring-primary" />
              <button type="submit" disabled={p.loading} className="w-full rounded-2xl bg-gradient-primary py-4 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
                {p.loading ? "Please wait…" : p.isSignup ? "Create account" : "Log in"}
              </button>
            </form>

            <button onClick={() => p.setIsSignup(!p.isSignup)} className="mt-6 text-center text-sm text-muted-foreground hover:text-foreground">
              {p.isSignup ? "Already have an account? Log in" : "New to Beatify? Sign up"}
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
