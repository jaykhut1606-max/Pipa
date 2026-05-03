"use client";

// Cry analyzer end-to-end. Five visible states:
//   idle       — vivid-blue hero, "Tap to listen", concentric rings, plum CTA
//   recording  — counter pill + cancel X, big plum "Listening…" pill stops it
//   uploading  — AnalyzingState (tone="blue") while we POST + wait for OpenAI
//   tooShort   — Nanni-style empty state on bone with three TipRows
//   error      — gentle inline retry card
//
// Audio never leaves the browser longer than the request takes; we pass
// the Blob to /api/scan/cry, redirect to the result page, drop the recording.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { motion } from "framer-motion";
import { AnalyzingState } from "@/components/scan/analyzing-state";
import {
  AudioCapture,
  type AudioCaptureHandle,
} from "@/components/scan/audio-capture";
import { Character } from "@/components/primitives/character";
import { TipRow } from "@/components/primitives/tip-row";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { readProfile } from "@/components/onboarding/profile-store";
import { blobToWav } from "@/lib/audio/wav";
import { cn } from "@/lib/utils";

type State = "idle" | "recording" | "uploading" | "tooShort" | "error";

type BabyContext = {
  name: string;
  ageWeeks: number;
  feedingType: string;
};

const DEFAULT_CONTEXT: BabyContext = {
  name: "Baby",
  ageWeeks: 4,
  feedingType: "breast",
};

