"use client";

// Feature card — TrackerIcon + h3 + body. Lifts on hover. Reveals
// itself with framer-motion when scrolled into view (whileInView).
// Used in the "What Pippa reads" and "What Pippa tracks" rows.
import { motion } from "framer-motion";
import { TrackerIcon } from "@/components/icons/tracker-icon";
import { cn } from "@/lib/utils";

type Variant =
  | "sleep"
  | "diaper"
  | "feed"
  | "note"
  | "cry"
  | "rash"
  | "chat"
  | "milestone"
  | "insights";

type Props = {
  variant: Variant;
  title: string;
  body: string;
  delay?: number;
  className?: string;
};

export function FeatureCard({ variant, title, body, delay = 0, className }: Props) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985, y: 0 }}
      className={cn(
        "group rounded-2xl bg-cream border border-bone/70 p-6 flex flex-col gap-4 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-pop)] transition-shadow",
        className,
      )}
    >
      <TrackerIcon variant={variant} size={64} />
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-h3 text-ink">{title}</h3>
        <p className="text-body text-stone">{body}</p>
      </div>
    </motion.article>
  );
}
