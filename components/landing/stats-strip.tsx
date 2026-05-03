"use client";

// "By the numbers" strip — sits just under the hero. Four high-trust
// proof points in one row with subtle scroll-fade so the page feels
// alive but not noisy. Designed to be honest claims (no fabricated
// user counts), so the figures are about the product itself.
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  AlarmClock,
  HeartHandshake,
  Lock,
  Stethoscope,
} from "lucide-react";

const ITEMS = [
  {
    Icon: AlarmClock,
    value: "<5 min",
    label: "to your first scan",
    tint: "text-clay",
    halo: "bg-peach-soft",
  },
  {
    Icon: Stethoscope,
    value: "AAP",
    label: "& CDC-aligned guidance",
    tint: "text-sage",
    halo: "bg-sage-soft",
  },
  {
    Icon: Lock,
    value: "0",
    label: "photos or audio stored",
    tint: "text-vivid-blue",
    halo: "bg-soft-blue-soft",
  },
  {
    Icon: HeartHandshake,
    value: "24 / 7",
    label: "AI co-pilot, day or night",
    tint: "text-rose",
    halo: "bg-rose-soft",
  },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;
const ITEM: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};
const STAGGER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export function StatsStrip() {
  const reduce = useReducedMotion();
  return (
    <section
      aria-label="Pippa by the numbers"
      className="container-marketing py-10 sm:py-14"
    >
      <motion.ul
        variants={STAGGER}
        initial={reduce ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5"
      >
        {ITEMS.map(({ Icon, value, label, tint, halo }) => (
          <motion.li
            key={label}
            variants={ITEM}
            className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-5 flex flex-col items-start gap-3"
          >
            <span
              className={`size-10 rounded-pill ${halo} grid place-items-center`}
              aria-hidden
            >
              <Icon className={`size-5 ${tint}`} strokeWidth={2.2} />
            </span>
            <p className="font-display text-h2 text-ink leading-none">
              {value}
            </p>
            <p className="text-small text-stone leading-snug">{label}</p>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