function weeksSince(birthDate: string | undefined): number | undefined {
  if (!birthDate) return undefined;
  const start = new Date(birthDate);
  if (Number.isNaN(start.getTime())) return undefined;
  const ms = Date.now() - start.getTime();
  if (ms < 0) return undefined;
  return Math.max(0, Math.floor(ms / (7 * 24 * 60 * 60 * 1000)));
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CryPage() {
  const router = useRouter();
  const captureRef = useRef<AudioCaptureHandle>(null);
  const [state, setState] = useState<State>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [babyContext, setBabyContext] =
    useState<BabyContext>(DEFAULT_CONTEXT);

  // Pull the baby profile out of localStorage once we're on the client.
  useEffect(() => {
    const profile = readProfile();
    const weeks = weeksSince(profile.birthDate) ?? DEFAULT_CONTEXT.ageWeeks;
    const feeding = profile.feedingType?.[0] ?? DEFAULT_CONTEXT.feedingType;
    setBabyContext({
      name: profile.name?.trim() || DEFAULT_CONTEXT.name,
      ageWeeks: weeks,
      feedingType: feeding,
    });
  }, []);

  const upload = useCallback(
    async (blob: Blob) => {
      setState("uploading");
      try {
        // OpenAI's audio model only accepts wav/mp3. Transcode webm/opus
        // (Chromium) and mp4/m4a (Safari) to PCM wav in the browser before
        // upload. Falls back to the raw blob if WebAudio isn't available.
        let wav: Blob;
        try {
          wav = await blobToWav(blob);
        } catch {
          wav = blob;
        }

        const fd = new FormData();
        fd.append("audio", wav, "cry.wav");
        fd.append("babyName", babyContext.name);
        fd.append("babyAgeWeeks", String(babyContext.ageWeeks));
        fd.append("feedingType", babyContext.feedingType);

        const res = await fetch("/api/scan/cry", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const data = await res
            .json()
            .catch(() => ({ error: "Something went wrong." }));
          throw new Error(data.error ?? "Cry analysis failed.");
        }

        const data = (await res.json()) as { scanId: string };
        router.push(`/result/${data.scanId}`);
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "We couldn't reach Pippa right now."
        );
        setState("error");
      }
    },
    [babyContext, router]
  );

  const handleCaptureComplete = useCallback(
    (blob: Blob) => {
      void upload(blob);
    },
    [upload]
  );

  const handleStart = useCallback(() => {
    setErrorMessage(null);
    setElapsed(0);
    setState("recording");
    void captureRef.current?.start();
  }, []);

  const handleStop = useCallback(() => {
    captureRef.current?.stop();
  }, []);

  const handleCancel = useCallback(() => {
    captureRef.current?.cancel();
    setState("idle");
    setElapsed(0);
  }, []);

  const handleTryAgain = useCallback(() => {
    setErrorMessage(null);
    setElapsed(0);
    setState("idle");
  }, []);

  const isDarkBg = state === "idle" || state === "recording";
  const isLightBg = state === "tooShort" || state === "error";

  const headlineCopy = useMemo(() => {
    if (state === "recording") return "Listening for your baby";
    return "Tap to start";
  }, [state]);

  const ctaLabel = state === "recording" ? "Listening…" : "Tap to listen";

  return (
    <div
      className={cn(
        "min-h-[100dvh] flex flex-col transition-colors duration-300",
        isDarkBg && "bg-vivid-blue text-cream",
        isLightBg && "bg-bone text-ink",
        state === "uploading" && "bg-cream text-ink"
      )}
    >
      {/* Custom NavBar override so the back link reads on the dark hero */}
      <header
        className={cn(
          "sticky top-0 z-40 backdrop-blur-sm",
          isDarkBg && "bg-vivid-blue/80 border-b border-vivid-blue-soft/40",
          !isDarkBg && "bg-cream/90 border-b border-bone"
        )}
      >
        <div className="container-app h-14 flex items-center justify-between gap-3">
          <Link
            href="/"
            aria-label="Back"
            className={cn(
              "inline-flex items-center gap-1 text-small h-11",
              isDarkBg ? "text-cream/90 hover:text-cream" : "text-stone hover:text-ink"
            )}
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span>Back</span>
          </Link>
          <div aria-hidden className="size-4" />
        </div>
      </header>

      <AudioCapture
        ref={captureRef}
        onCaptureComplete={handleCaptureComplete}
        onTooShort={() => {
          setElapsed(0);
          setState("tooShort");
        }}
        onPermissionDenied={() => {
          setPermissionDenied(true);
          setState("error");
          setErrorMessage(
            "Pippa needs your microphone to listen. Open this site's settings in your browser and allow microphone access, then try again."
          );
        }}
        onError={(message) => {
          setErrorMessage(message);
          setState("error");
        }}
        onTick={(secs) => setElapsed(secs)}
        minSec={3}
        maxSec={15}
      />

      {(state === "idle" || state === "recording") && (
        <ListeningStage
          state={state}
          elapsed={elapsed}
          headline={headlineCopy}
          ctaLabel={ctaLabel}
          onStart={handleStart}
          onStop={handleStop}
          onCancel={handleCancel}
        />
      )}

      {state === "uploading" && (
        <AnalyzingState
          tone="blue"
          headline="Reading the cry…"
          caption="Pippa never stores audio."
        />
      )}

      {state === "tooShort" && <TooShortStage onRetry={handleTryAgain} />}

      {state === "error" && (
        <ErrorStage
          message={
            errorMessage ??
            "We couldn't reach Pippa right now. Please try again in a moment."
          }
          permissionDenied={permissionDenied}
          onRetry={() => {
            setPermissionDenied(false);
            setErrorMessage(null);
            setElapsed(0);
            setState("idle");
          }}
        />
      )}
    </div>
  );
}

type ListeningStageProps = {
  state: "idle" | "recording";
  elapsed: number;
  headline: string;
  ctaLabel: string;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
};

