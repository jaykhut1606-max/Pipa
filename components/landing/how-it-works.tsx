"use client";

// "How it works in 3 steps" — visual recipe (record/photo → analyze →
// guidance) so a first-time visitor can grasp the loop without scrolling
// through every feature card. Sits between the trust marquee and the
// scans grid for a "tell, then show" rhythm.
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Mic, Sparkles, Stethoscope } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";

const STEPS = [
  {
    n: "1",
    Icon: Mic,
    title: "Capture the moment",
    body: "Record a 5-second cry, snap a diaper or rash photo, or speak a quick log. One tap, no menus.",
    tint: "text-clay",
    halo: "bg-peach-soft",
  },
  {
    n: "2",
    Icon: Sparkles,
    title: "Pippa reads it",
    body: "On-call AI cross-references the cue with your baby's age, schedule, and recent patterns — in seconds.",
    tint: "text-amber",
    halo: "bg-amber-soft",
  },
  {
    n: "3",
    Icon: Stethoscope,
    title: "You get a calm next step",
    body: "Plain-English guidance with what to try, what to watch, and when to call your pediatrician. Never alarmist.",
    tint: "text-sage",
    halo: "bg-sage-soft",
  },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;
const STEP: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};
const STAGGER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

export function HowItWorks() {
  const reduce = useReducedMotion();
  return (
    <section className="container-marketing py-20 sm:py-24 flex flex-col gap-12">
      <SectionHeading
        eyebrow="How it works"
        title="Three steps. That's the whole app."
        body="No scrolling forums at 2am. No 'is this normal?' guesswork. Just a quick capture and a calm read."
        align="center"
      />
      <motion.ol
        variants={STAGGER}
        initial={reduce ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-4 relative"
      >
        {STEPS.map((step, idx) => (
          <motion.li
            key={step.n}
            variants={STEP}
            className="relative rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <span
                className={`size-12 rounded-pill ${step.halo} grid place-items-center`}
                aria-hidden
              >
                <step.Icon
                  className={`size-5 ${step.tint}`}
                  strokeWidth={2.2}
                />
              </span>
              <span className="text-micro uppercase tracking-wider text-stone">
                Step {step.n}
              </span>
            </div>
            <h3 className="font-display text-h3 text-plum">{step.title}</h3>
            <p className="text-small text-stone leading-relaxed">
              {step.body}
            </p>
            {idx < STEPS.length - 1 && (
              <span
                aria-hidden
                className="hidden md:grid absolute top-1/2 -right-3 size-6 rounded-pill bg-cream shadow-[var(--shadow-soft)] place-items-center text-stone"
              >
                <ArrowRight className="size-3.5" strokeWidth={2.2} />
              </span>
            )}
          </motion.li>
        ))}
      </motion.ol>
    </section>
  );
}
