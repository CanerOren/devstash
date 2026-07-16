"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BillingToggle, type BillingPeriod } from "./BillingToggle";
import { MarketingButton } from "./MarketingButton";
import { PRICING_TIERS } from "./data";
import { Reveal } from "./Reveal";

// Owns the billing period so both the toggle and the Pro card's price stay in
// sync (they can't share client state across the server/client boundary, so the
// interactive plans live here while Pricing stays a server component).
export function PricingPlans() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const yearly = period === "yearly";

  return (
    <>
      <div className="mb-14 flex justify-center">
        <BillingToggle period={period} onChange={setPeriod} />
      </div>

      <div className="mx-auto grid max-w-[784px] grid-cols-1 items-start gap-6 sm:grid-cols-2">
        {PRICING_TIERS.map((tier) => (
          <Reveal key={tier.name}>
            <article
              className={cn(
                "relative rounded-[14px] border p-8",
                tier.popular
                  ? "border-[color-mix(in_srgb,var(--color-url)_55%,var(--color-mk-border))] bg-mk-surface bg-[linear-gradient(180deg,rgba(99,102,241,0.08),transparent_40%)] shadow-[0_24px_60px_-30px_rgba(99,102,241,0.6)]"
                  : "border-mk-border bg-mk-surface",
              )}
            >
              {tier.popular && (
                <span className="absolute -top-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[linear-gradient(135deg,#3b82f6,#6366f1)] px-3.5 py-[5px] text-[0.74rem] font-bold tracking-[0.03em] text-white">
                  Most Popular
                </span>
              )}
              <h3 className="text-[1.1rem] font-bold">{tier.name}</h3>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-[2.8rem] font-extrabold tracking-[-0.03em]">
                  {yearly ? tier.amountYearly : tier.amount}
                </span>
                <span className="text-[0.95rem] text-mk-muted">
                  {yearly ? tier.perYearly : tier.per}
                </span>
              </p>
              <p className="mt-1.5 text-[0.9rem] text-mk-muted">
                {yearly ? tier.noteYearly : tier.note}
              </p>
              <ul className="my-6 grid list-none gap-[13px]">
                {tier.features.map((feature) => (
                  <li
                    key={feature.label}
                    className="flex items-center gap-[11px] text-[0.94rem] text-mk-text"
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-[7px] text-[0.8rem] font-extrabold",
                        feature.included
                          ? "border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.12)] text-note"
                          : "border border-mk-border bg-mk-surface-2 text-mk-dim",
                      )}
                    >
                      {feature.included ? "✓" : "–"}
                    </span>
                    {feature.label}
                  </li>
                ))}
              </ul>
              <MarketingButton href="/register" variant={tier.ctaVariant} block>
                {tier.cta}
              </MarketingButton>
            </article>
          </Reveal>
        ))}
      </div>
    </>
  );
}
