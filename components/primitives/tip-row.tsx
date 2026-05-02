import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  done?: boolean;
  className?: string;
};

// Soft white card with a check chip — used for tip lists on empty/error
// screens (matches Nanni's "Try again" / onboarding tip rows).
export function TipRow({ children, done, className }: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 shadow-[var(--shadow-soft)]",
        className
      )}
    >
      <span
        className={cn(
          "shrink-0 size-7 rounded-pill grid place-items-center border",
          done
            ? "bg-sage text-cream border-sage"
            : "bg-cream text-stone border-bone"
        )}
      >
        <Check className="size-4" strokeWidth={2.4} aria-hidden />
      </span>
      <span className="text-body text-ink">{children}</span>
    </div>
  );
}
