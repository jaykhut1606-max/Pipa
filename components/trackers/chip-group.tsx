"use client";

// Single-select chip group for log flows. Selected chip animates a subtle
// scale 1 → 1.04 (motion-safe). Tap target stays ≥ 48px tall to clear the
// 44px floor.
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChipOption<T extends string = string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: ChipOption<T>[];
  value: T | null;
  onChange: (next: T | null) => void;
  showCheck?: boolean;
  ariaLabel?: string;
  className?: string;
  // When true, tapping the active chip clears the selection.
  allowClear?: boolean;
};

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  showCheck = false,
  ariaLabel,
  className,
  allowClear = false,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(allowClear && isSelected ? null : opt.value)}
            initial={false}
            animate={{ scale: isSelected ? 1.04 : 1 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "min-h-12 px-4 rounded-pill text-body font-medium inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-peach/40",
              isSelected
                ? "bg-peach text-ink shadow-[var(--shadow-soft)]"
                : "bg-cream border border-bone text-ink hover:bg-peach-soft/50"
            )}
          >
            {isSelected && showCheck && (
              <Check className="size-4" aria-hidden />
            )}
            <span>{opt.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
