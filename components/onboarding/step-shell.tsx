"use client";

import { motion } from "framer-motion";
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="container-app flex-1 flex flex-col items-center text-center pt-6 pb-10 gap-6"
      >
        <Character
          variant={characterVariant}
          bg={characterBg}
          size="lg"
          float
        />
        <div className="flex flex-col gap-3 max-w-sm">
          <h1 className="font-display text-h1 text-ink">{title}</h1>
          {subtitle && (
            <p className="text-body text-stone">{subtitle}</p>
          )}
        </div>
        <div className="w-full flex flex-col gap-4 items-stretch">
          {children}
        </div>
        <div className="mt-auto w-full flex flex-col gap-3 items-center pt-4">
          {footer}
        </div>
      </motion.div>
    </GradientHero>
  );
}
