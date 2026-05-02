"use client";

// Three-segment pill toggle that controls the bucketing of the insights API.
// Active segment is plum bg + cream text + soft shadow; inactive segments are
// stone text on a bone-tinted background. Mirrors the tracker-tabs visual
// language so the two pages feel like a family.
import { motion } from "framer-motion";
import type { InsightGranularity } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  value: InsightGranularity;
  setValue: (next: InsightGranularity) => void;
  className?: string;
};

const SEGMENTS: { value: InsightGranularity; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export function GranularityToggle({ value, setValue, className }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Insights granularity"
      className={cn(
        "relative w-full grid grid-cols-3 p-1 rounded-pill bg-bone/60",
        className
      )}
    >
      {SEGMENTS.map((segment) => {
        const isActive = segment.value === value;
        return (
          <button
            key={segment.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setValue(segment.value)}
            className={cn(
              "relative h-11 inline-flex items-center justify-center rounded-pill text-small font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-plum/30",
              isActive ? "text-cream" : "text-stone hover:text-ink"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="granularity-pill"
                aria-hidden
                className="absolute inset-0 bg-plum rounded-pill shadow-[var(--shadow-soft)]"
                transition={{
                  type: "tween",
                  duration: 0.25,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            )}
            <span className="relative z-10">{segment.label}</span>
          </button>
        );
      })}
    </div>
  );
}
