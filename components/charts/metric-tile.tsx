"use client";

// A compact tile combining an optional icon, a small label, a big metric, and
// an optional delta chip. The page can drop these into a grid for a quick
// at-a-glance summary above the cards. Visual language matches SoothingCard.
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type DeltaDirection = "up" | "down" | "flat";

type Props = {
  label: string;
  metric: string;
  delta?: { direction: DeltaDirection; label: string };
  icon?: React.ReactNode;
  accent?: "soft-blue" | "amber" | "peach" | "sage" | "plum";
  className?: string;
};

const ACCENT_BG: Record<NonNullable<Props["accent"]>, string> = {
  "soft-blue": "bg-soft-blue-soft",
  amber: "bg-amber-soft",
  peach: "bg-peach-soft",
  sage: "bg-sage-soft",
  plum: "bg-plum-soft",
};

function deltaTone(direction: DeltaDirection) {
  switch (direction) {
    case "up":
      return { Icon: TrendingUp, classes: "bg-sage-soft text-sage" };
    case "down":
      return { Icon: TrendingDown, classes: "bg-clay-soft text-clay" };
    case "flat":
      return { Icon: Minus, classes: "bg-bone text-stone" };
  }
}

export function MetricTile({
  label,
  metric,
  delta,
  icon,
  accent = "soft-blue",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl shadow-[var(--shadow-soft)] p-4 flex flex-col gap-2",
        ACCENT_BG[accent],
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-micro uppercase tracking-wider text-stone">
          {label}
        </span>
        {icon}
      </div>
      <p className="font-display text-h2 text-ink leading-none">{metric}</p>
      {delta && (
        <DeltaChip direction={delta.direction} label={delta.label} />
      )}
    </div>
  );
}

export function DeltaChip({
  direction,
  label,
}: {
  direction: DeltaDirection;
  label: string;
}) {
  const tone = deltaTone(direction);
  const { Icon } = tone;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-micro font-medium w-max",
        tone.classes
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
