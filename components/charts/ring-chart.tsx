"use client";

// Donut/ring chart for proportion-style metrics. Two segments only for v0 —
// this is plenty for diaper kind distribution (wet vs. dirty) or any other
// binary split. Built on a single SVG circle with stroke-dasharray.
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type ChartColor = "soft-blue" | "amber" | "peach" | "sage" | "plum";

type Segment = {
  key: string;
  value: number;
  color: ChartColor;
  label?: string;
};

type Props = {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSubLabel?: string;
  ariaLabel?: string;
  className?: string;
};

const COLOR_HEX: Record<ChartColor, string> = {
  "soft-blue": "#A8C0D6",
  amber: "#E8B86D",
  peach: "#F5A983",
  sage: "#7BA081",
  plum: "#4A3540",
};

export function RingChart({
  segments,
  size = 140,
  thickness = 14,
  centerLabel,
  centerSubLabel,
  ariaLabel,
  className,
}: Props) {
  const reduceMotion = useReducedMotion();
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = size / 2 - thickness / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const fraction = seg.value / total;
    const length = fraction * circumference;
    const arc = {
      ...seg,
      length,
      offset,
    };
    offset += length;
    return arc;
  });

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={ariaLabel}
          className="-rotate-90"
        >
          {/* track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E8E2D5"
            strokeWidth={thickness}
          />
          {arcs.map((arc, i) => (
            <motion.circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={COLOR_HEX[arc.color]}
              strokeWidth={thickness}
              strokeLinecap="butt"
              strokeDasharray={`${arc.length} ${circumference}`}
              strokeDashoffset={-arc.offset}
              initial={
                reduceMotion
                  ? { pathLength: 1 }
                  : { strokeDasharray: `0 ${circumference}` }
              }
              animate={{ strokeDasharray: `${arc.length} ${circumference}` }}
              transition={{
                duration: reduceMotion ? 0 : 0.7,
                delay: reduceMotion ? 0 : i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          ))}
        </svg>
        {(centerLabel || centerSubLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerLabel && (
              <span className="font-display text-h3 text-ink leading-none">
                {centerLabel}
              </span>
            )}
            {centerSubLabel && (
              <span className="text-micro uppercase tracking-wider text-stone mt-1">
                {centerSubLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {segments.length > 0 && (
        <ul className="flex flex-col gap-2">
          {segments.map((seg) => {
            const pct = Math.round((seg.value / total) * 100);
            return (
              <li
                key={seg.key}
                className="flex items-center gap-2 text-small text-ink"
              >
                <span
                  className="size-3 rounded-full shrink-0"
                  style={{ background: COLOR_HEX[seg.color] }}
                  aria-hidden
                />
                <span className="truncate">
                  {seg.label ?? seg.key}
                </span>
                <span className="text-stone">·</span>
                <span className="text-stone tabular-nums">{pct}%</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
