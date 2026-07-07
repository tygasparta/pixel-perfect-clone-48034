import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, CreditCard, Plus, Wallet as WalletIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wallet")({
  component: WalletPage,
});

function WalletPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-14 md:px-8 md:pt-10">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/profile" className="grid h-10 w-10 place-items-center rounded-full bg-surface">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Your Wallet</h1>
      </div>

      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-primary p-5 shadow-glow">
        <div className="text-xs font-medium text-primary-foreground/80">Available Balance</div>
        <div className="mt-1 text-4xl font-black text-primary-foreground">$246.75</div>
        <div className="mt-4 flex gap-2">
          <button className="flex-1 rounded-full bg-white/95 py-2.5 text-xs font-semibold text-black">Withdraw</button>
          <button className="flex-1 rounded-full bg-black/25 py-2.5 text-xs font-semibold text-primary-foreground backdrop-blur">Transactions</button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-surface p-4">
        <div className="text-xs text-muted-foreground">Earnings Overview</div>
        <div className="mb-2 mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold">$1,245.00</span>
          <span className="text-xs font-semibold text-emerald-400">+15.3%</span>
        </div>
        <div className="flex items-end gap-1">
          {[35,42,38,55,48,60,52,68,72,65,80,74].map((h,i)=>(
            <div key={i} className="flex-1 rounded-t bg-gradient-primary" style={{ height: h + "px" }} />
          ))}
        </div>
      </div>

      <h2 className="mb-3 text-sm font-bold">Payout Methods</h2>
      <div className="space-y-2">
        <Method icon={<WalletIcon className="h-5 w-5" />} name="EcoCash" digits="•••• 1234" tint="from-emerald-500 to-teal-700" />
        <Method icon={<CreditCard className="h-5 w-5" />} name="Visa" digits="•••• 5678" tint="from-blue-500 to-indigo-700" />
        <Method icon={<CreditCard className="h-5 w-5" />} name="Mastercard" digits="•••• 9012" tint="from-amber-500 to-orange-700" />
        <button className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left hover:bg-surface-2">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/5">
            <Plus className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Add Payout</div>
            <div className="text-xs text-muted-foreground">Connect new method</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function Method({ icon, name, digits, tint }: { icon: React.ReactNode; name: string; digits: string; tint: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-3">
      <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-card ${tint}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{name}</div>
        <div className="text-xs text-muted-foreground">{digits}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
