"use client";

// Rash check end-to-end. Two visible states:
//   form       — gradient rose hero + RashForm (photo + chips)
//   uploading  — AnalyzingState while we POST to /api/scan/rash
// Photo never leaves the device beyond the request — we revoke the object
// URL and drop the File reference before redirecting.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NavBar } from "@/components/primitives/nav-bar";
import { GradientHero } from "@/components/primitives/gradient-hero";
import { Character } from "@/components/primitives/character";
import { AnalyzingState } from "@/components/scan/analyzing-state";
import { RashForm } from "@/components/scan/rash-form";
import { readProfile } from "@/components/onboarding/profile-store";

type State = "form" | "uploading";

type BabyContext = {
  name: string;
  ageWeeks: number;
};

const DEFAULT_CONTEXT: BabyContext = { name: "Baby", ageWeeks: 4 };

function weeksSince(birthDate: string | undefined): number | undefined {
  if (!birthDate) return undefined;
  const start = new Date(birthDate);
  if (Number.isNaN(start.getTime())) return undefined;
  const ms = Date.now() - start.getTime();
  if (ms < 0) return undefined;
  return Math.max(0, Math.floor(ms / (7 * 24 * 60 * 60 * 1000)));
}

export default function RashPage() {
  const router = useRouter();
  const [state, setState] = useState<State>("form");
  const [babyContext, setBabyContext] =
    useState<BabyContext>(DEFAULT_CONTEXT);

  useEffect(() => {
    const profile = readProfile();
    setBabyContext({
      name: profile.name?.trim() || DEFAULT_CONTEXT.name,
      ageWeeks: weeksSince(profile.birthDate) ?? DEFAULT_CONTEXT.ageWeeks,
    });
  }, []);

  const handleSubmit = useCallback(
    async (data: {
      photo: File;
      bodyLocation: string;
      durationLabel: "today" | "few days" | "over a week";
      fever: "yes" | "no" | "unsure";
    }) => {
      setState("uploading");

      try {
        const fd = new FormData();
        fd.append("photo", data.photo, data.photo.name || "rash.jpg");
        fd.append("bodyLocation", data.bodyLocation);
        fd.append("durationLabel", data.durationLabel);
        fd.append("fever", data.fever);
        fd.append("babyName", babyContext.name);
        fd.append("babyAgeWeeks", String(babyContext.ageWeeks));

        const res = await fetch("/api/scan/rash", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const errBody = await res
            .json()
            .catch(() => ({ error: "Something went wrong." }));
          throw new Error(errBody.error ?? "Rash analysis failed.");
        }

        const json = (await res.json()) as { scanId: string };
        router.push(`/result/${json.scanId}`);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "We couldn't reach Pippa right now.";
        toast.error(message);
        setState("form");
      }
    },
    [babyContext, router]
  );

  if (state === "uploading") {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-cream">
        <NavBar showBack />
        <AnalyzingState
          tone="rose"
          headline="Checking that rash…"
          caption="Pippa never stores photos."
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-cream">
      <NavBar showBack />
      <GradientHero tone="rose" className="px-6 pt-6 pb-8">
        <div className="container-app !px-0 flex items-center gap-4">
          <Character variant="shield" bg="rose" size="md" />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-h2 text-ink">
              Let&apos;s check that rash
            </h1>
            <p className="text-small text-stone">
              A photo and a few details, then Pippa weighs in.
            </p>
          </div>
        </div>
      </GradientHero>
      <div className="container-app py-6 flex-1">
        <RashForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
