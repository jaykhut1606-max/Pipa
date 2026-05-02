import { cn } from "@/lib/utils";

type Tone =
  | "peach"
  | "sage"
  | "rose"
  | "amber"
  | "blue"
  | "lavender"
  | "cream";

const GRADIENTS: Record<Tone, string> = {
  peach: "bg-gradient-to-br from-vivid-peach-soft via-peach-soft to-cream",
  sage: "bg-gradient-to-br from-sage-soft via-mint to-cream",
  rose: "bg-gradient-to-br from-rose-soft via-peach-soft to-cream",
  amber: "bg-gradient-to-br from-amber-soft via-peach-soft to-cream",
  blue: "bg-gradient-to-br from-vivid-blue-soft via-soft-blue-soft to-cream",
  lavender: "bg-gradient-to-br from-lavender via-rose-soft to-cream",
  cream: "bg-cream",
};

type Props = {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
};

// Full-bleed gradient panel for screens that want a hero feel.
export function GradientHero({ tone = "peach", className, children }: Props) {
  return (
    <div className={cn("relative w-full", GRADIENTS[tone], className)}>
      {children}
    </div>
  );
}
