import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/home" });
    let onboarded = false;
    try {
      onboarded = localStorage.getItem("beatify.onboarded") === "1";
    } catch {}
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;
    if (isMobile && !onboarded) throw redirect({ to: "/onboarding" });
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});
