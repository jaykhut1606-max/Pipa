import { cn } from "@/lib/utils";

type Props = { className?: string };

export function Wordmark({ className }: Props) {
  // Lowercase Fraunces 500, ink color. Letter-spacing tightened slightly
  // because Fraunces opens up at small sizes.
  return (
    <span
      className={cn(
        "font-display font-medium text-ink lowercase tracking-tight leading-none",
        className
      )}
    >
      pippa
    </span>
  );
}
