"use client";

import { motion, type Variants } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export type ChipOption = {
  value: string;
  label: string;
};

type Props = {
  options: ChipOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  className?: string;
  ariaLabel?: string;
};

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const chipVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT_EXPO },
  },
};

// Wrap-flow chip group. Selected chips swap to bg-peach + a check.
// Tap target stays ≥ 48px tall to clear the spec's 44px floor.
export function ChipMultiselect({
  options,
  selected,
  onChange,
  className,
  ariaLabel,
}: Props) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <motion.ul
      role="group"
      aria-label={ariaLabel}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={cn("flex flex-wrap gap-2.5", className)}
    >
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <motion.li key={opt.value} variants={chipVariants}>
            <button
              type="button"
              onClick={() => toggle(opt.value)}
              aria-pressed={isSelected}
              className={cn(
                "min-h-12 px-5 rounded-pill text-body font-medium inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-peach/40",
                isSelected
                  ? "bg-peach text-ink shadow-[var(--shadow-soft)]"
                  : "bg-cream border border-bone text-ink hover:bg-peach-soft/60"
              )}
            >
              {isSelected && <Check className="size-4" aria-hidden />}
              <span>{opt.label}</span>
            </button>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
