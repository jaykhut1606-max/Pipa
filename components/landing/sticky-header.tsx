"use client";

// Sticky marketing header. Background morphs from transparent → cream/90
// backdrop-blur as the user scrolls past 24px. Uses framer-motion useScroll
// for the cheap continuous binding (no ScrollTrigger needed for a single
// boolean threshold). The "Sign in" link is offset from the wordmark with
// gap-4 + shrink-0 + truncation so they never collide on iPhone SE (375px).
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

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
          className="flex items-center min-w-0 shrink"
        >
          {/* Brand lockup — character + "pippa" wordmark are baked into the
              image, so we don't render a separate <Wordmark> beside it. */}
          <Image
            src="/images/pippa-logo.png"
            alt="Pippa"
            width={56}
            height={56}
            priority
            className="size-14 object-contain mix-blend-multiply"
          />
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
