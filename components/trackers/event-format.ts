// Pure formatters used by the hub's Summary and Details tabs.
// Lives next to the components so they stay client-friendly.
import type { TrackerEvent } from "@/lib/types";

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function startOfDay(d: Date = new Date()): Date {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dayLabel(d: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";
  // Same calendar week → weekday name
  const diffDays = Math.round(
    (startOfDay(today).getTime() - startOfDay(d).getTime()) / 86_400_000
  );
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: "long" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const LOCATION_LABEL: Record<string, string> = {
  crib: "Crib",
  bassinet: "Bassinet",
  stroller: "Stroller",
  contact: "Contact",
  car: "Car",
  other: "Other",
};

const BOTTLE_CONTENTS_LABEL: Record<string, string> = {
  breast_milk: "breast milk",
  formula: "formula",
  mixed: "mixed",
};

export function eventOneLiner(event: TrackerEvent): string {
  const payload = event.payload;
  switch (payload.type) {
    case "sleep": {
      const loc = payload.data.location
        ? LOCATION_LABEL[payload.data.location]
        : null;
      const dur = event.durationMinutes
        ? formatDuration(event.durationMinutes)
        : null;
      const parts = [loc, dur].filter(Boolean);
      if (parts.length === 0) return "Sleep";
      return parts.join(" · ");
    }
    case "diaper": {
      const kind =
        payload.data.kind === "wet"
          ? "Wet"
          : payload.data.kind === "dirty"
            ? "Dirty"
            : "Wet + dirty";
      if (payload.data.kind === "wet") return kind;
      const detail = payload.data.color ?? payload.data.consistency;
      return detail ? `${kind} · ${detail}` : kind;
    }
    case "feed": {
      const data = payload.data;
      if (data.method === "bottle") {
        const ml = data.bottleMl ? `${data.bottleMl}ml` : "Bottle";
        const kind = data.bottleContents
          ? BOTTLE_CONTENTS_LABEL[data.bottleContents]
          : null;
        return kind ? `${ml} ${kind}` : ml;
      }
      if (data.method === "breast") {
        const left = data.breastLeftMinutes ?? 0;
        const right = data.breastRightMinutes ?? 0;
        const total = left + right;
        if (data.breastSide === "both" || (left > 0 && right > 0)) {
          return `Breast · ${total}m`;
        }
        const side =
          data.breastSide === "right"
            ? "Right breast"
            : data.breastSide === "left"
              ? "Left breast"
              : "Breast";
        return total > 0 ? `${side} · ${total}m` : side;
      }
      if (data.method === "solids") {
        const items = data.solidsItems ?? [];
        if (items.length === 0) return "Solids";
        if (items.length <= 2) return `Solids · ${items.join(", ")}`;
        return `Solids · ${items.slice(0, 2).join(", ")} +${items.length - 2}`;
      }
      return "Feed";
    }
    case "note": {
      const text = payload.data.text;
      return text.length > 60 ? `${text.slice(0, 60)}…` : text;
    }
  }
}


