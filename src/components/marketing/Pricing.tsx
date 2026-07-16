import { PricingPlans } from "./PricingPlans";
import { SectionHead } from "./SectionHead";

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative z-[1] mx-auto max-w-[1180px] scroll-mt-20 px-6 py-24"
    >
      <SectionHead
        eyebrow="Simple pricing"
        title="Start free, upgrade when you grow"
        className="mb-6"
      />
      <PricingPlans />
    </section>
  );
}
