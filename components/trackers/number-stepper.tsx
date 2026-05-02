"use client";

// Plus/minus stepper for numeric fields (per-side breast minutes,
// bottle ml, etc.). Tap targets ≥ 44px.
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  className?: string;
  ariaLabel?: string;
};

export function NumberStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  unit,
  className,
  ariaLabel,
}: Props) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-pill bg-cream border border-bone p-1",
        className
      )}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="Decrease"
        className="size-11 grid place-items-center rounded-pill text-ink hover:bg-bone/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="min-w-16 text-center text-body font-medium text-ink tabular-nums">
        {value}
        {unit ? ` ${unit}` : ""}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label="Increase"
        className="size-11 grid place-items-center rounded-pill text-ink hover:bg-bone/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
