"use client";

// Decorative mini bar chart used inside the "What Pippa tracks" section.
// Pure SVG, no data — just a stylized 7-day preview that fades + grows on
// scroll-in. Bars use peach/sage/soft-blue tokens to match Insights icon.
import { motion } from "framer-motion";

const BARS = [
  { h: 38, color: "var(--color-peach)" },
  { h: 56, color: "var(--color-sage)" },
  { h: 32, color: "var(--color-amber)" },
  { h: 64, color: "var(--color-peach)" },
  { h: 48, color: "var(--color-soft-blue)" },
  { h: 72, color: "var(--color-sage)" },
  { h: 54, color: "var(--color-peach)" },
];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function MiniChart() {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl bg-cream border border-bone/70 p-6 shadow-[var(--shadow-soft)] max-w-lg mx-auto w-full"
    >
      <figcaption className="flex items-center justify-between mb-5 text-left">
        <div>
          <p className="text-micro uppercase tracking-wider text-stone">
            This week · Sleep
          </p>
          <p className="font-display text-h3 text-ink mt-1">14h 12m / day</p>
        </div>
        <span className="rounded-pill bg-sage-soft text-sage px-3 py-1 text-small font-medium">
          +28m vs last week
        </span>
      </figcaption>

      <div className="flex items-end justify-between gap-2 h-24">
        {BARS.map((bar, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-2 justify-end h-full"
          >
            <motion.span
              initial={{ height: 0 }}
              whileInView={{ height: bar.h }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{
                duration: 0.7,
                delay: 0.1 + i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="w-full rounded-t-md"
              style={{ background: bar.color, minHeight: 4 }}
            />
            <span className="text-micro text-stone">{DAYS[i]}</span>
          </div>
        ))}
      </div>
    </motion.figure>
  );
}
