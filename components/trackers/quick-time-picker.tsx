"use client";

// "When?" selector — preset chips (Just now / 5m ago / etc.) plus a Custom
// option that reveals a native time input. Returns an absolute Date through
// onChange so callers don't have to reimplement the offset math.
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type QuickPreset = {
  value: string;
  label: string;
  // Minutes ago. null means "custom".
  offsetMin: number | null;
};

type Props = {
  presets: QuickPreset[];
  value: Date;
  onChange: (next: Date) => void;
  className?: string;
};

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function timeStringFromDate(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function dateFromTimeString(time: string, base: Date): Date {
  const [hh, mm] = time.split(":").map((s) => Number.parseInt(s, 10));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return base;
  const next = new Date(base);
  next.setHours(hh, mm, 0, 0);
  // If the chosen time is in the future today, assume the user meant
  // yesterday — common for late-night logs.
  if (next.getTime() > Date.now()) {
    next.setDate(next.getDate() - 1);
  }
  return next;
}

export function QuickTimePicker({
  presets,
  value,
  onChange,
  className,
}: Props) {
  const [activePreset, setActivePreset] = useState<string>(
    () => presets[0]?.value ?? "now"
  );
  const [customTime, setCustomTime] = useState<string>(() =>
    timeStringFromDate(value)
  );

  // Keep the visible custom time fresh when another control updates `value`.
  useEffect(() => {
    setCustomTime(timeStringFromDate(value));
  }, [value]);

  const isCustom = useMemo(
    () => presets.find((p) => p.value === activePreset)?.offsetMin === null,
    [activePreset, presets]
  );

  function handlePreset(p: QuickPreset) {
    setActivePreset(p.value);
    if (p.offsetMin !== null) {
      const next = new Date(Date.now() - p.offsetMin * 60_000);
      onChange(next);
    }
  }

  function handleCustom(time: string) {
    setCustomTime(time);
    onChange(dateFromTimeString(time, new Date()));
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div role="radiogroup" className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const isSelected = activePreset === preset.value;
          return (
            <motion.button
              key={preset.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handlePreset(preset)}
              initial={false}
              animate={{ scale: isSelected ? 1.04 : 1 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "min-h-12 px-4 rounded-pill text-body font-medium inline-flex items-center transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-peach/40",
                isSelected
                  ? "bg-peach text-ink shadow-[var(--shadow-soft)]"
                  : "bg-cream border border-bone text-ink hover:bg-peach-soft/50"
              )}
            >
              {preset.label}
            </motion.button>
          );
        })}
      </div>
      {isCustom && (
        <label className="flex items-center gap-3 rounded-2xl bg-cream border border-bone px-4 py-3">
          <span className="text-small text-stone">Time</span>
          <input
            type="time"
            value={customTime}
            onChange={(e) => handleCustom(e.target.value)}
            className="flex-1 bg-transparent text-body text-ink focus:outline-none"
          />
        </label>
      )}
    </div>
  );
}
