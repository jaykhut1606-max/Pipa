// Shared analyzing animation used by every scan type.
// Three concentric pulsing circles in the brand palette + Fraunces headline +
// stone caption. 3-second minimum reveal (callers handle the timer).
import { cn } from "@/lib/utils";

type Props = {
  headline?: string;
  caption?: string;
  tone?: "peach" | "blue" | "rose";
  className?: string;
};

const RING: Record<"peach" | "blue" | "rose", string[]> = {
  peach: ["bg-peach", "bg-amber", "bg-sage"],
  blue: ["bg-vivid-blue", "bg-soft-blue", "bg-mint"],
  rose: ["bg-rose", "bg-amber", "bg-peach"],
};

export function AnalyzingState({
  headline = "Looking carefully…",
  caption = "Pippa never stores your photos.",
  tone = "peach",
  className,
}: Props) {
  const [outer, mid, inner] = RING[tone];
  return (
    <div
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-8 px-6 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative size-40">
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-pill opacity-60 motion-safe:animate-[listenPulse_2.4s_ease-out_infinite]",
            outer
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute inset-4 rounded-pill opacity-70 motion-safe:animate-[listenPulse_2.4s_ease-out_infinite_0.4s]",
            mid
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute inset-10 rounded-pill motion-safe:animate-[pulseSoft_2.4s_ease-in-out_infinite]",
            inner
          )}
        />
      </div>
      <div className="flex flex-col gap-2 max-w-sm">
        <h2 className="font-display text-h2 text-ink">{headline}</h2>
        <p className="text-small text-stone">{caption}</p>
      </div>
    </div>
  );
}
