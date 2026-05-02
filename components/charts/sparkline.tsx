"use client";

// Custom SVG sparkline. Linear path connecting normalized values plus a soft
// area fill below it. Optional dots at each point. No chart library.
//
// Coordinate system: 100 wide × 40 tall, scaled by the wrapper. Stroke width
// is in user-space units, so we set vector-effect="non-scaling-stroke" to
// keep the line crisp at any rendered width.
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type ChartColor = "soft-blue" | "amber" | "peach" | "sage" | "plum";

type Bucket = { key: string; value: number; secondary?: number };

type Props = {
  buckets: Bucket[];
  color?: ChartColor;
  height?: number;
  ariaLabel?: string;
  showDots?: boolean;
  formatLabel?: (key: string) => string;
  className?: string;
};

const COLOR_HEX: Record<ChartColor, string> = {
  "soft-blue": "#A8C0D6",
  amber: "#E8B86D",
  peach: "#F5A983",
  sage: "#7BA081",
  plum: "#4A3540",
};

const VB_W = 100;
const VB_H = 40;
const PAD_Y = 3; // breathing room top + bottom so dots aren't clipped

export function Sparkline({
  buckets,
  color = "soft-blue",
  height = 120,
  ariaLabel,
  showDots = true,
  formatLabel,
  className,
}: Props) {
  const reduceMotion = useReducedMotion();
  const stroke = COLOR_HEX[color];

  if (buckets.length === 0) {
    return (
      <div
        className={cn(
          "h-[120px] rounded-xl bg-bone/40 grid place-items-center text-small text-stone",
          className
        )}
        style={{ height }}
        role="img"
        aria-label={ariaLabel}
      >
        No data yet.
      </div>
    );
  }

  const max = buckets.reduce((m, b) => Math.max(m, b.value), 0);
  const min = buckets.reduce((m, b) => Math.min(m, b.value), max);
  const range = max - min || 1;

  const drawableH = VB_H - PAD_Y * 2;
  const points = buckets.map((b, i) => {
    const x =
      buckets.length === 1
        ? VB_W / 2
        : (i / (buckets.length - 1)) * VB_W;
    const norm = (b.value - min) / range;
    const y = VB_H - PAD_Y - norm * drawableH;
    return { x, y, key: b.key };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x.toFixed(2)},${VB_H} L${points[0].x.toFixed(2)},${VB_H} Z`
      : "";

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
        {/* Soft area under the curve */}
        <motion.path
          d={areaPath}
          fill={stroke}
          fillOpacity={0.18}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: 0.15 }}
        />

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
        />

        {/* Optional dots */}
        {showDots &&
          points.map((p, i) => (
            <motion.circle
              key={p.key}
              cx={p.x}
              cy={p.y}
              r={1.6}
              fill={stroke}
              vectorEffect="non-scaling-stroke"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: reduceMotion ? 0 : 0.25,
                delay: reduceMotion ? 0 : 0.5 + i * 0.03,
              }}
            />
          ))}
      </svg>

      <div
        className="grid text-micro uppercase tracking-wider text-stone"
        style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}
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
    </div>
  );
}
