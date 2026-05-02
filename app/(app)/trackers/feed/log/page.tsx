"use client";

// Feed logging — blue themed shell. Method toggle (Nurse/Bottle/Solids)
// drives which sub-fields are visible. Nurse: side + per-side minutes.
// Bottle: ml + contents. Solids: chip multiselect of common foods.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { LogShell } from "@/components/trackers/log-shell";
import { LogRow } from "@/components/trackers/log-row";
import { ChipGroup } from "@/components/trackers/chip-group";
import { NumberStepper } from "@/components/trackers/number-stepper";
import {
  FeedMethodToggle,
  type FeedMethod,
} from "@/components/trackers/feed-method-toggle";
import { ChipMultiselect } from "@/components/onboarding/chip-multiselect";
import {
  QuickTimePicker,
  type QuickPreset,
} from "@/components/trackers/quick-time-picker";
import { readProfile } from "@/components/onboarding/profile-store";
import type { FeedPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

const SIDE_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "both", label: "Both" },
] as const satisfies readonly { value: NonNullable<FeedPayload["breastSide"]>; label: string }[];

const BOTTLE_AMOUNTS = ["30", "60", "90", "120", "150"];

const BOTTLE_CONTENTS = [
  { value: "breast_milk", label: "Breast milk" },
  { value: "formula", label: "Formula" },
  { value: "mixed", label: "Mixed" },
] as const satisfies readonly { value: NonNullable<FeedPayload["bottleContents"]>; label: string }[];

const SOLIDS_OPTIONS = [
  { value: "Banana", label: "Banana" },
  { value: "Avocado", label: "Avocado" },
  { value: "Oatmeal", label: "Oatmeal" },
  { value: "Yogurt", label: "Yogurt" },
  { value: "Egg", label: "Egg" },
  { value: "Pea", label: "Pea" },
  { value: "Sweet potato", label: "Sweet potato" },
  { value: "Other", label: "Other" },
];

const WHEN_PRESETS: QuickPreset[] = [
  { value: "now", label: "Just now", offsetMin: 0 },
  { value: "15m", label: "15m ago", offsetMin: 15 },
  { value: "30m", label: "30m ago", offsetMin: 30 },
  { value: "1h", label: "1h ago", offsetMin: 60 },
  { value: "custom", label: "Custom time", offsetMin: null },
];

export default function FeedLogPage() {
  const router = useRouter();
  const [babyName, setBabyName] = useState<string>("Baby");
  const [method, setMethod] = useState<FeedMethod | null>(null);

  const [side, setSide] =
    useState<NonNullable<FeedPayload["breastSide"]> | null>("left");
  const [leftMin, setLeftMin] = useState(10);
  const [rightMin, setRightMin] = useState(10);

  const [bottleMl, setBottleMl] = useState(90);
  const [bottleContents, setBottleContents] =
    useState<NonNullable<FeedPayload["bottleContents"]> | null>("breast_milk");

  const [solids, setSolids] = useState<string[]>([]);

  const [occurredAt, setOccurredAt] = useState<Date>(() => new Date());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const p = readProfile();
    if (typeof p.name === "string" && p.name.trim()) setBabyName(p.name);
  }, []);

  const ctaDisabled = useMemo(() => {
    if (!method || submitting) return true;
    if (method === "breast") return !side;
    if (method === "bottle") return bottleMl <= 0;
    if (method === "solids") return solids.length === 0;
    return true;
  }, [method, side, bottleMl, solids, submitting]);

  async function handleSubmit() {
    if (!method) return;
    setSubmitting(true);
    try {
      let data: FeedPayload;
      let durationMinutes: number | undefined;
      if (method === "breast") {
        const left = side === "right" ? 0 : leftMin;
        const right = side === "left" ? 0 : rightMin;
        durationMinutes = left + right;
        data = {
          method,
          ...(side ? { breastSide: side } : {}),
          breastLeftMinutes: left,
          breastRightMinutes: right,
        };
      } else if (method === "bottle") {
        data = {
          method,
          bottleMl,
          ...(bottleContents ? { bottleContents } : {}),
        };
      } else {
        data = { method, solidsItems: solids };
      }
      if (note.trim()) data.notes = note.trim();

      const res = await fetch("/api/tracker/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babyName,
          occurredAt: occurredAt.toISOString(),
          ...(durationMinutes ? { durationMinutes } : {}),
          payload: { type: "feed", data },
        }),
      });
      if (!res.ok) {
        let msg = "Couldn't save that feed. Try again.";
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
      tone="blue"
      iconVariant="feed"
      title="Feeding"
      ctaDisabled={ctaDisabled}
      onSubmit={handleSubmit}
      loading={submitting}
      note={note}
      onNoteChange={setNote}
    >
      <LogRow label="Time">
        <QuickTimePicker
          presets={WHEN_PRESETS}
          value={occurredAt}
          onChange={setOccurredAt}
        />
      </LogRow>

      <LogRow label="How are they feeding?">
        <FeedMethodToggle value={method} onChange={setMethod} />
      </LogRow>

      <AnimatePresence mode="wait" initial={false}>
        {method === "breast" && (
          <motion.div
            key="breast"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            <LogRow label="Side">
              <ChipGroup
                options={SIDE_OPTIONS.map((s) => ({
                  value: s.value,
                  label: s.label,
                }))}
                value={side}
                onChange={setSide}
                ariaLabel="Side"
              />
            </LogRow>
            <div
              className={cn(
                "grid gap-4",
                side === "both" ? "grid-cols-2" : "grid-cols-1"
              )}
            >
              {(side === "left" || side === "both") && (
                <LogRow label="Left side (min)">
                  <NumberStepper
                    value={leftMin}
                    onChange={setLeftMin}
                    min={0}
                    max={120}
                    ariaLabel="Left side minutes"
                  />
                </LogRow>
              )}
              {(side === "right" || side === "both") && (
                <LogRow label="Right side (min)">
                  <NumberStepper
                    value={rightMin}
                    onChange={setRightMin}
                    min={0}
                    max={120}
                    ariaLabel="Right side minutes"
                  />
                </LogRow>
              )}
            </div>
          </motion.div>
        )}

        {method === "bottle" && (
          <motion.div
            key="bottle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            <LogRow label="Quantity">
              <div className="flex flex-col gap-3">
                <ChipGroup
                  options={BOTTLE_AMOUNTS.map((v) => ({
                    value: v,
                    label: `${v}ml`,
                  }))}
                  value={String(bottleMl)}
                  onChange={(next) => {
                    if (next) setBottleMl(Number.parseInt(next, 10));
                  }}
                  ariaLabel="Bottle amount preset"
                />
                <NumberStepper
                  value={bottleMl}
                  onChange={setBottleMl}
                  step={10}
                  min={0}
                  max={500}
                  unit="ml"
                  ariaLabel="Bottle amount in ml"
                />
              </div>
            </LogRow>
            <LogRow label="Source">
              <ChipGroup
                options={BOTTLE_CONTENTS.map((c) => ({
                  value: c.value,
                  label: c.label,
                }))}
                value={bottleContents}
                onChange={setBottleContents}
                allowClear
                ariaLabel="Bottle source"
              />
            </LogRow>
          </motion.div>
        )}

        {method === "solids" && (
          <motion.div
            key="solids"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            <LogRow label="What did they try?">
              <ChipMultiselect
                options={SOLIDS_OPTIONS}
                selected={solids}
                onChange={setSolids}
                ariaLabel="Solids tried"
              />
            </LogRow>
          </motion.div>
        )}
      </AnimatePresence>
    </LogShell>
  );
}