function ListeningStage({
  state,
  elapsed,
  headline,
  ctaLabel,
  onStart,
  onStop,
  onCancel,
}: ListeningStageProps) {
  const isRecording = state === "recording";

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-6 pb-10 pt-8 text-center">
      <div className="flex flex-col items-center gap-6 w-full">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-pill px-4 py-1.5 text-small font-medium",
            "bg-ink/30 backdrop-blur text-cream",
            !isRecording && "opacity-0"
          )}
          aria-live="polite"
        >
          <span className="size-2 rounded-pill bg-rose motion-safe:animate-[pulseSoft_1.6s_ease-in-out_infinite]" />
          <span>Recording {formatTime(elapsed)}</span>
        </div>

        <h1 className="font-display text-h2 text-cream max-w-xs">
          {headline}
        </h1>
      </div>

      <div className="relative grid place-items-center my-12">
        <span
          aria-hidden
          className={cn(
            "absolute size-72 rounded-pill bg-cream/20",
            isRecording &&
              "motion-safe:animate-[listenPulse_2.2s_ease-out_infinite]"
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute size-56 rounded-pill bg-cream/25",
            isRecording &&
              "motion-safe:animate-[listenPulse_2.2s_ease-out_infinite_0.4s]"
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute size-40 rounded-pill bg-cream/30",
            isRecording &&
              "motion-safe:animate-[listenPulse_2.2s_ease-out_infinite_0.8s]"
          )}
        />

        {isRecording ? (
          <motion.button
            type="button"
            onClick={onCancel}
            aria-label="Cancel recording"
            className="relative size-24 rounded-pill bg-cream text-ink grid place-items-center shadow-[var(--shadow-pop)]"
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
          >
            <X className="size-9" strokeWidth={2.4} aria-hidden />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={onStart}
            aria-label="Start recording"
            className="relative size-28 rounded-pill bg-cream text-ink grid place-items-center shadow-[var(--shadow-pop)]"
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.04 }}
          >
            <span className="size-16 rounded-pill bg-vivid-blue grid place-items-center">
              <span className="size-3.5 rounded-pill bg-cream" />
            </span>
          </motion.button>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 w-full">
        <motion.button
          type="button"
          onClick={isRecording ? onStop : onStart}
          className={cn(
            "h-14 px-8 rounded-pill bg-plum text-cream font-medium text-body inline-flex items-center justify-center gap-2 shadow-[var(--shadow-soft)]",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-plum/40"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label={ctaLabel}
        >
          {isRecording && (
            <span className="size-2 rounded-pill bg-cream motion-safe:animate-[pulseSoft_1.6s_ease-in-out_infinite]" />
          )}
          <span>{ctaLabel}</span>
        </motion.button>
        <p className="text-small text-cream/80 max-w-xs">
          Try to avoid background noise.
        </p>
      </div>
    </div>
  );
}

function TooShortStage({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-between px-6 pb-10 pt-8 text-center">
      <div className="flex flex-col items-center gap-6">
        <Character variant="thinking" bg="cream" size="lg" />
        <h1 className="font-display text-h2 text-ink">Not long enough</h1>
      </div>
      <ul className="flex flex-col gap-3 w-full max-w-sm my-8">
        <li>
          <TipRow>Try listening for longer.</TipRow>
        </li>
        <li>
          <TipRow>
            Find a quiet spot near the baby. Avoid external noise.
          </TipRow>
        </li>
        <li>
          <TipRow>Hold your phone steady.</TipRow>
        </li>
      </ul>
      <PrimaryCTA onClick={onRetry} fullWidth showArrow>
        Try again
      </PrimaryCTA>
    </div>
  );
}

function ErrorStage({
  message,
  permissionDenied,
  onRetry,
}: {
  message: string;
  permissionDenied: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 pt-8 text-center gap-8">
      <Character variant="thinking" bg="cream" size="lg" />
      <div className="max-w-sm flex flex-col gap-3">
        <h1 className="font-display text-h2 text-ink">
          {permissionDenied ? "Microphone is blocked" : "Something stopped us"}
        </h1>
        <p className="text-body text-stone">{message}</p>
      </div>
      <div className="w-full max-w-sm">
        <PrimaryCTA onClick={onRetry} fullWidth>
          Try again
        </PrimaryCTA>
      </div>
    </div>
  );
}
