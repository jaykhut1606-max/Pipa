"use client";

// Diaper logging flow. Wet / Dirty / Both is required; consistency + color
// + notes are optional and only shown when relevant.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { LogShell } from "@/components/trackers/log-shell";
import { LogRow } from "@/components/trackers/log-row";
import { ChipGroup } from "@/components/trackers/chip-group";
import { BigCardToggle } from "@/components/trackers/big-card-toggle";
import {
  QuickTimePicker,
  type QuickPreset,
} from "@/components/trackers/quick-time-picker";
import { readProfile } from "@/components/onboarding/profile-store";
import type { DiaperPayload } from "@/lib/types";

const KIND_OPTIONS = [
  { value: "wet" as const, label: "Wet", tone: "peach-soft" as const },
  { value: "dirty" as const, label: "Dirty", tone: "amber-soft" as const },
  { value: "mixed" as const, label: "Both", tone: "rose-soft" as const },
];

const CONSISTENCIES = [
  { value: "watery", label: "Watery" },
  { value: "loose", label: "Loose" },
  { value: "soft", label: "Soft" },
  { value: "formed", label: "Formed" },
  { value: "hard", label: "Hard" },
  { value: "pellets", label: "Pellets" },
] as const satisfies readonly { value: NonNullable<DiaperPayload["consistency"]>; label: string }[];

const COLORS = [
  { value: "Yellow", label: "Yellow" },
  { value: "Green", label: "Green" },
  { value: "Brown", label: "Brown" },
  { value: "Mustard", label: "Mustard" },
  { value: "Other", label: "Other" },
];

const WHEN_PRESETS: QuickPreset[] = [
  { value: "now", label: "Just now", offsetMin: 0 },
  { value: "5m", label: "5m ago", offsetMin: 5 },
  { value: "30m", label: "30m ago", offsetMin: 30 },
  { value: "1h", label: "1h ago", offsetMin: 60 },
  { value: "custom", label: "Custom time", offsetMin: null },
];

export default function DiaperLogPage() {
  const router = useRouter();
  const [babyName, setBabyName] = useState<string>("Baby");
  const [kind, setKind] = useState<DiaperPayload["kind"] | null>(null);
  const [consistency, setConsistency] =
    useState<NonNullable<DiaperPayload["consistency"]> | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [occurredAt, setOccurredAt] = useState<Date>(() => new Date());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const p = readProfile();
    if (typeof p.name === "string" && p.name.trim()) setBabyName(p.name);
  }, []);

  const showDirtyExtras = kind === "dirty" || kind === "mixed";
  const ctaDisabled = !kind || submitting;

  async function handleSubmit() {
    if (!kind) return;
    setSubmitting(true);
    try {
      const data: DiaperPayload = {
        kind,
        ...(showDirtyExtras && consistency ? { consistency } : {}),
        ...(showDirtyExtras && color ? { color } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };

      const res = await fetch("/api/tracker/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babyName,
          occurredAt: occurredAt.toISOString(),
          payload: { type: "diaper", data },
        }),
      });
      if (!res.ok) {
        let msg = "Couldn't save that diaper. Try again.";
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) msg = body.error;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      toast.success("Logged!");
      router.push("/trackers");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
      setSubmitting(false);
    }
  }

  return (
    <LogShell
      tone="peach"
      iconVariant="diaper"
      title="Log a diaper"
      subtitle="A few taps. Done."
      ctaLabel="Log diaper"
      ctaDisabled={ctaDisabled}
      onSubmit={handleSubmit}
      loading={submitting}
    >
      <LogRow label="What was in there?">
        <BigCardToggle
          options={KIND_OPTIONS}
          value={kind}
          onChange={setKind}
          ariaLabel="Diaper contents"
        />
      </LogRow>

      <AnimatePresence initial={false}>
        {showDirtyExtras && (
          <motion.div
            key="dirty-extras"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6 overflow-hidden"
          >
            <LogRow label="Consistency" optional>
              <ChipGroup
                options={CONSISTENCIES.map((c) => ({
                  value: c.value,
                  label: c.label,
                }))}
                value={consistency}
                onChange={setConsistency}
                allowClear
                ariaLabel="Stool consistency"
              />
            </LogRow>
            <LogRow label="Color" optional>
              <ChipGroup
                options={COLORS}
                value={color}
                onChange={setColor}
                allowClear
                ariaLabel="Stool color"
              />
            </LogRow>
          </motion.div>
        )}
      </AnimatePresence>

      <LogRow label="When?">
        <QuickTimePicker
          presets={WHEN_PRESETS}
          value={occurredAt}
          onChange={setOccurredAt}
        />
      </LogRow>

      <LogRow label="Notes" optional>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Anything else worth remembering?"
          className="w-full rounded-2xl bg-cream border border-bone px-4 py-3 text-body text-ink placeholder:text-stone resize-none focus:outline-none focus:ring-3 focus:ring-peach/30"
        />
      </LogRow>
    </LogShell>
  );
}
