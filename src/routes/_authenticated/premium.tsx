import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/premium")({
  component: PremiumPage,
});

const plans = [
  {
    name: "Individual",
    price: "$4.99",
    period: "/ month",
    features: ["Ad-free listening", "Offline downloads", "High-quality audio", "Cancel anytime"],
    highlight: false,
  },
  {
    name: "Duo",
    price: "$6.99",
    period: "/ month",
    features: ["2 Premium accounts", "For couples living together", "Ad-free listening", "Offline downloads"],
    highlight: true,
  },
  {
    name: "Family",
    price: "$9.99",
    period: "/ month",
    features: ["Up to 6 accounts", "Block explicit music", "Ad-free listening", "Offline downloads"],
    highlight: false,
  },
];

function PremiumPage() {
  return (
    <div className="px-5 pt-14 md:px-10 md:pt-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/20 text-primary">
          <Crown className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black md:text-4xl">Beatify Premium</h1>
          <p className="text-sm text-muted-foreground">Ad-free music, offline listening, and more.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`relative overflow-hidden rounded-2xl p-6 ring-1 transition ${
              p.highlight
                ? "bg-gradient-to-br from-primary/20 via-primary/5 to-transparent ring-primary/50 shadow-glow"
                : "bg-surface/60 ring-border"
            }`}
          >
            {p.highlight && (
              <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                Popular
              </span>
            )}
            <h3 className="text-lg font-bold">{p.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black">{p.price}</span>
              <span className="text-sm text-muted-foreground">{p.period}</span>
            </div>
            <ul className="mt-5 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <button className="mt-6 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition hover:brightness-110">
              Get {p.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
