"use client";

// Shared scaffolding for each onboarding step.
// Page-level GradientHero covers the full content column; the layout above
// already supplies the NavBar + ProgressDots, so this component is just the
// centered card stack.
//
// Visual: the Pippa mascot stays consistent across all four steps (mascot is
// the brand voice; gradient + content is what tells you which step you're on).
// The previous emoji Character has been retired — too platform-dependent and
// off-brand.
//
// `characterVariant` and `characterBg` are accepted for callsite back-compat
// but ignored. They'll be removed once all four pages are updated.
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { GradientHero } from "@/components/primitives/gradient-hero";
import { cn } from "@/lib/utils";

type Tone = "peach" | "sage" | "rose" | "amber" | "blue" | "lavender" | "cream";

type Props = {
  tone: Tone;
  characterVariant?: string;
  characterBg?: string;
  // Optional per-step illustration. Falls back to the Pippa mascot.
  imageSrc?: string;
  imageAlt?: string;
  imageSize?: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  className?: string;
};

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

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
  imageSrc = "/images/pippa-mascot.png",
  imageAlt = "Pippa mascot",
  imageSize = 176,
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
        <motion.div
          variants={item}
          className="relative motion-safe:animate-[float_6s_ease-in-out_infinite]"
          style={{ width: imageSize, height: imageSize }}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes={`${imageSize}px`}
            className="object-contain [filter:var(--drop-shadow-mascot)]"
            priority
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
