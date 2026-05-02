"use client";

// Voice Entry — the talking-mic card on /trackers. Tap once to record, again
// to stop (auto-stops at 30s). The audio is POSTed to /api/tracker/voice,
// which returns a saved TrackerEvent + a Pippa-voice summary. We surface the
// summary inline, fire a small confetti, then collapse back to idle.
//
// State machine: idle → recording → processing → success | error
//
// We keep the visual style of the static card we replaced: cream rounded
// surface, two pulsing rings, peach (or red/blue/sage depending on state)
// circular mic in the centre.
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Check, Mic, Square } from "lucide-react";
import { readProfile } from "@/components/onboarding/profile-store";
import { cn } from "@/lib/utils";

type VoiceState = "idle" | "recording" | "processing" | "success" | "error";

const MAX_RECORD_SECONDS = 30;

// Match the same MIME-pick logic the cry capture uses so we hand Whisper
// something it can read across browsers.
function pickMimeType(): string | undefined {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return undefined;
  }
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      // Some browsers throw on unknown types — keep going.
    }
  }
  return undefined;
}

// Compute baby age in weeks from a YYYY-MM-DD birthDate.
function ageWeeksFromBirth(birthDate?: string): number | undefined {
  if (!birthDate) return undefined;
  const t = Date.parse(`${birthDate}T00:00:00`);
  if (!Number.isFinite(t)) return undefined;
  const ms = Date.now() - t;
  if (ms <= 0) return 0;
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}

type VoiceResponse = {
  event?: { id: string };
  transcription?: string;
  summary?: string;
  confidence?: number;
  error?: string;
};

type VoiceEntryProps = {
  // Optional: when the API saves a new event, the page can refetch.
  onLogged?: (response: VoiceResponse) => void;
};

