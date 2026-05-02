// Shared chrome for the four onboarding steps.
// Client component because we derive the active step from the pathname.
// Skip writes a default profile to localStorage and jumps straight to /scan,
// so a cold-started session still has something for downstream phases to read.
"use client";

import { Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { NavBar } from "@/components/primitives/nav-bar";
import { ProgressDots } from "@/components/onboarding/progress-dots";
import {
  PROFILE_KEY,
  writeProfile,
  type BabyProfile,
} from "@/components/onboarding/profile-store";

const STEPS = ["age", "name", "feeding", "concerns"] as const;
const TOTAL = STEPS.length;

const BACK_HREF: Record<(typeof STEPS)[number], string> = {
  age: "/welcome",
  name: "/onboarding/age",
  feeding: "/onboarding/name",
  concerns: "/onboarding/feeding",
};

function deriveStep(pathname: string): {
  index: number;
  backHref: string;
} {
  for (let i = 0; i < STEPS.length; i++) {
    const step = STEPS[i];
    if (pathname.startsWith(`/onboarding/${step}`)) {
      return { index: i + 1, backHref: BACK_HREF[step] };
    }
  }
  return { index: 1, backHref: "/welcome" };
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/onboarding/age";
  const router = useRouter();
  const { index, backHref } = deriveStep(pathname);

  const handleSkip = () => {
    // Demo mode: write a sensible default so /scan and friends don't choke
    // on an empty profile. Only writes if nothing is there yet.
    if (typeof window !== "undefined") {
      try {
        const existing = window.localStorage.getItem(PROFILE_KEY);
        if (!existing) {
          // ~3 months ago — middle of Pippa's 0-24mo target window.
          const birth = new Date();
          birth.setMonth(birth.getMonth() - 3);
          const fallback: BabyProfile = {
            name: "Baby",
            birthDate: birth.toISOString().slice(0, 10),
            feedingType: ["mixed"],
            concerns: [],
            onboardedAt: new Date().toISOString(),
          };
          writeProfile(fallback);
        }
      } catch {
        /* ignore */
      }
    }
    router.push("/scan");
  };

  return (
    <div className="flex-1 flex flex-col">
      <NavBar
        showBack
        backHref={backHref}
        rightAction={
          <button
            type="button"
            onClick={handleSkip}
            className="text-small text-stone hover:text-ink h-11 px-2"
          >
            Skip
          </button>
        }
      />
      <div className="container-app pt-4 pb-2">
        <ProgressDots current={index} total={TOTAL} />
      </div>
      <Suspense fallback={null}>
        <div className="flex-1 flex flex-col">{children}</div>
      </Suspense>
    </div>
  );
}
