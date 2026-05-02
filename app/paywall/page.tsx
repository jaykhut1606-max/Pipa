"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Wordmark } from "@/components/brand/wordmark";
import { Character } from "@/components/primitives/character";
import { SpeechBubble } from "@/components/primitives/speech-bubble";
import { GradientHero } from "@/components/primitives/gradient-hero";
import { PlanCard } from "@/components/primitives/plan-card";
import { PrimaryCTA } from "@/components/primitives/primary-cta";

type Tier = "weekly" | "yearly" | "lifetime";

const FEATURES = [
  "Unlimited diaper, cry, and rash scans",
  "AI chat with Pippa, day or night",
  "Full history and timeline",
  "Pediatrician escalation guidance",
];

export default function PaywallPage() {
  const [tier, setTier] = useState<Tier>("yearly");
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(
          data.error ?? "Stripe isn't ready yet. Check back soon."
        );
      }
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientHero tone="peach" className="min-h-screen flex flex-col">
      <header className="container-app flex items-center justify-between py-5">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <Wordmark className="text-h3" />
        </div>
        <a
          href="/scan"
          className="text-small text-stone hover:text-ink h-11 inline-flex items-center"
        >
          Maybe later
        </a>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="container-app flex-1 flex flex-col items-center text-center gap-8 pb-32"
      >
        <div className="relative">
          <Character variant="rocket" bg="peach" size="lg" />
          <div className="absolute -top-2 right-[-8px]">
            <SpeechBubble pointer="down">Always-on Pippa.</SpeechBubble>
          </div>
        </div>

        <div className="flex flex-col gap-3 max-w-md">
          <h1 className="font-display text-h1 text-ink">
            Pippa, whenever you need her.
          </h1>
          <p className="text-body text-stone">
            One subscription for the whole family. Three days free on the
            yearly plan. Cancel anytime.
          </p>
        </div>

        <ul className="flex flex-col gap-2 text-left max-w-sm w-full">
          {FEATURES.map((f) => (
            <li
              key={f}
              className="flex items-start gap-3 rounded-2xl bg-cream/70 backdrop-blur px-4 py-3 shadow-[var(--shadow-soft)]"
            >
              <span
                aria-hidden
                className="mt-1 size-2 rounded-pill bg-peach shrink-0"
              />
              <span className="text-body text-ink">{f}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <PlanCard
            variant={tier === "weekly" ? "highlighted" : "subtle"}
            label="Weekly"
            price="$9.99"
            weeklyEquiv="Cancel anytime"
            onClick={() => setTier("weekly")}
          />
          <PlanCard
            variant={tier === "yearly" ? "highlighted" : "subtle"}
            label="Yearly"
            price="$69.99"
            meta="Save 86%"
            weeklyEquiv="$1.34/wk · 3-day free trial"
            onClick={() => setTier("yearly")}
          />
          <PlanCard
            variant={tier === "lifetime" ? "highlighted" : "subtle"}
            label="Lifetime"
            price="$129"
            weeklyEquiv="One-time, never billed again"
            onClick={() => setTier("lifetime")}
          />
        </div>
      </motion.main>

      <div className="sticky bottom-0 bg-cream/95 backdrop-blur-md border-t border-bone px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="container-app flex flex-col gap-2">
          <PrimaryCTA
            fullWidth
            showArrow
            onClick={startCheckout}
            loading={loading}
          >
            Start with{" "}
            {tier === "weekly"
              ? "weekly"
              : tier === "yearly"
                ? "3-day free trial"
                : "lifetime"}
          </PrimaryCTA>
          <p className="text-micro uppercase tracking-wider text-stone text-center">
            Educational support, not medical advice.
          </p>
        </div>
      </div>
    </GradientHero>
  );
}
