import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { PlayerProvider } from "../lib/player";
import { supabase } from "../integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-black text-gradient-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Off the tracklist</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist. Let's get you back to the music.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try refreshing.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0f0a0a" },
      { title: "Beatify — Zimbabwe's Music. The World's Stage." },
      {
        name: "description",
        content:
          "Beatify is Zimbabwe's home for music. Stream, upload, connect. Discover Zimdancehall, Afro-Pop, Hip-Hop and the artists shaping the sound.",
      },
      { name: "author", content: "Beatify" },
      { property: "og:title", content: "Beatify — Zimbabwe's Music. The World's Stage." },
      {
        property: "og:description",
        content: "Stream. Upload. Connect. Grow your music journey with Beatify.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Beatify — Zimbabwe's Music. The World's Stage." },
      { name: "description", content: "Beatify is Zimbabwe's home for music. Stream, upload, connect. Discover Zimdancehall, Afro-Pop, Hip-Hop and the artists shaping the sound." },
      { property: "og:description", content: "Beatify is Zimbabwe's home for music. Stream, upload, connect. Discover Zimdancehall, Afro-Pop, Hip-Hop and the artists shaping the sound." },
      { name: "twitter:description", content: "Beatify is Zimbabwe's home for music. Stream, upload, connect. Discover Zimdancehall, Afro-Pop, Hip-Hop and the artists shaping the sound." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c4d59919-07fc-48ab-9f1e-a4f655ddd2a4/id-preview-790cac4f--77c52d97-cee7-4c84-8720-28bf12a60768.lovable.app-1783374335087.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c4d59919-07fc-48ab-9f1e-a4f655ddd2a4/id-preview-790cac4f--77c52d97-cee7-4c84-8720-28bf12a60768.lovable.app-1783374335087.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <PlayerProvider>
        <Outlet />
        <Toaster theme="dark" position="top-center" richColors />
      </PlayerProvider>
    </QueryClientProvider>
  );
}
