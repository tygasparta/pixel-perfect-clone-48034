import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell, ChevronRight, CreditCard, HelpCircle, Languages,
  LineChart, LogOut, Moon, Play, Settings, Shield, Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePlayer } from "@/lib/player";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { current, isPlaying } = usePlayer();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).single();
      return data;
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const rows = [
    { icon: Settings, label: "Account Settings" },
    { icon: CreditCard, label: "Subscription", meta: "Premium" },
    { icon: Wallet, label: "Wallet", to: "/wallet" as const },
    { icon: LineChart, label: "Analytics", to: "/analytics" as const },
    { icon: Play, label: "Playback" },
    { icon: Bell, label: "Notifications", to: "/notifications" as const },
    { icon: Shield, label: "Privacy & Security" },
    { icon: Languages, label: "Language", meta: "English" },
    { icon: Moon, label: "Dark Mode", toggle: true },
    { icon: HelpCircle, label: "Help & Support" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 pt-14 md:px-8 md:pt-10">
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-xl font-black text-primary-foreground shadow-glow">
          {(profile?.display_name ?? "B").slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold">{profile?.display_name ?? "Beatify user"}</div>
          <button className="text-xs text-muted-foreground hover:text-foreground">View Profile</button>
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-1">
        {rows.map((r, i) => {
          const Icon = r.icon;
          const inner = (
            <>
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{r.label}</span>
              {r.meta && <span className="text-xs text-primary">{r.meta}</span>}
              {r.toggle ? (
                <span className="relative h-5 w-9 rounded-full bg-primary">
                  <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
                </span>
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </>
          );
          return r.to ? (
            <Link
              key={i}
              to={r.to}
              className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5"
            >
              {inner}
            </Link>
          ) : (
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5">
              {inner}
            </div>
          );
        })}
        <button
          onClick={signOut}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-primary hover:bg-primary/10"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-semibold">Log Out</span>
        </button>
      </div>

      {current && (
        <div className="mt-6 text-xs text-muted-foreground">
          {isPlaying ? "Now playing" : "Paused"}: {current.title} · {current.artist}
        </div>
      )}
    </div>
  );
}
