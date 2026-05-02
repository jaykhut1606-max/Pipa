"use client";

// Big card toggle — three (or so) tap-targets that read like the "What was
// in there?" picker. Each option carries a label, a tone for its background,
// and an optional sub-label. Selected option gets a soft outline ring.
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type BigCardOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
  tone:
    | "peach-soft"
    | "amber-soft"
    | "rose-soft"
    | "soft-blue-soft"
    | "sage-soft";
};

const TONE_BG: Record<BigCardOption<string>["tone"], string> = {
  "peach-soft": "bg-peach-soft",
  "amber-soft": "bg-amber-soft",
  "rose-soft": "bg-rose-soft",
  "soft-blue-soft": "bg-soft-blue-soft",
  "sage-soft": "bg-sage-soft",
};

type Props<T extends string> = {
  options: BigCardOption<T>[];
  value: T | null;
  onChange: (next: T) => void;
  ariaLabel?: string;
  className?: string;
};

export function BigCardToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("grid grid-cols-3 gap-3", className)}
    >
      {options.map((opt) => {
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
              "rounded-2xl py-5 px-3 flex flex-col items-center gap-1 text-center transition-shadow focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-peach/40",
              TONE_BG[opt.tone],
              isSelected
                ? "ring-2 ring-ink shadow-[var(--shadow-soft)]"
                : "ring-0 hover:shadow-[var(--shadow-soft)]"
            )}
          >
            <span className="text-body font-medium text-ink">{opt.label}</span>
            {opt.description && (
              <span className="text-micro text-ink/70">{opt.description}</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
