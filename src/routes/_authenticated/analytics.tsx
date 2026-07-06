import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, TrendingUp, Users, DollarSign, PlayCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { demoTracks } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const tabs = ["Overview", "Songs", "Audience", "Revenue"];
  const points = [3, 4, 3.5, 4.5, 5, 4.8, 5.5, 6, 5.8, 6.5, 7, 7.5];
  const max = Math.max(...points);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i / (points.length - 1)) * 100} ${100 - (p / max) * 90}`)
    .join(" ");

  const stats = [
    { label: "Streams", value: "125.6K", delta: "+12.5%", icon: PlayCircle },
    { label: "Listeners", value: "87.4K", delta: "+8.7%", icon: Users },
    { label: "Earnings", value: "$1,245", delta: "+15.3%", icon: DollarSign },
    { label: "Follows", value: "3,412", delta: "+4.1%", icon: TrendingUp },
  ];

  const cities = [
    { name: "Harare", pct: 42 },
    { name: "Bulawayo", pct: 21 },
    { name: "Johannesburg", pct: 14 },
    { name: "London", pct: 9 },
    { name: "Cape Town", pct: 7 },
    { name: "Other", pct: 7 },
  ];

  return (
    <div className="px-5 pt-14 lg:px-10 lg:pt-8">
      <div className="mb-6 flex items-center gap-3 lg:mb-8">
        <Link
          to="/profile"
          className="grid h-10 w-10 place-items-center rounded-full bg-surface lg:hidden"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-bold lg:text-3xl lg:font-black">Analytics Overview</h1>
          <p className="text-xs text-muted-foreground lg:text-sm">May 1 – May 31, 2026</p>
        </div>
        <div className="ml-auto hidden gap-2 lg:flex">
          <button className="rounded-full bg-surface px-4 py-1.5 text-xs font-semibold ring-1 ring-border">Export CSV</button>
          <button className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">Share report</button>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-none lg:mb-6">
        {tabs.map((t, i) => (
          <button
            key={t}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold ${
              i === 0 ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground ring-1 ring-border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Stats: 3 up on mobile, 4 up on desktop with icons */}
      <div className="mb-6 grid grid-cols-3 gap-2.5 lg:grid-cols-4 lg:gap-4">
        {stats.slice(0, 3).map((s) => (
          <Stat key={s.label} {...s} />
        ))}
        <div className="hidden lg:block">
          <Stat {...stats[3]} />
        </div>
      </div>

      {/* Mobile: chart + top songs stacked */}
      <div className="lg:hidden">
        <div className="mb-6 rounded-2xl bg-surface p-4">
          <div className="mb-3 text-sm font-semibold">Streams Over Time</div>
          <StreamChart path={path} />
          <ChartAxis />
        </div>
        <h2 className="mb-3 text-base font-bold">Top Songs</h2>
        <TopSongsList />
      </div>

      {/* Desktop: chart left + top songs right, cities row */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
        <section className="col-span-2 rounded-2xl bg-surface/60 p-6 ring-1 ring-border">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <div className="text-lg font-bold">Streams over time</div>
              <div className="text-xs text-muted-foreground">Daily plays across all tracks</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black">125,642</div>
              <div className="text-xs font-semibold text-emerald-400">+12.5% vs last month</div>
            </div>
          </div>
          <StreamChart path={path} tall />
          <ChartAxis />
        </section>

        <aside className="rounded-2xl bg-surface/60 p-5 ring-1 ring-border">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-bold">Top songs</h2>
            <span className="text-[11px] text-muted-foreground">This month</span>
          </div>
          <TopSongsList />
        </aside>

        <section className="col-span-2 rounded-2xl bg-surface/60 p-6 ring-1 ring-border">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-bold">Listeners by city</h2>
            <span className="text-[11px] text-muted-foreground">87,412 unique</span>
          </div>
          <div className="space-y-3">
            {cities.map((c) => (
              <div key={c.name} className="grid grid-cols-[100px_minmax(0,1fr)_40px] items-center gap-3">
                <span className="text-sm">{c.name}</span>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${c.pct}%` }} />
                </div>
                <span className="text-right text-xs font-semibold text-muted-foreground">{c.pct}%</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-2xl bg-surface/60 p-5 ring-1 ring-border">
          <h2 className="mb-3 text-base font-bold">Audience</h2>
          <div className="space-y-4 text-sm">
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>18–24</span><span>34%</span></div>
              <Bar pct={34} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>25–34</span><span>41%</span></div>
              <Bar pct={41} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>35–44</span><span>17%</span></div>
              <Bar pct={17} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>45+</span><span>8%</span></div>
              <Bar pct={8} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StreamChart({ path, tall = false }: { path: string; tall?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={`w-full ${tall ? "h-64" : "h-40"}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(0.635 0.22 26)" stopOpacity="0.4" />
          <stop offset="1" stopColor="oklch(0.635 0.22 26)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#g)" />
      <path d={path} fill="none" stroke="oklch(0.635 0.22 26)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function ChartAxis() {
  return (
    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
      <span>May 1</span><span>May 8</span><span>May 15</span><span>May 22</span><span>May 31</span>
    </div>
  );
}

function TopSongsList() {
  return (
    <div className="space-y-1">
      {demoTracks.slice(0, 5).map((t, i) => (
        <div key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="w-4 text-sm text-muted-foreground">{i + 1}</span>
          <img src={t.cover} alt="" className="h-10 w-10 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{t.title}</div>
            <div className="truncate text-[11px] text-muted-foreground">{t.artist}</div>
          </div>
          <span className="text-xs font-medium text-muted-foreground">{(50 - i * 8).toFixed(1)}K</span>
        </div>
      ))}
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/5">
      <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Stat({ label, value, delta, icon: Icon }: { label: string; value: string; delta: string; icon?: typeof TrendingUp }) {
  return (
    <div className="rounded-2xl bg-surface p-3 lg:p-5 lg:ring-1 lg:ring-border">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground lg:text-xs">{label}</div>
        {Icon && <Icon className="hidden h-4 w-4 text-primary lg:block" />}
      </div>
      <div className="mt-1 text-lg font-bold lg:mt-2 lg:text-3xl lg:font-black">{value}</div>
      <div className="text-[10px] font-semibold text-emerald-400 lg:text-xs">{delta}</div>
    </div>
  );
}
