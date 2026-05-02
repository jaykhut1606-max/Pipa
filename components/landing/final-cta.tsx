"use client";

// Sage-soft band with a final headline + primary CTA. Decorative orbs
// echo the hero so the page closes the loop visually.
import { motion } from "framer-motion";
import { PrimaryCTA } from "@/components/primitives/primary-cta";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sage-soft via-mint to-cream">
      {/* Decorative orbs */}
      <span
        aria-hidden
        className="absolute -top-16 -left-12 size-48 rounded-full bg-peach-soft blur-3xl opacity-70"
      />
      <span
        aria-hidden
        className="absolute -bottom-16 -right-12 size-56 rounded-full bg-vivid-peach-soft blur-3xl opacity-60"
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="container-marketing relative py-20 sm:py-28 flex flex-col items-center gap-7 text-center"
      >
        <h2 className="font-display text-h1 sm:text-hero text-ink leading-tight max-w-[18ch]">
          Ready to understand a little more?
        </h2>
        <p className="text-body text-stone max-w-md">
          Take the demo for a spin. No signup, no card — see if Pippa fits
          your family.
        </p>
        <div className="w-full max-w-xs">
          <PrimaryCTA href="/welcome" showArrow fullWidth>
            Try Pippa
          </PrimaryCTA>
        </div>
        <p className="text-micro uppercase tracking-wider text-stone">
          About 30 seconds · No signup needed
        </p>
      </motion.div>
    </section>
  );
}
