// Onboarding 3/5 — pick an avatar for the baby.
// Six pre-illustrated kid portraits in a 3×2 grid. Required step:
// continue is disabled until the parent picks one.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { StepShell } from "@/components/onboarding/step-shell";
import { readProfile } from "@/components/onboarding/profile-store";
import {
  PRESET_AVATAR_IDS,
  avatarSrc,
  isSameAvatar,
  readAvatar,
  writeAvatar,
  type AvatarSelection,
  type PresetAvatarId,
} from "@/components/onboarding/avatar";
import { cn } from "@/lib/utils";

export default function OnboardingAvatarPage() {
  const router = useRouter();
  const [name, setName] = useState<string>("Baby");
  const [picked, setPicked] = useState<AvatarSelection | null>(null);

  useEffect(() => {
    const p = readProfile();
    if (typeof p.name === "string" && p.name.trim()) setName(p.name.trim());
    setPicked(readAvatar());
  }, []);

  const handleContinue = () => {
    if (!picked) return;
    writeAvatar(picked);
    router.push("/onboarding/feeding");
  };

  return (
    <StepShell
      tone="amber"
      imageSrc="/images/pippa-logo.png"
      imageAlt="Pippa mascot"
      imageSize={96}
      title={`Pick an avatar for ${name}`}
      subtitle="It shows up on the home screen and on the report you can share with your pediatrician."
      footer={
        <PrimaryCTA
          onClick={handleContinue}
          disabled={!picked}
          showArrow
          fullWidth
          ariaLabel="Continue to feeding"
        >
          Continue
        </PrimaryCTA>
      }
    >
      <ul
        role="radiogroup"
        aria-label="Avatar"
        className="grid grid-cols-3 gap-3 max-w-sm w-full"
      >
        {PRESET_AVATAR_IDS.map((id) => {
          const opt: AvatarSelection = { kind: "preset", id };
          const isSelected = picked ? isSameAvatar(picked, opt) : false;
          return (
            <li key={id}>
              <motion.button
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`Avatar ${id}`}
                onClick={() => setPicked(opt)}
                initial={false}
                animate={{ scale: isSelected ? 1.04 : 1 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "relative aspect-square w-full rounded-full overflow-hidden bg-cream transition-shadow focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-peach/40",
                  isSelected
                    ? "ring-4 ring-plum shadow-[var(--shadow-pop)]"
                    : "ring-1 ring-ink/10 hover:ring-ink/30"
                )}
              >
                <Image
                  src={avatarSrc(opt)}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 120px, 30vw"
                  className="object-cover"
                />
                {isSelected && (
                  <span
                    aria-hidden
                    className="absolute -top-1 -right-1 size-6 rounded-pill bg-sage text-cream grid place-items-center shadow-[var(--shadow-soft)]"
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </StepShell>
  );
}