export function VoiceEntry({ onLogged }: VoiceEntryProps = {}) {
  const [state, setState] = useState<VoiceState>("idle");
  const [elapsed, setElapsed] = useState(0); // seconds
  const [summary, setSummary] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processingCaption, setProcessingCaption] = useState(
    "Listening to your story…"
  );

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const rootRef = useRef<HTMLDivElement>(null);

  // Confetti — five small dots scaling out + fading. Triggered when state
  // flips to "success".
  useGSAP(
    () => {
      if (state !== "success") return;
      const root = rootRef.current;
      if (!root) return;

      const dots = root.querySelectorAll<HTMLSpanElement>(".voice-confetti");
      if (dots.length === 0) return;

      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set(dots, { opacity: 0 });
        return;
      }

      gsap.set(dots, {
        opacity: 1,
        scale: 0.6,
        x: 0,
        y: 0,
      });
      gsap.to(dots, {
        x: (i) => Math.cos((i / dots.length) * Math.PI * 2) * 64,
        y: (i) => Math.sin((i / dots.length) * Math.PI * 2) * 64,
        scale: 1.4,
        opacity: 0,
        duration: 1.1,
        ease: "power2.out",
        stagger: 0.04,
      });
    },
    { dependencies: [state], scope: rootRef }
  );

  // When the mic-permission denial is the issue, we want a different copy.
  const isPermissionError = errorMsg === "permission-denied";

  // ---- Cleanup helpers ----

  const cleanupTimers = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    if (captionTimerRef.current) {
      clearTimeout(captionTimerRef.current);
      captionTimerRef.current = null;
    }
  }, []);

  const stopMicTracks = useCallback(() => {
    const r = recorderRef.current;
    if (r?.stream) r.stream.getTracks().forEach((t) => t.stop());
  }, []);

  // Drop everything if we unmount mid-record.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      cleanupTimers();
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      const r = recorderRef.current;
      if (r && r.state === "recording") {
        try {
          r.stop();
        } catch {
          // ignore
        }
      }
      stopMicTracks();
    };
  }, [cleanupTimers, stopMicTracks]);

  // ---- Upload + handle response ----

  const upload = useCallback(
    async (blob: Blob) => {
      setState("processing");
      setProcessingCaption("Listening to your story…");
      // After ~1.6s, swap the caption so the parent feels Pippa is still active.
      captionTimerRef.current = setTimeout(() => {
        setProcessingCaption("Reading the signal…");
      }, 1600);

      const profile = readProfile();
      const babyName = (typeof profile.name === "string" && profile.name) || "Baby";
      const ageWeeks = ageWeeksFromBirth(profile.birthDate);

      const form = new FormData();
      form.append("audio", blob, "voice.webm");
      form.append("babyName", babyName);
      if (typeof ageWeeks === "number") {
        form.append("babyAgeWeeks", String(ageWeeks));
      }

      try {
        const res = await fetch("/api/tracker/voice", {
          method: "POST",
          body: form,
        });
        const data = (await res.json()) as VoiceResponse;
        if (!res.ok) {
          throw new Error(data.error || "Voice request failed");
        }

        if (captionTimerRef.current) {
          clearTimeout(captionTimerRef.current);
          captionTimerRef.current = null;
        }

        setSummary(data.summary ?? "Saved");
        setState("success");
        onLogged?.(data);

        // Auto-collapse back to idle.
        successTimerRef.current = setTimeout(() => {
          setState("idle");
          setSummary(null);
        }, 3000);
      } catch (err) {
        if (captionTimerRef.current) {
          clearTimeout(captionTimerRef.current);
          captionTimerRef.current = null;
        }
        const msg =
          err instanceof Error
            ? err.message
            : "We couldn't reach Pippa just now.";
        setErrorMsg(msg);
        setState("error");
      }
    },
    [onLogged]
  );

  // ---- MediaRecorder lifecycle ----

  const startRecording = useCallback(async () => {
    setErrorMsg(null);
    setSummary(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (
        name === "NotAllowedError" ||
        name === "SecurityError" ||
        name === "PermissionDeniedError"
      ) {
        setErrorMsg("permission-denied");
      } else {
        setErrorMsg(
          "We couldn't reach your microphone. Make sure no other app is using it."
        );
      }
      setState("error");
      return;
    }

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      try {
        recorder = new MediaRecorder(stream);
      } catch {
        stream.getTracks().forEach((t) => t.stop());
        setErrorMsg("This browser can't record audio. Try Safari or Chrome.");
        setState("error");
        return;
      }
    }

    chunksRef.current = [];
    cancelledRef.current = false;

    recorder.addEventListener("dataavailable", (e: BlobEvent) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    });

    recorder.addEventListener("stop", () => {
      cleanupTimers();
      stopMicTracks();

      if (cancelledRef.current) {
        recorderRef.current = null;
        return;
      }

      const elapsedSec =
        (performance.now() - startedAtRef.current) / 1000;
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || mimeType || "audio/webm",
      });
      recorderRef.current = null;

      if (elapsedSec < 0.5 || blob.size === 0) {
        setErrorMsg("That was too short — try again with a full sentence.");
        setState("error");
        return;
      }

      void upload(blob);
    });

    recorder.addEventListener("error", () => {
      setErrorMsg("Recording stopped unexpectedly.");
      setState("error");
    });

    recorderRef.current = recorder;
    startedAtRef.current = performance.now();
    setElapsed(0);
    setState("recording");

    recorder.start();

    tickRef.current = setInterval(() => {
      const e = Math.floor(
        (performance.now() - startedAtRef.current) / 1000
      );
      setElapsed(e);
    }, 250);

    maxTimerRef.current = setTimeout(() => {
      const r = recorderRef.current;
      if (r && r.state === "recording") r.stop();
    }, MAX_RECORD_SECONDS * 1000);
  }, [cleanupTimers, stopMicTracks, upload]);

  const stopRecording = useCallback(() => {
    const r = recorderRef.current;
    if (r && r.state === "recording") r.stop();
  }, []);

  // ---- Click handler — single button drives the state machine ----

  const onMicTap = useCallback(() => {
    if (state === "idle" || state === "success" || state === "error") {
      void startRecording();
      return;
    }
    if (state === "recording") {
      stopRecording();
      return;
    }
    // processing → ignore
  }, [state, startRecording, stopRecording]);

  // ---- Render helpers ----

  const ringClass = useMemo(() => {
    switch (state) {
      case "recording":
        return "bg-vivid-peach-soft";
      case "processing":
        return "bg-soft-blue-soft";
      case "success":
        return "bg-sage-soft";
      case "error":
        return "bg-rose-soft";
      default:
        return "bg-vivid-peach-soft";
    }
  }, [state]);

  const innerRingClass = useMemo(() => {
    switch (state) {
      case "recording":
        return "bg-peach-soft";
      case "processing":
        return "bg-soft-blue/40";
      case "success":
        return "bg-sage/30";
      case "error":
        return "bg-rose-soft";
      default:
        return "bg-peach-soft";
    }
  }, [state]);

  const showPulse = state === "recording" || state === "processing";
  const isIdleish = state === "idle" || state === "error";

  const elapsedLabel = useMemo(() => {
    const s = elapsed;
    const mm = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [elapsed]);

  const caption = useMemo(() => {
    switch (state) {
      case "idle":
        return "Tap to talk to Pippa";
      case "recording":
        return "Listening… tap to stop";
      case "processing":
        return processingCaption;
      case "success":
        return summary ? `Logged: ${summary}` : "Logged";
      case "error":
        if (isPermissionError) {
          return "Pippa needs your microphone to listen. Open settings and try again.";
        }
        return errorMsg ?? "Something went wrong.";
      default:
        return "";
    }
  }, [state, processingCaption, summary, errorMsg, isPermissionError]);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-h2 text-ink">Voice Entry</h2>
      <div
        ref={rootRef}
        className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-6 flex flex-col items-center gap-4 text-center"
      >
        <div className="relative size-44 grid place-items-center">
          {/* Confetti dots — absolutely positioned at the centre, animated by GSAP. */}
          {state === "success" && (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="voice-confetti absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-2 rounded-pill bg-peach opacity-0 will-change-transform"
                />
              ))}
            </>
          )}

          {/* Two pulsing rings — visible during record + processing. */}
          {showPulse ? (
            <>
              <span
                aria-hidden
                className={cn(
                  "absolute inset-0 rounded-pill motion-safe:animate-[listenPulse_2.2s_ease-out_infinite]",
                  ringClass
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "absolute inset-4 rounded-pill motion-safe:animate-[listenPulse_2.2s_ease-out_infinite]",
                  innerRingClass
                )}
                style={{ animationDelay: "0.6s" }}
              />
            </>
          ) : (
            <>
              <span
                aria-hidden
                className={cn(
                  "absolute inset-0 rounded-pill",
                  ringClass,
                  isIdleish &&
                    "motion-safe:animate-[listenPulse_2.2s_ease-out_infinite]"
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "absolute inset-4 rounded-pill",
                  innerRingClass,
                  isIdleish &&
                    "motion-safe:animate-[listenPulse_2.2s_ease-out_infinite]"
                )}
                style={isIdleish ? { animationDelay: "0.6s" } : undefined}
              />
            </>
          )}

          <button
            type="button"
            onClick={onMicTap}
            disabled={state === "processing"}
            aria-label={
              state === "recording"
                ? "Stop recording"
                : state === "processing"
                  ? "Processing"
                  : "Start voice entry"
            }
            aria-pressed={state === "recording"}
            className={cn(
              "relative size-20 rounded-pill grid place-items-center shadow-[var(--shadow-pop)] transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-peach/80 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
              state === "recording" && "bg-clay",
              state === "processing" && "bg-soft-blue",
              state === "success" && "bg-sage",
              (state === "idle" || state === "error") && "bg-peach"
            )}
          >
            {state === "success" ? (
              <Check className="size-8 text-cream" strokeWidth={2.4} aria-hidden />
            ) : state === "recording" ? (
              <Square
                className="size-7 text-cream fill-cream"
                strokeWidth={0}
                aria-hidden
              />
            ) : (
              <Mic
                className="size-8 text-cream"
                strokeWidth={2.2}
                aria-hidden
              />
            )}
          </button>
        </div>

        {/* Counter pill while recording. */}
        {state === "recording" && (
          <div className="inline-flex items-center gap-2 rounded-pill bg-clay/10 px-3 py-1 text-small text-clay">
            <span
              aria-hidden
              className="size-2 rounded-pill bg-clay motion-safe:animate-[pulseSoft_1.2s_ease-in-out_infinite]"
            />
            Recording {elapsedLabel}
          </div>
        )}

        <p
          className={cn(
            "text-small max-w-xs",
            state === "error" ? "text-clay" : "text-stone"
          )}
          aria-live="polite"
        >
          {caption}
        </p>

        {state === "error" && (
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setState("idle");
            }}
            className="text-small text-plum font-medium hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    </section>
  );
}
