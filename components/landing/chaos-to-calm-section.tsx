"use client";

// "Chaos to calm" emotional anchor — uses the user-provided illustration that
// frames Pippa's promise: parents go from a wall of sticky notes and red
// notifications to a single soft summary screen. We crop the illustration into
// two stacked panels on mobile (left → right of the source image) and keep
// it as one wide frame on desktop. The copy nails the value prop in a beat.
import Image from "next/image";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/landing/section-heading";

export function ChaosToCalmSection() {
  return (
    <section className="container-marketing py-20 sm:py-24 flex flex-col gap-10">
      <SectionHeading
        eyebrow="Why Pippa"
        title="From scattered to settled."
        body="One place for the photo, the cry, the log — and the quiet read on what it all adds up to."
        align="center"
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden ring-1 ring-bone/60 shadow-[var(--shadow-pop)] bg-cream"
      >
        <Image
          src="/images/chaos-to-calm.png"
          alt="On the left, a tired parent surrounded by chaos: notifications, alarm clocks, sticky notes, and a crying baby. On the right, the same parent looking calm with the Pippa app summary on their phone."
          width={1280}
          height={720}
          sizes="(min-width: 1024px) 800px, 100vw"
          className="w-full h-auto"
          priority={false}
        />
        {/* subtle overlay so labels read on hover */}
        <div className="absolute inset-x-0 bottom-0 hidden sm:flex justify-between gap-6 p-5 pointer-events-none">
          <span className="rounded-pill bg-cream/95 backdrop-blur px-3 py-1.5 text-micro uppercase tracking-wider text-clay font-medium shadow-[var(--shadow-soft)]">
            Before Pippa
          </span>
          <span className="rounded-pill bg-cream/95 backdrop-blur px-3 py-1.5 text-micro uppercase tracking-wider text-sage font-medium shadow-[var(--shadow-soft)]">
            With Pippa
          </span>
        </div>
      </motion.div>

      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 text-left">
        <li className="rounded-2xl bg-cream border border-bone/60 px-5 py-4 shadow-[var(--shadow-soft)]">
          <p className="font-display text-h3 text-ink">Three taps, no spreadsheet.</p>
          <p className="text-small text-stone mt-1">
            Sleep, feed, diaper — logged in seconds, voice or chip.
          </p>
        </li>
        <li className="rounded-2xl bg-cream border border-bone/60 px-5 py-4 shadow-[var(--shadow-soft)]">
          <p className="font-display text-h3 text-ink">Insight, not data dumps.</p>
          <p className="text-small text-stone mt-1">
            Daily, weekly, monthly summaries that read like a text from a friend.
          </p>
        </li>
        <li className="rounded-2xl bg-cream border border-bone/60 px-5 py-4 shadow-[var(--shadow-soft)]">
          <p className="font-display text-h3 text-ink">Calm at 2am.</p>
          <p className="text-small text-stone mt-1">
            Voice the moment, get a clear answer. No doom-scrolling.
          </p>
        </li>
      </ul>
    </section>
  );
}
