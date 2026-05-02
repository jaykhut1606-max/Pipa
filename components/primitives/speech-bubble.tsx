import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  pointer?: "down" | "up" | "left" | "right" | "none";
  className?: string;
};

// Pillowy white bubble with optional arrow tail. The tail is an inline SVG
// because CSS clip-path tricks don't anti-alias well on retina.
export function SpeechBubble({
  children,
  pointer = "down",
  className,
}: Props) {
  return (
    <div className={cn("relative inline-block", className)}>
      <div className="rounded-2xl bg-cream text-ink px-4 py-2 shadow-[var(--shadow-soft)] text-small font-medium">
        {children}
      </div>
      {pointer !== "none" && (
        <svg
          aria-hidden
          width="18"
          height="10"
          viewBox="0 0 18 10"
          className={cn(
            "absolute fill-cream drop-shadow-sm",
            pointer === "down" && "left-1/2 -translate-x-1/2 -bottom-2",
            pointer === "up" && "left-1/2 -translate-x-1/2 -top-2 rotate-180",
            pointer === "left" &&
              "left-[-9px] top-1/2 -translate-y-1/2 rotate-90",
            pointer === "right" &&
              "right-[-9px] top-1/2 -translate-y-1/2 -rotate-90"
          )}
        >
          <path d="M0 0 L9 10 L18 0 Z" />
        </svg>
      )}
    </div>
  );
}
