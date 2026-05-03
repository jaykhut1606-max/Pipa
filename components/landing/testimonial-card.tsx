"use client";

// Testimonial card — cream rounded card with avatar circle, quote in body
// type, author + small attribution. Reveals on scroll. Avatar is a colored
// disc with the author's initial in Fraunces (no emoji avatars per founder
// note: "too emoji-like").
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tone = "peach" | "sage" | "soft-blue" | "rose" | "amber" | "lavender";

const AVATAR_BG: Record<Tone, string> = {
  peach: "bg-peach-soft text-clay",
  sage: "bg-sage-soft text-sage",
  "soft-blue": "bg-soft-blue-soft text-vivid-blue",
  rose: "bg-rose-soft text-rose",
  amber: "bg-amber-soft text-clay",
  lavender: "bg-lavender text-plum",
};

type Props = {
  initial: string;
  tone: Tone;
  quote: string;
  name: string;
  meta: string;
  delay?: number;
};

export function TestimonialCard({
  initial,
  tone,
  quote,
  name,
  meta,
  delay = 0,
}: Props) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl bg-cream border border-bone/70 p-6 flex flex-col gap-5 shadow-[var(--shadow-soft)]"
    >
      <blockquote className="text-body text-ink leading-relaxed">
        <span aria-hidden className="font-display text-h2 text-peach leading-none">
          “
        </span>
        <span className="block mt-1">{quote}</span>
      </blockquote>
      <figcaption className="flex items-center gap-3 mt-auto">
        <span
          aria-hidden
          className={cn(
            "size-10 rounded-full grid place-items-center font-display font-medium text-h3 shrink-0",
            AVATAR_BG[tone],
          )}
        >
          {initial}
        </span>
        <span className="flex flex-col min-w-0">
          <span className="text-small text-ink font-medium truncate">{name}</span>
          <span className="text-micro text-stone uppercase tracking-wider truncate">
            {meta}
          </span>
        </span>
      </figcaption>
    </motion.figure>
  );
}
