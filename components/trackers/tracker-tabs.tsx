"use client";

// Three-tab pill row used at the top of the trackers hub.
// Active segment is plum bg + cream text + soft shadow; inactive segments
// are stone text on a bone-tinted bg. Controlled via `value` / `onChange`.
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type TrackerTab = "track" | "summary" | "details";

const TABS: { value: TrackerTab; label: string }[] = [
  { value: "track", label: "Track" },
  { value: "summary", label: "Summary" },
  { value: "details", label: "Details" },
];

type Props = {
  value: TrackerTab;
  onChange: (next: TrackerTab) => void;
  className?: string;
};

export function TrackerTabs({ value, onChange, className }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Trackers view"
      className={cn(
        "relative w-full grid grid-cols-3 p-1 rounded-pill bg-bone/60",
        className
      )}
    >
      {TABS.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative h-11 inline-flex items-center justify-center rounded-pill text-small font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-plum/30",
              isActive ? "text-cream" : "text-stone hover:text-ink"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="tracker-tab-pill"
                aria-hidden
                className="absolute inset-0 bg-plum rounded-pill shadow-[var(--shadow-soft)]"
                transition={{
                  type: "tween",
                  duration: 0.25,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
