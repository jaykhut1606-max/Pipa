"use client";

// Diaper scan flow. Phase 4.
// State machine: capture → preview → uploading → (redirect on success | error)
// Reads baby profile from localStorage; defaults to a 4-week-old "Baby" if
// the user landed here without onboarding. Posts to /api/scan/diaper, enforces
// a 3s minimum reveal so the AnalyzingState doesn't flicker, then forces a
// hard navigation to /result/<scanId>. Force is intentional — we want a fresh
// server render so the new in-memory scan is read on first load.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInWeeks, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Lock, Heart } from "lucide-react";
import { PhotoCapture } from "@/components/scan/photo-capture";
import { AnalyzingState } from "@/components/scan/analyzing-state";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { DarkCTA } from "@/components/primitives/dark-cta";
import { Character } from "@/components/primitives/character";
import { readProfile } from "@/components/onboarding/profile-store";

type Mode = "capture" | "preview" | "uploading" | "error";

type BabyContext = {
  name: string;
  ageWeeks: number;
  feedingType: string[];
};

const MIN_REVEAL_MS = 3000;
const FOUR_WEEKS_MS = 4 * 7 * 24 * 60 * 60 * 1000;

function loadBabyContext(): BabyContext {
  const profile = readProfile();
  const name =
    typeof profile.name === "string" && profile.name.trim().length > 0
      ? profile.name
      : "Baby";
  const feeding =
    Array.isArray(profile.feedingType) && profile.feedingType.length > 0
      ? profile.feedingType
      : ["breast"];
  let ageWeeks = 4;
  if (typeof profile.birthDate === "string" && profile.birthDate) {
    try {
      const birth = parseISO(profile.birthDate);
      const weeks = differenceInWeeks(new Date(), birth);
      if (Number.isFinite(weeks) && weeks >= 0) ageWeeks = weeks;
    } catch {
      // fall back to default
    }
  } else {
    // Match spec default: 4 weeks ago.
    const fallback = new Date(Date.now() - FOUR_WEEKS_MS);
    ageWeeks = differenceInWeeks(new Date(), fallback);
  }
  return { name, ageWeeks, feedingType: feeding };
}

export default function Page() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("capture");
  const [staged, setStaged] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [baby, setBaby] = useState<BabyContext | null>(null);

  useEffect(() => {
    setBaby(loadBabyContext());
  }, []);

  // Manage object URL lifecycle for the preview thumbnail.
  useEffect(() => {
    if (!staged) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(staged);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [staged]);

  const heading = useMemo(() => {
    switch (mode) {
      case "capture":
        return "Diaper scan";
      case "preview":
        return "Looks good?";
      case "uploading":
        return "Analyzing";
      case "error":
        return "Something's not right";
    }
  }, [mode]);

  async function handleSubmit() {
    if (!staged || !baby) return;
    setMode("uploading");

    const fd = new FormData();
    fd.append("photo", staged);
    fd.append("babyName", baby.name);
    fd.append("babyAgeWeeks", String(baby.ageWeeks));
    fd.append("feedingType", baby.feedingType.join(","));

    try {
      const [response] = await Promise.all([
        fetch("/api/scan/diaper", { method: "POST", body: fd }),
        new Promise((r) => setTimeout(r, MIN_REVEAL_MS)),
      ]);
      if (!response.ok) {
        let message = "Something went wrong analyzing the photo. Please try again.";
        try {
          const data = (await response.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // ignore json parse errors
        }
        throw new Error(message);
      }
      const data = (await response.json()) as { scanId: string };
      // Force a full navigation so the result page reads the fresh
      // in-memory scan from the server on its first render.
      window.location.href = `/result/${data.scanId}`;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      toast.error(message);
      setMode("error");
    }
  }

  function reset() {
    setStaged(null);
    setMode("capture");
  }

  return (
    <main className="flex-1 flex flex-col bg-cream relative">
      {/* Privacy banner — pinned to the top, doesn't block the cancel button. */}
      <div className="absolute top-3 inset-x-0 z-20 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-cream/95 text-peach text-micro font-medium shadow-[var(--shadow-soft)]">
          <span>Photos are deleted after analysis</span>
          <span aria-hidden>·</span>
          <Lock className="size-3" aria-hidden />
        </div>
      </div>

      <span className="sr-only" aria-live="polite">
        {heading}
      </span>

      <AnimatePresence mode="wait" initial={false}>
        {mode === "capture" && (
          <motion.section
            key="capture"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PhotoCapture
              onCapture={(file) => {
                setStaged(file);
                setMode("preview");
              }}
              onCancel={() => router.back()}
              helperText="Position the diaper in good light"
            />
          </motion.section>
        )}

        {mode === "preview" && previewUrl && (
          <motion.section
            key="preview"
            className="flex-1 flex flex-col items-center pt-20 pb-10 px-6 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative w-full max-w-sm aspect-square rounded-lg overflow-hidden bg-bone shadow-[var(--shadow-soft)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Staged diaper photo"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="font-display text-h2 text-ink">Looks good?</h2>
              <p className="text-small text-stone">
                Pippa will keep this private and delete it after analysis.
              </p>
            </div>
            <div className="flex flex-row gap-3 w-full max-w-sm pt-2">
              <DarkCTA fullWidth onClick={reset}>
                Retake
              </DarkCTA>
              <PrimaryCTA fullWidth onClick={handleSubmit}>
                Use this photo
              </PrimaryCTA>
            </div>
          </motion.section>
        )}

        {mode === "uploading" && (
          <motion.section
            key="uploading"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AnalyzingState
              tone="peach"
              headline="Looking carefully…"
              caption="Pippa never stores your photos."
            />
          </motion.section>
        )}

        {mode === "error" && (
          <motion.section
            key="error"
            className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Character variant="thinking" bg="rose" size="lg" />
            <div className="flex flex-col gap-2 max-w-sm">
              <h2 className="font-display text-h2 text-ink inline-flex items-center gap-2 justify-center">
                <Heart className="size-5 text-rose" aria-hidden />
                Something&rsquo;s not right
              </h2>
              <p className="text-body text-stone">
                We couldn&rsquo;t finish the scan. The photo is safe — nothing
                was stored.
              </p>
            </div>
            <PrimaryCTA onClick={reset}>Try again</PrimaryCTA>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
