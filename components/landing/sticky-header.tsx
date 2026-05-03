"use client";

// Sticky marketing header. Background morphs from transparent → cream/90
// backdrop-blur as the user scrolls past 24px. Uses framer-motion useScroll
// for the cheap continuous binding (no ScrollTrigger needed for a single
// boolean threshold). The "Sign in" link is offset from the wordmark with
// gap-4 + shrink-0 + truncation so they never collide on iPhone SE (375px).
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Wordmark } from "@/components/brand/wordmark";

export function StickyHeader() {
  const { scrollY } = useScroll();
  // Fade the cream backdrop in from 0 → 0.92 across the first 80px of scroll.
  const bg = useTransform(scrollY, [0, 80], ["rgba(251,247,242,0)", "rgba(251,247,242,0.92)"]);
  const border = useTransform(
    scrollY,
    [0, 80],
    ["rgba(232,226,213,0)", "rgba(232,226,213,1)"],
  );

  return (
    <motion.header
      style={{ background: bg, borderBottomColor: border }}
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md motion-reduce:bg-cream/80"
    >
      <div className="container-marketing flex items-center justify-between py-3 gap-4">
        <Link
          href="/"
          aria-label="Pippa home"
          className="flex items-center gap-2.5 min-w-0 shrink"
        >
          {/* iOS-app-icon squircle with the character mark inside.
              Container provides peach-tinted depth (gradient + inset
              shadow + outer drop shadow); the image fills it and uses
              mix-blend-multiply so its cream pixels disappear into
              the gradient. */}
          <span
            aria-hidden
            className="relative grid place-items-center size-10 overflow-hidden shadow-[0_4px_10px_-2px_rgba(245,169,131,0.45),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-2px_4px_rgba(74,53,64,0.10)]"
            style={{
              borderRadius: "28%",
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 32%), linear-gradient(135deg, var(--color-peach-soft) 0%, var(--color-vivid-peach-soft) 100%)",
            }}
          >
            <Image
              src="/images/pippa-mark.png"
              alt="Pippa"
              width={40}
              height={40}
              priority
              className="size-full object-cover mix-blend-multiply"
            />
          </span>
          <Wordmark className="text-h3" />
        </Link>
        <Link
          href="/signin"
          className="text-small text-stone hover:text-ink h-11 inline-flex items-center px-2 -mr-2 shrink-0 truncate"
        >
          Sign in
        </Link>
      </div>
    </motion.header>
  );
}
