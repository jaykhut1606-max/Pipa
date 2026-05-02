"use client";

import { cn } from "@/lib/utils";

type Variant = "subtle" | "highlighted";

type Props = {
  variant: Variant;
  label: string;
  price: string;
  meta?: string;
  weeklyEquiv?: string;
  onClick: () => void;
  disabled?: boolean;
};

export function PlanCard({
  variant,
  label,
  price,
  meta,
  weeklyEquiv,
  onClick,
  disabled,
}: Props) {
  const isHighlighted = variant === "highlighted";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-full rounded-lg p-5 flex items-center justify-between gap-4 text-left transition-colors",
        isHighlighted
          ? "border-2 border-peach bg-peach-soft/40 hover:bg-peach-soft/70"
          : "border border-bone bg-cream hover:bg-bone/30",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-peach/40"
      )}
    >
      {isHighlighted && (
        <span className="absolute -top-3 left-5 text-micro uppercase tracking-wider px-2 py-1 rounded-pill bg-peach text-ink font-medium">
          Best value
        </span>
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-body font-medium text-ink truncate">{label}</span>
        {weeklyEquiv && (
          <span className="text-small text-stone">{weeklyEquiv}</span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 items-end shrink-0">
        <span className="font-display text-h3 text-ink leading-none">
          {price}
        </span>
        {meta && <span className="text-small text-stone">{meta}</span>}
      </div>
    </button>
  );
}
