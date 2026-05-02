"use client";

// Section row used inside the log flow inputs panel. A small label sits
// above the children; gap is consistent so the panel reads as one card.
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function LogRow({ label, optional, children, className }: Props) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex items-baseline gap-2">
        <p className="text-small font-medium text-ink">{label}</p>
        {optional && (
          <span className="text-micro uppercase tracking-wider text-stone">
            Optional
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
