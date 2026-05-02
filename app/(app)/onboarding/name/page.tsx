// Onboarding 2/4 — baby's name.
// AutoFocus + autoCapitalize words so iOS shows the right keyboard treatment.
// Trimming guards against the "all spaces" edge that would still satisfy ≥1 char.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { StepShell } from "@/components/onboarding/step-shell";
import { writeProfile, readProfile } from "@/components/onboarding/profile-store";

export default function NamePage() {
  const router = useRouter();
  const initial =
    typeof window !== "undefined" ? (readProfile().name ?? "") : "";
  const [name, setName] = useState<string>(initial);

  const trimmed = name.trim();
  const isValid = trimmed.length >= 1;

  const handleContinue = () => {
    if (!isValid) return;
    writeProfile({ name: trimmed });
    router.push("/onboarding/avatar");
  };

  return (
    <StepShell
      tone="sage"
      imageSrc="/images/onboarding-name.png"
      imageAlt="Swaddled baby beside a name placard"
      title="What&rsquo;s their name?"
      subtitle="So I can call them by name when we chat."
      footer={
        <PrimaryCTA
          onClick={handleContinue}
          disabled={!isValid}
          showArrow
          fullWidth
          ariaLabel="Continue to avatar"
        >
          Continue
        </PrimaryCTA>
      }
    >
      <label className="flex flex-col gap-2 text-left">
        <span className="text-micro uppercase tracking-wider text-stone">
          Baby&rsquo;s name
        </span>
        <input
          type="text"
          autoFocus
          autoCapitalize="words"
          autoComplete="given-name"
          spellCheck={false}
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isValid) handleContinue();
          }}
          placeholder="e.g. Olive"
          className="h-14 w-full rounded-lg bg-cream border border-bone px-4 text-body text-ink placeholder:text-stone/60 focus:outline-none focus:ring-3 focus:ring-peach/40 focus:border-peach"
        />
      </label>
    </StepShell>
  );
}
