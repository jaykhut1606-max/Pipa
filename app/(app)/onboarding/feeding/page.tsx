// Onboarding 3/4 — feeding type (multi-select).
// Stored as an array because real life is rarely "just one of these".
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { StepShell } from "@/components/onboarding/step-shell";
import {
  ChipMultiselect,
  type ChipOption,
} from "@/components/onboarding/chip-multiselect";
import { writeProfile, readProfile } from "@/components/onboarding/profile-store";

const OPTIONS: ChipOption[] = [
  { value: "breast", label: "Breast" },
  { value: "formula", label: "Formula" },
  { value: "mixed", label: "Mixed" },
  { value: "solids", label: "Solids" },
];

export default function FeedingPage() {
  const router = useRouter();
  const initial =
    typeof window !== "undefined"
      ? (readProfile().feedingType ?? [])
      : [];
  const [selected, setSelected] = useState<string[]>(initial);

  const isValid = selected.length >= 1;

  const handleContinue = () => {
    if (!isValid) return;
    writeProfile({ feedingType: selected });
    router.push("/onboarding/concerns");
  };

  return (
    <StepShell
      tone="amber"
      characterVariant="bottle"
      characterBg="amber"
      title="How are they fed right now?"
      subtitle="You can pick more than one."
      footer={
        <PrimaryCTA
          onClick={handleContinue}
          disabled={!isValid}
          showArrow
          fullWidth
          ariaLabel="Continue to concerns"
        >
          Continue
        </PrimaryCTA>
      }
    >
      <ChipMultiselect
        ariaLabel="Feeding types"
        options={OPTIONS}
        selected={selected}
        onChange={setSelected}
        className="justify-center"
      />
    </StepShell>
  );
}
