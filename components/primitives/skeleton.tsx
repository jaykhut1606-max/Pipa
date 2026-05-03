// Branded loading skeleton — peach undertone shimmer instead of the
// generic grey pulse. Pairs with the @keyframes shimmer + token in
// globals.css. Use anywhere that previously showed "Loading…" text.
//
// Reduced-motion users get a flat soft swatch (no animation).
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  // Round corners default to rounded-md; pass "pill" for a chip-shaped
  // skeleton or "card" for the full 2xl card radius.
  shape?: "default" | "pill" | "card" | "circle";
};

const SHAPE: Record<NonNullable<Props["shape"]>, string> = {
  default: "rounded-md",
  pill: "rounded-pill",
  card: "rounded-2xl",
  circle: "rounded-full",
};

export function Skeleton({ className, shape = "default" }: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        "bg-gradient-to-r from-peach-soft/40 via-cream to-peach-soft/40 bg-[length:200%_100%] motion-safe:animate-[shimmer_1.6s_ease-in-out_infinite] motion-reduce:bg-peach-soft/30",
        SHAPE[shape],
        className,
      )}
    />
  );
}
