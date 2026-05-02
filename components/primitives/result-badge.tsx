import {
  Check,
  Eye,
  AlertTriangle,
  Moon,
  Milk,
  Frown,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResultBadgeStatus } from "@/lib/types";

type Props = { status: ResultBadgeStatus; size?: "sm" | "md" | "lg" };

// Color mappings per spec Part 3.4 + 3.1. Icon choices are best-fit
// from the lucide set: bottle → Milk, alert → AlertTriangle, etc.
const STATUS_CONFIG: Record<
  ResultBadgeStatus,
  { bg: string; fg: string; icon: LucideIcon; label: string }
> = {
  healthy: { bg: "bg-sage-soft", fg: "text-sage", icon: Check, label: "Healthy" },
  monitor: { bg: "bg-amber-soft", fg: "text-amber", icon: Eye, label: "Monitor" },
  urgent: { bg: "bg-clay-soft", fg: "text-clay", icon: AlertTriangle, label: "Urgent" },
  tired: { bg: "bg-soft-blue-soft", fg: "text-soft-blue", icon: Moon, label: "Tired" },
  hungry: { bg: "bg-peach-soft", fg: "text-peach", icon: Milk, label: "Hungry" },
  discomfort: { bg: "bg-rose-soft", fg: "text-rose", icon: Frown, label: "Discomfort" },
  unclear: { bg: "bg-bone", fg: "text-stone", icon: HelpCircle, label: "Unclear" },
};

const SIZE_PX = { sm: 64, md: 96, lg: 144 } as const;

export function ResultBadge({ status, size = "md" }: Props) {
  const { bg, fg, icon: Icon, label } = STATUS_CONFIG[status];
  const px = SIZE_PX[size];
  const iconSize = Math.round(px / 2.6);

  return (
    <div
      className={cn(
        "rounded-pill grid place-items-center animate-[scaleIn_0.6s_cubic-bezier(0.16,1,0.3,1)]",
        bg,
        fg
      )}
      style={{ width: px, height: px }}
      role="img"
      aria-label={label}
    >
      <Icon
        style={{ width: iconSize, height: iconSize }}
        strokeWidth={2.2}
        aria-hidden
      />
    </div>
  );
}
