"use client";

// Custom SVG bar chart. No chart library — geometry is computed inline so the
// page can ship without any extra dependency. Supports an optional `secondary`
// series stacked on top of the primary value (used for diaper wet/dirty).
//
// The component renders a fixed-coordinate viewBox (100x100) and lets the
// browser scale the SVG horizontally. Bar widths are computed in SVG units;
// x-axis labels live in the HTML below the SVG so they stay crisp at any size.
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type ChartColor = "soft-blue" | "amber" | "peach" | "sage" | "plum";

type Bucket = { key: string; value: number; secondary?: number };

type Props = {
  buckets: Bucket[];
  color?: ChartColor;
  secondaryColor?: ChartColor;
  height?: number;
  ariaLabel?: string;
  formatLabel?: (key: string) => string;
  className?: string;
};

// Hex values pulled from app/globals.css so the SVG fills don't depend on
// Tailwind class resolution inside an SVG `fill` attribute (which doesn't
// pick up custom CSS variables reliably across browsers).
const COLOR_HEX: Record<ChartColor, string> = {
  "soft-blue": "#A8C0D6",
  amber: "#E8B86D",
  peach: "#F5A983",
  sage: "#7BA081",
  plum: "#4A3540",
};

const VB_W = 100;
const VB_H = 60;

export function BarChart({
  buckets,
  color = "soft-blue",
  secondaryColor = "sage",
  height = 140,
  ariaLabel,
  formatLabel,
  className,
}: Props) {
  const reduceMotion = useReducedMotion();
  const hasSecondary = buckets.some((b) => typeof b.secondary === "number");

  // Max combines primary + secondary so the stack never overflows the chart.
  const max = buckets.reduce((m, b) => {
    const total = b.value + (b.secondary ?? 0);
    return Math.max(m, total);
  }, 0);
  const safeMax = max > 0 ? max : 1;

  const n = Math.max(buckets.length, 1);
  // Gap is 25% of the slot width; bar takes the remaining 75%.
  const slot = VB_W / n;
  const barW = slot * 0.7;
  const gap = slot * 0.3;
  const rx = Math.min(barW / 4, 1.6);

  const primaryFill = COLOR_HEX[color];
  const secondaryFill = COLOR_HEX[secondaryColor];

  // Show a sparse set of labels — first / middle / last — so things stay
  // readable on phones. If we have ≤ 4 buckets, show all of them.
  const labelIndices: number[] =
    buckets.length <= 4
      ? buckets.map((_, i) => i)
      : Array.from(
          new Set([0, Math.floor((buckets.length - 1) / 2), buckets.length - 1])
        );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        role="img"
        aria-label={ariaLabel}
        className="overflow-visible"
      >
        {buckets.map((b, i) => {
          const primaryHeight = (b.value / safeMax) * VB_H;
          const secondary = b.secondary ?? 0;
          const secondaryHeight = (secondary / safeMax) * VB_H;
          const x = i * slot + gap / 2;

          const primaryY = VB_H - primaryHeight;
          const secondaryY = primaryY - secondaryHeight;

          // Initial state for grow animation — height 0, anchored at baseline.
          const initialPrimary = reduceMotion
            ? { height: primaryHeight, y: primaryY }
            : { height: 0, y: VB_H };
          const animatePrimary = { height: primaryHeight, y: primaryY };

          const initialSecondary = reduceMotion
            ? { height: secondaryHeight, y: secondaryY }
            : { height: 0, y: primaryY };
          const animateSecondary = { height: secondaryHeight, y: secondaryY };

          return (
            <g key={b.key}>
              <motion.rect
                x={x}
                width={barW}
                rx={rx}
                fill={primaryFill}
                initial={initialPrimary}
                animate={animatePrimary}
                transition={{
                  duration: reduceMotion ? 0 : 0.55,
                  delay: reduceMotion ? 0 : i * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
              {hasSecondary && secondary > 0 && (
                <motion.rect
                  x={x}
                  width={barW}
                  rx={rx}
                  fill={secondaryFill}
                  initial={initialSecondary}
                  animate={animateSecondary}
                  transition={{
                    duration: reduceMotion ? 0 : 0.55,
                    delay: reduceMotion ? 0 : i * 0.04 + 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {buckets.length > 0 && (
        <div className="grid text-micro uppercase tracking-wider text-stone"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        >
          {buckets.map((b, i) => (
            <span
              key={b.key}
              className={cn(
                "text-center truncate",
                !labelIndices.includes(i) && "opacity-0"
              )}
              aria-hidden={!labelIndices.includes(i)}
            >
              {formatLabel ? formatLabel(b.key) : b.key}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
