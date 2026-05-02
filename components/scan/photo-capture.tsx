"use client";

// Reusable camera/gallery capture surface. Used by /scan/diaper now and
// imported by /scan/rash later. Renders a full-bleed cream area with a
// dashed framing guide, a peach circular shutter (label + hidden file input
// with capture="environment"), and a "Choose from gallery" fallback.
//
// File validation: image/* + size < 8MB. Anything else triggers a sonner toast
// and the input value is cleared so the user can retry.
import { useRef } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_BYTES = 8 * 1024 * 1024;

type Props = {
  onCapture: (file: File) => void;
  onCancel?: () => void;
  helperText?: string;
};

export function PhotoCapture({
  onCapture,
  onCancel,
  helperText = "Position the diaper in good light",
}: Props) {
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Always reset the input so picking the same file twice still fires onChange.
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("That doesn't look like a photo. Try again?");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Photo's a bit large. Try one under 8MB.");
      return;
    }
    onCapture(file);
  }

  return (
    <div className="flex-1 flex flex-col bg-cream relative">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="absolute top-4 left-4 z-10 size-11 grid place-items-center rounded-pill bg-cream/80 text-ink hover:bg-bone transition-colors"
        >
          <X className="size-5" aria-hidden />
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <p className="text-body text-stone text-center max-w-xs">
          {helperText}
        </p>

        {/* Decorative dashed framing guide */}
        <div className="relative w-full max-w-sm aspect-square">
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full text-peach/60"
          >
            <rect
              x="3"
              y="3"
              width="94"
              height="94"
              rx="8"
              ry="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-micro uppercase tracking-wider text-stone/70">
              frame here
            </span>
          </div>
        </div>
      </div>

      <div className="pb-10 pt-4 flex flex-col items-center gap-4">
        {/* Shutter — hidden input wrapped in a styled label. */}
        <label
          className={cn(
            "size-20 rounded-pill bg-peach text-ink grid place-items-center cursor-pointer",
            "shadow-[var(--shadow-pop)] hover:bg-peach/90 transition-colors",
            "focus-within:ring-3 focus-within:ring-peach/40"
          )}
          aria-label="Take photo"
        >
          <span className="size-14 rounded-pill border-[3px] border-ink/80 grid place-items-center">
            <span className="size-10 rounded-pill bg-ink/80" />
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="sr-only"
          />
        </label>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="text-small text-stone hover:text-ink underline-offset-4 hover:underline h-11 px-4"
        >
          Choose from gallery
        </button>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="sr-only"
        />
      </div>
    </div>
  );
}
