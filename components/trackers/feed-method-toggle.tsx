"use client";

// Three-way feed-method picker (Breast / Bottle / Solids). Same shape as
// BigCardToggle but with a richer label area — the method choice changes
// every other field on the page so it deserves the visual weight.
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type FeedMethod = "breast" | "bottle" | "solids";

const OPTIONS: {
  value: FeedMethod;
  label: string;
  caption: string;
  tone: string;
}[] = [
  { value: "breast", label: "Nurse", caption: "Left, right, or both", tone: "bg-rose-soft" },
  { value: "bottle", label: "Bottle", caption: "Breast milk or formula", tone: "bg-amber-soft" },
  { value: "solids", label: "Solids", caption: "Foods sampled", tone: "bg-sage-soft" },
];

type Props = {
  value: FeedMethod | null;
  onChange: (next: FeedMethod) => void;
  className?: string;
};

export function FeedMethodToggle({ value, onChange, className }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Feeding method"
      className={cn("grid grid-cols-3 gap-3", className)}
    >
      {OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            initial={false}
            animate={{ scale: isSelected ? 1.04 : 1 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "rounded-2xl py-5 px-2.5 flex flex-col items-center gap-1 text-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-peach/40",
              opt.tone,
              isSelected
                ? "ring-2 ring-ink shadow-[var(--shadow-soft)]"
                : "ring-0 hover:shadow-[var(--shadow-soft)]"
            )}
          >
            <span className="text-body font-medium text-ink">{opt.label}</span>
            <span className="text-micro text-ink/70 leading-tight">
              {opt.caption}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
