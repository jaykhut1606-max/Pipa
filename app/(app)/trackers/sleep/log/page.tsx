"use client";

// Sleep logging — yellow themed shell. Computes occurredAt from a "when
// did sleep start" preset (or custom time) plus a duration chip; POSTs
// the canonical SleepPayload + durationMinutes to /api/tracker/event.
// A central circular display previews the resulting hh:mm.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogShell } from "@/components/trackers/log-shell";
import { LogRow } from "@/components/trackers/log-row";
import { ChipGroup } from "@/components/trackers/chip-group";
import {
  QuickTimePicker,
  type QuickPreset,
} from "@/components/trackers/quick-time-picker";
import { readProfile } from "@/components/onboarding/profile-store";
import type { SleepPayload } from "@/lib/types";

const START_PRESETS: QuickPreset[] = [
  { value: "now", label: "Just now", offsetMin: 0 },
  { value: "30m", label: "30 min ago", offsetMin: 30 },
  { value: "1h", label: "1h ago", offsetMin: 60 },
  { value: "custom", label: "Custom", offsetMin: null },
];

const DURATION_OPTIONS: { value: string; label: string; minutes: number }[] = [
  { value: "15", label: "15m", minutes: 15 },
  { value: "30", label: "30m", minutes: 30 },
  { value: "45", label: "45m", minutes: 45 },
  { value: "60", label: "1h", minutes: 60 },
  { value: "90", label: "1.5h", minutes: 90 },
  { value: "120", label: "2h", minutes: 120 },
  { value: "150", label: "2.5h", minutes: 150 },
  { value: "180", label: "3h", minutes: 180 },
  { value: "210", label: "3.5h", minutes: 210 },
  { value: "240", label: "4h+", minutes: 240 },
];

const LOCATIONS = [
  { value: "crib", label: "Crib" },
  { value: "bassinet", label: "Bassinet" },
  { value: "stroller", label: "Stroller" },
  { value: "contact", label: "Contact" },
  { value: "car", label: "Car" },
  { value: "other", label: "Other" },
] as const satisfies readonly { value: NonNullable<SleepPayload["location"]>; label: string }[];

const QUALITIES = [
  { value: "settled", label: "Settled" },
  { value: "restless", label: "Restless" },
  { value: "broken", label: "Broken" },
] as const satisfies readonly { value: NonNullable<SleepPayload["quality"]>; label: string }[];

export default function SleepLogPage() {
  const router = useRouter();
  const [babyName, setBabyName] = useState<string>("Baby");
  const [startAt, setStartAt] = useState<Date>(() => new Date());
  const [duration, setDuration] = useState<string | null>("60");
  const [location, setLocation] =
    useState<NonNullable<SleepPayload["location"]> | null>("crib");
  const [quality, setQuality] =
    useState<NonNullable<SleepPayload["quality"]> | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const p = readProfile();
    if (typeof p.name === "string" && p.name.trim()) setBabyName(p.name);
  }, []);

  const durationMinutes = useMemo(() => {
    const opt = DURATION_OPTIONS.find((d) => d.value === duration);
    return opt?.minutes ?? 0;
  }, [duration]);

  const ctaDisabled = !duration || submitting;

  async function handleSubmit() {
    if (!duration) return;
    setSubmitting(true);
    try {
      const occurredAt = startAt.toISOString();
      const endedAt = new Date(
        startAt.getTime() + durationMinutes * 60_000
      ).toISOString();

      const data: SleepPayload = {
        endedAt,
        ...(location ? { location } : {}),
        ...(quality ? { quality } : {}),
        ...(note.trim() ? { notes: note.trim() } : {}),
      };

      const res = await fetch("/api/tracker/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babyName,
          occurredAt,
          durationMinutes,
          payload: { type: "sleep", data },
        }),
      });
      if (!res.ok) {
        let msg = "Couldn't save that sleep. Try again.";
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) msg = body.error;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      toast.success("Logged!");
      // Cache-bust query param so /trackers re-runs fetchAll on mount —
      // soft-navigating without it leaves the parent's events state stale
      // and the freshly-saved event invisible until a hard reload.
      router.push(`/trackers?logged=${Date.now()}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
      setSubmitting(false);
    }
  }

  return (
    <LogShell
      tone="yellow"
      iconVariant="sleep"
      title="Sleep"
      ctaDisabled={ctaDisabled}
      onSubmit={handleSubmit}
      loading={submitting}
      note={note}
      onNoteChange={setNote}
    >
      <DurationDial minutes={durationMinutes} />

      <LogRow label="When did sleep start?">
        <QuickTimePicker
          presets={START_PRESETS}
          value={startAt}
          onChange={setStartAt}
        />
      </LogRow>

      <LogRow label="How long did they sleep?">
        <ChipGroup
          options={DURATION_OPTIONS.map(({ value, label }) => ({
            value,
            label,
          }))}
          value={duration}
          onChange={setDuration}
          ariaLabel="Sleep duration"
        />
      </LogRow>

      <LogRow label="Where?" optional>
        <ChipGroup
          options={LOCATIONS.map((l) => ({ value: l.value, label: l.label }))}
          value={location}
          onChange={setLocation}
          allowClear
          ariaLabel="Sleep location"
        />
      </LogRow>

      <LogRow label="How did it go?" optional>
        <ChipGroup
          options={QUALITIES.map((q) => ({ value: q.value, label: q.label }))}
          value={quality}
          onChange={setQuality}
          allowClear
          ariaLabel="Sleep quality"
        />
      </LogRow>
    </LogShell>
  );
}

function DurationDial({ minutes }: { minutes: number }) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return (
    <div className="self-center my-2 size-56 rounded-full bg-cream/70 shadow-[var(--shadow-soft)] flex flex-col items-center justify-center">
      <p className="font-display text-hero text-ink leading-none">
        {hh}h{mm}m
      </p>
      <p className="text-small text-stone mt-2">00s</p>
    </div>
  );
}
