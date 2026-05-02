"use client";

import { motion, type Variants } from "framer-motion";
import { GradientHero } from "@/components/primitives/gradient-hero";
import { Character } from "@/components/primitives/character";
import { cn } from "@/lib/utils";

type CharacterVariant =
  | "baby"
  | "moon"
  | "bottle"
  | "bear"
  | "shield"
  | "rocket"
  | "stars"
  | "sparkle"
  | "heart"
  | "rainbow"
  | "thinking"
  | "celebrate";

type Tone = "peach" | "sage" | "rose" | "amber" | "blue" | "lavender" | "cream";
type CharBg =
  | "peach"
  | "sage"
  | "rose"
  | "amber"
  | "soft-blue"
  | "lavender"
  | "mint"
  | "cream";

type Props = {
  tone: Tone;
  characterVariant: CharacterVariant;
  characterBg: CharBg;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  className?: string;
};

// Shared scaffolding for each onboarding step.
// Page-level GradientHero covers the full content column; the layout above
// already supplies the NavBar + ProgressDots, so this component is just
// the centered card stack.
//
// Lifted entrance: a parent variant orchestrates a 60ms stagger across
// Character → title → subtitle → form fields → footer CTA. Reduced motion
// users get the final state with no transition (framer-motion respects
// prefers-reduced-motion automatically when transitions are short).
const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

// Easing tuple is `as const` so TS resolves it to the readonly Bezier
// definition Framer Motion expects (not a generic `number[]`).
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function StepShell({
  tone,
  characterVariant,
  characterBg,
  title,
  subtitle,
  children,
  footer,
  className,
}: Props) {
  return (
    <GradientHero
      tone={tone}
      className={cn("flex-1 flex flex-col", className)}
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="container-app flex-1 flex flex-col items-center text-center pt-6 pb-10 gap-6"
      >
        <motion.div variants={item}>
          <Character
            variant={characterVariant}
            bg={characterBg}
            size="lg"
            float
          />
        </motion.div>
        <div className="flex flex-col gap-3 max-w-sm">
          <motion.h1
            variants={item}
            className="font-display text-h1 text-ink"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p variants={item} className="text-body text-stone">
              {subtitle}
            </motion.p>
          )}
        </div>
        <motion.div
          variants={item}
          className="w-full flex flex-col gap-4 items-stretch"
        >
          {children}
        </motion.div>
        <motion.div
          variants={item}
          className="mt-auto w-full flex flex-col gap-3 items-center pt-4"
        >
          {footer}
        </motion.div>
      </motion.div>
    </GradientHero>
  );
}
