"use client";

// Live countdown pill for predictive next-feed / next-sleep windows.
// Re-renders every 30s so the "in 27 min" stays accurate without
// hammering React. Once the window opens, switches to "now ~ window
// closes in X" and after it closes shows "expected by now".
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Tone = "amber" | "blue";

const TONE: Record<
  Tone,
  { halo: string; chip: string; tint: string; ring: string }
> = {
  amber: {
    halo: "bg-amber-soft",
    chip: "bg-amber-soft",
    tint: "text-clay",
    ring: "ring-amber/40",
  },
  blue: {
    halo: "bg-soft-blue-soft",
    chip: "bg-soft-blue-soft",
    tint: "text-vivid-blue",
    ring: "ring-soft-blue/40",
  },
};

type Props = {
  Icon: LucideIcon;
  label: string;
  earliestIso: string;
  latestIso: string;
  tone: Tone;
};

function formatHM(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${m} ${ampm}`;
}

function relativeFrom(min: number): string {
  if (min <= 0) return "now";
  if (min < 60) return `in ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `in ${h}h`;
  return `in ${h}h ${m}m`;
}

export function CountdownPill({
  Icon,
  label,
  earliestIso,
  latestIso,
  tone,
}: Props) {
  // Tick every 30s so the relative phrase stays fresh without
  // re-rendering on every animation frame.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const { state, label: stateLabel } = useMemo(() => {
    const earliest = new Date(earliestIso).getTime();
    const latest = new Date(latestIso).getTime();
    if (now < earliest) {
      const min = Math.max(0, Math.round((earliest - now) / 60_000));
      return { state: "before" as const, label: relativeFrom(min) };
    }
    if (now >= earliest && now <= latest) {
      const min = Math.max(0, Math.round((latest - now) / 60_000));
      return {
        state: "inside" as const,
        label: `in window · ${min}m left`,
      };
    }
    return { state: "after" as const, label: "expected by now" };
  }, [now, earliestIso, latestIso]);

  const t = TONE[tone];

  return (
    <article
      className={cn(
        "rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-4 flex flex-col gap-3",
        state === "after" && `ring-2 ${t.ring}`,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-9 rounded-pill grid place-items-center",
              t.halo,
            )}
            aria-hidden
          >
            <Icon className={cn("size-4", t.tint)} strokeWidth={2.2} />
          </span>
          <p className="text-small font-semibold text-ink">{label}</p>
        </div>
        <span
          className={cn(
            "rounded-pill px-2.5 py-0.5 text-micro uppercase tracking-wider font-semibold",
            t.chip,
            t.tint,
          )}
        >
          {stateLabel}
        </span>
      </div>
      <p className="text-small text-stone tabular-nums">
        {formatHM(earliestIso)} – {formatHM(latestIso)}
      </p>
    </article>
  );
}
