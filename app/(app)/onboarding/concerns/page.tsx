// Onboarding 4/4 — what's on the parent's mind, plus the
// "this is educational, not medical advice" acknowledgment.
// Finishing here writes the full profile and lands on /scan.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { StepShell } from "@/components/onboarding/step-shell";
import {
  ChipMultiselect,
  type ChipOption,
} from "@/components/onboarding/chip-multiselect";
import {
  writeProfile,
  readProfile,
} from "@/components/onboarding/profile-store";
import { cn } from "@/lib/utils";

const OPTIONS: ChipOption[] = [
  { value: "sleep", label: "Sleep" },
  { value: "crying", label: "Crying" },
  { value: "feeding", label: "Feeding" },
  { value: "poop", label: "Poop" },
  { value: "health", label: "Health" },
  { value: "development", label: "Development" },
  { value: "coordinating", label: "Coordinating with partner" },
];

export default function ConcernsPage() {
  const router = useRouter();
  const initial =
    typeof window !== "undefined"
      ? (readProfile().concerns ?? [])
      : [];
  const [selected, setSelected] = useState<string[]>(initial);
  const [acknowledged, setAcknowledged] = useState(false);

  const isValid = acknowledged; // Concerns themselves are optional.

  const handleFinish = () => {
    if (!isValid) return;
    writeProfile({
      concerns: selected,
      onboardedAt: new Date().toISOString(),
    });
    router.push("/home");
  };

  return (
    <StepShell
      tone="lavender"
      imageSrc="/images/onboarding-concerns.png"
      imageAlt="Baby with thought bubbles for sleep, milk, and play"
      title="What&rsquo;s on your mind lately?"
      subtitle="Pick anything that resonates — or none, and we'll figure it out together."
      footer={
        <PrimaryCTA
          onClick={handleFinish}
          disabled={!isValid}
          showArrow
          fullWidth
          ariaLabel="Finish onboarding"
        >
          Finish
        </PrimaryCTA>
      }
    >
      <ChipMultiselect
        ariaLabel="Concerns"
        options={OPTIONS}
        selected={selected}
        onChange={setSelected}
        className="justify-center"
      />

      <motion.button
        type="button"
        onClick={() => setAcknowledged((v) => !v)}
        aria-pressed={acknowledged}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          delay: 0.25,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={cn(
          "rounded-lg border p-4 flex items-start gap-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-peach/40",
          acknowledged
            ? "bg-peach-soft border-peach"
            : "bg-cream border-bone hover:border-stone/40"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "mt-0.5 size-5 shrink-0 rounded-md grid place-items-center transition-colors",
            acknowledged
              ? "bg-peach text-ink"
              : "bg-cream border border-stone/40 text-transparent"
          )}
        >
          <Check className="size-3.5" strokeWidth={3} />
        </span>
        <span className="text-small text-ink leading-relaxed">
          I understand Pippa offers educational support, not medical
          diagnosis or treatment. I&rsquo;ll consult my pediatrician for
          medical decisions.
        </span>
      </motion.button>
    </StepShell>
  );
}
