import { cn } from "@/lib/utils";

type Color =
  | "sage"
  | "amber"
  | "clay"
  | "peach"
  | "soft-blue"
  | "rose"
  | "stone";

type Props = {
  color: Color;
  children: React.ReactNode;
  className?: string;
};

const COLORS: Record<Color, string> = {
  sage: "bg-sage-soft text-sage",
  amber: "bg-amber-soft text-amber",
  clay: "bg-clay-soft text-clay",
  peach: "bg-peach-soft text-peach",
  "soft-blue": "bg-soft-blue-soft text-soft-blue",
  rose: "bg-rose-soft text-rose",
  stone: "bg-bone text-stone",
};

export function StatusPill({ color, children, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-pill text-small font-medium",
        COLORS[color],
        className
      )}
    >
      {children}
    </span>
  );
}
