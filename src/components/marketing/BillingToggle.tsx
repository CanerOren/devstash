"use client";

import { cn } from "@/lib/utils";

export type BillingPeriod = "monthly" | "yearly";

// Controlled monthly/yearly segmented control. State lives in PricingPlans so
// the Pro price can react to it.
export function BillingToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}) {
  const opt =
    "inline-flex items-center gap-2 rounded-full px-[18px] py-2 text-[0.88rem] font-semibold transition-colors";
  const active = "bg-mk-surface-2 text-mk-text";
  const idle = "text-mk-muted";

  return (
    <div
      role="group"
      aria-label="Billing period"
      className="inline-flex gap-1 rounded-full border border-mk-border bg-mk-surface p-1"
    >
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={cn(opt, period === "monthly" ? active : idle)}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("yearly")}
        className={cn(opt, period === "yearly" ? active : idle)}
      >
        Yearly
        <span className="rounded-full bg-[rgba(34,197,94,0.14)] px-2 py-0.5 text-[0.72rem] font-bold text-note">
          Save 25%
        </span>
      </button>
    </div>
  );
}
