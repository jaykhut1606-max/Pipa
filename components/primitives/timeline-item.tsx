import { cn } from "@/lib/utils";

type Color =
  | "sage"
  | "amber"
  | "clay"
  | "peach"
  | "soft-blue"
  | "rose";

type Props = {
  color: Color;
  title: string;
  subtitle: string;
  isLast?: boolean;
};

const DOT: Record<Color, string> = {
  sage: "bg-sage",
  amber: "bg-amber",
  clay: "bg-clay",
  peach: "bg-peach",
  "soft-blue": "bg-soft-blue",
  rose: "bg-rose",
};

export function TimelineItem({ color, title, subtitle, isLast }: Props) {
  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[5px] top-3 bottom-0 w-px bg-bone"
        />
      )}
      <span
        aria-hidden
        className={cn("size-3 rounded-pill mt-1.5 shrink-0 z-10", DOT[color])}
      />
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <p className="text-body text-ink font-medium truncate">{title}</p>
        <p className="text-small text-stone">{subtitle}</p>
      </div>
    </div>
  );
}
