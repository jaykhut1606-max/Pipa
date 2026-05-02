"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  current: number; // 1-indexed
  total: number;
  className?: string;
};

// Four small dots; the active one expands and turns peach.
// Width animation gives it a Karl-Zentos pill feel without springing.
export function ProgressDots({ current, total, className }: Props) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`Step ${current} of ${total}`}
      className={cn("flex items-center justify-center gap-2", className)}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i + 1 === current;
        return (
          <motion.span
            key={i}
            aria-hidden
            initial={false}
            animate={{
              width: isActive ? 28 : 8,
              scale: isActive ? 1.15 : 1,
            }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "h-2 rounded-pill",
              isActive ? "bg-peach" : "bg-bone"
            )}
          />
        );
      })}
    </div>
  );
}
