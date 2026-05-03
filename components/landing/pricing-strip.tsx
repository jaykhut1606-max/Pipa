"use client";

// Compact pricing teaser — three plans side-by-side, the Yearly slot
// highlighted with a peach border. Tap on the strip routes to /paywall.
// Numbers mirror app/paywall/page.tsx — keep these in sync if pricing
// changes.
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Plan = {
  label: string;
  price: string;
  meta: string;
  highlight?: boolean;
};

const PLANS: Plan[] = [
  { label: "Weekly", price: "$9.99", meta: "Cancel anytime" },
  {
    label: "Yearly",
    price: "$69.99",
    meta: "$1.34/wk · 3-day trial",
    highlight: true,
  },
  { label: "Lifetime", price: "$129", meta: "Pay once, keep forever" },
];

export function PricingStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl bg-cream border border-bone p-6 sm:p-8 shadow-[var(--shadow-soft)] flex flex-col gap-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-micro uppercase tracking-wider text-clay font-medium">
            Plans
          </p>
          <h3 className="font-display text-h2 text-ink">
            Honest pricing. Free to start.
          </h3>
        </div>
        <Link
          href="/paywall"
          className="hidden sm:inline-flex items-center gap-1.5 text-small text-ink hover:underline underline-offset-4 shrink-0 h-11 px-2"
        >
          See plans
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLANS.map((plan) => (
          <Link
            key={plan.label}
            href="/paywall"
            className={cn(
              "rounded-lg p-4 flex flex-col gap-1 transition-colors",
              plan.highlight
                ? "bg-peach-soft/60 border-2 border-peach hover:bg-peach-soft"
                : "bg-cream border border-bone hover:bg-bone/30",
            )}
          >
            <span className="text-micro uppercase tracking-wider text-stone">
              {plan.label}
            </span>
            <span className="font-display text-h2 text-ink leading-none">
              {plan.price}
            </span>
            <span className="text-small text-stone">{plan.meta}</span>
          </Link>
        ))}
      </div>

      <Link
        href="/paywall"
        className="sm:hidden inline-flex items-center justify-center gap-1.5 text-small text-ink rounded-pill bg-bone/40 h-11 px-4"
      >
        See plans
        <ArrowUpRight className="size-4" aria-hidden />
      </Link>
    </motion.div>
  );
}
