// Onboarding 1/4 — birth date.
// Native <input type="date"> for max device-keyboard friendliness.
// We compute live age in weeks (under ~3 months) or months and surface
// a gentle out-of-range note rather than blocking, since Pippa's tuned
// for 0–24 months but parents of older kids may still find value.
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
} from "date-fns";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { StepShell } from "@/components/onboarding/step-shell";
import { writeProfile, readProfile } from "@/components/onboarding/profile-store";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function twoYearsAgoIso(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 2);
  return d.toISOString().slice(0, 10);
}

function describeAge(birthIso: string): string {
  const birth = new Date(birthIso + "T00:00:00");
  const now = new Date();
  if (Number.isNaN(birth.getTime())) return "";
  const days = differenceInDays(now, birth);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} old today`;
  const weeks = differenceInWeeks(now, birth);
  if (weeks < 14) return `${weeks} week${weeks === 1 ? "" : "s"} old today`;
  const months = differenceInMonths(now, birth);
  return `${months} month${months === 1 ? "" : "s"} old today`;
}

export default function AgePage() {
  const router = useRouter();
  // Hydrate from localStorage so back-navigation preserves the answer.
  const initial =
    typeof window !== "undefined"
      ? (readProfile().birthDate ?? "")
      : "";
  const [birthDate, setBirthDate] = useState<string>(initial);

  const max = todayIso();
  const min = twoYearsAgoIso();

  const ageLabel = useMemo(
    () => (birthDate ? describeAge(birthDate) : ""),
    [birthDate]
  );

  const isValid = useMemo(() => {
    if (!birthDate) return false;
    const d = new Date(birthDate + "T00:00:00");
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getTime() <= now.getTime();
  }, [birthDate]);

  const isOutOfRange = useMemo(() => {
    if (!birthDate) return false;
    const d = new Date(birthDate + "T00:00:00");
    return d.getTime() < new Date(min + "T00:00:00").getTime();
  }, [birthDate, min]);

  const handleContinue = () => {
    if (!isValid) return;
    writeProfile({ birthDate });
    router.push("/onboarding/name");
  };

  return (
    <StepShell
      tone="rose"
      imageSrc="/images/onboarding-dob.png"
      imageAlt="Sleeping baby beside a calendar"
      title="When was your baby born?"
      subtitle="We use this for age-appropriate context — it never leaves your phone."
      footer={
        <PrimaryCTA
          onClick={handleContinue}
          disabled={!isValid}
          showArrow
          fullWidth
          ariaLabel="Continue to name"
        >
          Continue
        </PrimaryCTA>
      }
    >
      <label className="flex flex-col gap-2 text-left">
        <span className="text-micro uppercase tracking-wider text-stone">
          Birth date
        </span>
        <input
          type="date"
          required
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          max={max}
          // No `min` so we can show a soft warning rather than block.
          aria-invalid={!!birthDate && !isValid}
          className="h-14 w-full rounded-lg bg-cream border border-bone px-4 text-body text-ink focus:outline-none focus:ring-3 focus:ring-peach/40 focus:border-peach"
        />
        {ageLabel && !isOutOfRange && (
          <span className="text-small text-stone">{ageLabel}</span>
        )}
        {isOutOfRange && (
          <span className="text-small text-clay">
            Pippa is tuned for 0–24 months — some answers may be less accurate.
          </span>
        )}
      </label>
    </StepShell>
  );
}
