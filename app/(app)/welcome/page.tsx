// First post-signup screen. Sets the warm-not-clinical tone:
// peach gradient hero, floating baby character, Pippa's first hello,
// and a single CTA into the four-step onboarding.
"use client";

import { motion } from "framer-motion";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { Character } from "@/components/primitives/character";
import { SpeechBubble } from "@/components/primitives/speech-bubble";
import { GradientHero } from "@/components/primitives/gradient-hero";

export default function WelcomePage() {
  return (
    <GradientHero
      tone="peach"
      className="flex-1 flex flex-col items-center text-center"
    >
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="container-app flex-1 flex flex-col items-center justify-center gap-8 py-12"
      >
        <div className="relative">
          <Character variant="baby" bg="peach" size="xl" float />
          <div className="absolute -top-3 -right-2 sm:-right-6 motion-safe:animate-[fadeUp_0.6s_ease-out]">
            <SpeechBubble pointer="down">Hi, I&rsquo;m Pippa.</SpeechBubble>
          </div>
        </div>

        <div className="flex flex-col gap-4 max-w-sm">
          <h1 className="font-display text-hero text-ink">
            Let&rsquo;s get to know your baby.
          </h1>
          <p className="text-body text-stone">
            A few quick questions so I can help you better. About 30 seconds.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs items-center">
          <PrimaryCTA href="/onboarding/age" showArrow fullWidth>
            Continue
          </PrimaryCTA>
          <p className="text-micro uppercase tracking-wider text-stone pt-2">
            Educational support, not medical diagnosis or treatment.
          </p>
        </div>
      </motion.main>
    </GradientHero>
  );
}
