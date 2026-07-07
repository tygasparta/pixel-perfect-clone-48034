import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Heart, MessageSquare, Music2, UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

const items = [
  { icon: UserPlus, tint: "from-blue-500 to-indigo-700", title: "New Follower", desc: "Tinashe started following you.", time: "2m ago" },
  { icon: MessageSquare, tint: "from-fuchsia-500 to-purple-700", title: "New Comment", desc: '"This beat is fire! 🔥🔥" on Pakati', time: "15m ago" },
  { icon: Music2, tint: "from-rose-500 to-red-700", title: "Playlist Add", desc: "Your song MaFeelings was added to Zim Hits playlist.", time: "1h ago" },
  { icon: Music2, tint: "from-emerald-500 to-teal-700", title: "Earnings Update", desc: "You earned $12.45 from streams.", time: "2h ago" },
  { icon: Heart, tint: "from-primary to-primary-glow", title: "New Like", desc: "John liked your song Pakati.", time: "3h ago" },
];

function NotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-14 md:px-8 md:pt-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="grid h-10 w-10 place-items-center rounded-full bg-surface">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Notifications</h1>
        </div>
        <button className="text-xs font-semibold text-primary">Mark all as read</button>
      </div>
      <div className="space-y-3">
        {items.map((n, i) => {
          const Icon = n.icon;
          return (
            <div key={i} className="flex items-start gap-3 rounded-2xl bg-surface p-3">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-card ${n.tint}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.desc}</div>
                <div className="mt-1 text-[10px] text-muted-foreground/70">{n.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
