"use client";

// Shared scaffolding for /trackers/{type}/log pages. Provides the
// NavBar + GradientHero + sticky CTA so the three flows look like
// siblings.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { NavBar } from "@/components/primitives/nav-bar";
import { GradientHero } from "@/components/primitives/gradient-hero";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { TrackerIcon } from "@/components/icons/tracker-icon";
import { cn } from "@/lib/utils";

type Tone = "blue" | "peach" | "amber";
type IconVariant = "sleep" | "diaper" | "feed";

type Props = {
  tone: Tone;
  iconVariant: IconVariant;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  ctaLabel: string;
  ctaDisabled?: boolean;
  onSubmit: () => void;
  loading?: boolean;
};

export function LogShell({
  tone,
  iconVariant,
  title,
  subtitle,
  children,
  ctaLabel,
  ctaDisabled,
  onSubmit,
  loading,
}: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 32);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <main className="flex-1 flex flex-col bg-cream pb-32">
      <NavBar showBack backHref="/trackers" />
      <GradientHero tone={tone} className="pt-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="container-app flex flex-col items-center text-center gap-4"
        >
          <TrackerIcon variant={iconVariant} size={88} />
          <div className="flex flex-col gap-2 max-w-xs">
            <h1 className="font-display text-h1 text-ink">{title}</h1>
            <p className="text-small text-stone">{subtitle}</p>
          </div>
        </motion.div>
      </GradientHero>

      <div className="container-app pt-6 flex-1">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-5 flex flex-col gap-6"
        >
          {children}
        </motion.section>
      </div>

      <div
        className={cn(
          "fixed bottom-[72px] inset-x-0 z-30 transition-shadow",
          scrolled && "drop-shadow-[0_-12px_24px_rgba(31,27,24,0.06)]"
        )}
      >
        <div className="bg-gradient-to-t from-cream via-cream to-cream/0 pt-6 pb-3">
          <div className="container-app">
            <PrimaryCTA
              fullWidth
              onClick={onSubmit}
              disabled={ctaDisabled}
              loading={loading}
              showArrow
            >
              {ctaLabel}
            </PrimaryCTA>
          </div>
        </div>
      </div>
    </main>
  );
}
