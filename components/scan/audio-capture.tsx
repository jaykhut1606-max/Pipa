"use client";

// Headless-ish microphone recorder used by /scan/cry. The visible UI lives
// in the page (concentric pulse + plum CTA) — this component owns the
// MediaRecorder lifecycle, permission handling, and duration accounting.
//
// We expose imperative start/stop via a ref so the parent page can wire the
// big "Listening…" pill and the central X cancel button to the same recorder.
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type AudioCaptureHandle = {
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
};

type Props = {
  onCaptureComplete: (audioBlob: Blob, durationSec: number) => void;
  onTooShort: () => void;
  onPermissionDenied?: () => void;
  onError?: (message: string) => void;
  onTick?: (elapsedSec: number) => void;
  minSec?: number;
  maxSec?: number;
};

// Pick the first MIME type the browser actually supports.
// Order matters: Opus in WebM is the cleanest target on Chromium/Firefox;
// Safari fell in line in 14.1+ but we still want graceful fallbacks.
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
      // Some browsers throw on unknown types — keep trying.
    }
  }
  return undefined;
}

export const AudioCapture = forwardRef<AudioCaptureHandle, Props>(
  function AudioCapture(
    {
      onCaptureComplete,
      onTooShort,
      onPermissionDenied,
      onError,
      onTick,
      minSec = 3,
      maxSec = 15,
    },
    ref
  ) {
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const startedAtRef = useRef<number>(0);
    const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cancelledRef = useRef<boolean>(false);
    const [, setIsRecording] = useState(false);

    const cleanupTimers = useCallback(() => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      if (maxTimerRef.current) {
        clearTimeout(maxTimerRef.current);
        maxTimerRef.current = null;
      }
    }, []);

    const stopTracks = useCallback(() => {
      const recorder = recorderRef.current;
      if (recorder?.stream) {
        recorder.stream.getTracks().forEach((t) => t.stop());
      }
    }, []);

    const start = useCallback(async () => {
      if (recorderRef.current && recorderRef.current.state === "recording") {
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        const name =
          err instanceof Error && "name" in err ? (err as Error).name : "";
        if (
          name === "NotAllowedError" ||
          name === "SecurityError" ||
          name === "PermissionDeniedError"
        ) {
          onPermissionDenied?.();
        } else {
          onError?.(
            "We couldn't reach your microphone. Make sure no other app is using it."
          );
        }
        return;
      }

      const mimeType = pickMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
      } catch {
        // Some browsers reject options entirely; retry without.
        try {
          recorder = new MediaRecorder(stream);
        } catch {
          stream.getTracks().forEach((t) => t.stop());
          onError?.("This browser can't record audio. Try Safari or Chrome.");
          return;
        }
      }

      chunksRef.current = [];
      cancelledRef.current = false;

      recorder.addEventListener("dataavailable", (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      });

      recorder.addEventListener("stop", () => {
        cleanupTimers();
        stopTracks();
        setIsRecording(false);

        if (cancelledRef.current) {
          recorderRef.current = null;
          return;
        }

        const elapsed = (performance.now() - startedAtRef.current) / 1000;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        recorderRef.current = null;

        if (elapsed < minSec || blob.size === 0) {
          onTooShort();
          return;
        }
        onCaptureComplete(blob, elapsed);
      });

      recorder.addEventListener("error", () => {
        onError?.("Recording stopped unexpectedly.");
      });

      recorderRef.current = recorder;
      startedAtRef.current = performance.now();

      recorder.start();
      setIsRecording(true);

      if (onTick) {
        onTick(0);
        tickIntervalRef.current = setInterval(() => {
          const elapsed = Math.floor(
            (performance.now() - startedAtRef.current) / 1000
          );
          onTick(elapsed);
        }, 250);
      }

      maxTimerRef.current = setTimeout(() => {
        if (recorderRef.current && recorderRef.current.state === "recording") {
          recorderRef.current.stop();
        }
      }, maxSec * 1000);
    }, [
      cleanupTimers,
      maxSec,
      minSec,
      onCaptureComplete,
      onError,
      onPermissionDenied,
      onTick,
      onTooShort,
      stopTracks,
    ]);

    const stop = useCallback(() => {
      const recorder = recorderRef.current;
      if (!recorder) return;
      cancelledRef.current = false;
      if (recorder.state === "recording") {
        recorder.stop();
      }
    }, []);

    const cancel = useCallback(() => {
      const recorder = recorderRef.current;
      if (!recorder) return;
      cancelledRef.current = true;
      cleanupTimers();
      if (recorder.state === "recording") {
        recorder.stop();
      } else {
        stopTracks();
        recorderRef.current = null;
        setIsRecording(false);
      }
    }, [cleanupTimers, stopTracks]);

    useImperativeHandle(ref, () => ({ start, stop, cancel }), [
      start,
      stop,
      cancel,
    ]);

    // Make sure we drop the mic if the page unmounts mid-recording.
    useEffect(() => {
      return () => {
        cancelledRef.current = true;
        cleanupTimers();
        const recorder = recorderRef.current;
        if (recorder && recorder.state === "recording") {
          try {
            recorder.stop();
          } catch {
            // ignore
          }
        }
        stopTracks();
      };
    }, [cleanupTimers, stopTracks]);

    return null;
  }
);
