"use client";

// Two-step rash form: first the photo (PhotoCapture from Phase 4), then the
// metadata chips. Once everything is set we hand a single payload up to the
// page so it can POST and switch to the analyzing animation.
import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { PhotoCapture } from "@/components/scan/photo-capture";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { cn } from "@/lib/utils";

type DurationLabel = "today" | "few days" | "over a week";
type FeverState = "yes" | "no" | "unsure";

type Submission = {
  photo: File;
  bodyLocation: string;
  durationLabel: DurationLabel;
  fever: FeverState;
};

type Props = {
  onSubmit: (data: Submission) => void;
};

const BODY_LOCATIONS = [
  "face",
  "scalp",
  "torso",
  "arms",
  "legs",
  "diaper area",
  "neck folds",
  "behind ears",
];

const DURATIONS: { value: DurationLabel; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "few days", label: "A few days" },
  { value: "over a week", label: "Over a week" },
];

const FEVERS: { value: FeverState; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Unsure" },
];

export function RashForm({ onSubmit }: Props) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [bodyLocation, setBodyLocation] = useState<string | null>(null);
  const [durationLabel, setDurationLabel] = useState<DurationLabel | null>(null);
  const [fever, setFever] = useState<FeverState | null>(null);

  const previewUrl = photo
    ? // Object URLs are revoked when the user retakes — see resetPhoto below.
      URL.createObjectURL(photo)
    : null;

  function resetPhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPhoto(null);
  }

  if (!photo) {
    return (
      <div className="flex-1 flex flex-col">
        <PhotoCapture
          onCapture={(file) => setPhoto(file)}
          helperText="Frame just the rash, in good light. Skin tone visible."
        />
      </div>
    );
  }

  const isReady = Boolean(photo && bodyLocation && durationLabel && fever);

  function handleSubmit() {
    if (!photo || !bodyLocation || !durationLabel || !fever) return;
    onSubmit({ photo, bodyLocation, durationLabel, fever });
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Photo preview with retake affordance */}
      <div className="relative w-full max-w-sm mx-auto">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-bone shadow-[var(--shadow-soft)]">
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Rash preview"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <button
          type="button"
          onClick={resetPhoto}
          className="absolute top-3 right-3 inline-flex items-center gap-1 px-3 h-9 rounded-pill bg-cream/95 text-ink text-small shadow-[var(--shadow-soft)] hover:bg-cream"
        >
          <Pencil className="size-3.5" aria-hidden />
          Retake
        </button>
      </div>

      <FormSection
        label="Where on the body?"
        helper="Pick the closest match."
      >
        <ChipGroup
          options={BODY_LOCATIONS.map((v) => ({ value: v, label: v }))}
          value={bodyLocation}
          onChange={setBodyLocation}
          ariaLabel="Body location"
        />
      </FormSection>

      <FormSection label="How long has it been there?">
        <ChipGroup
          options={DURATIONS}
          value={durationLabel}
          onChange={(v) => setDurationLabel(v as DurationLabel)}
          ariaLabel="Duration"
        />
      </FormSection>

      <FormSection
        label="Any fever?"
        helper="A fever changes how we triage."
      >
        <ChipGroup
          options={FEVERS}
          value={fever}
          onChange={(v) => setFever(v as FeverState)}
          ariaLabel="Fever"
        />
      </FormSection>

      <PrimaryCTA
        onClick={handleSubmit}
        disabled={!isReady}
        showArrow
        fullWidth
      >
        Check rash
      </PrimaryCTA>
    </div>
  );
}

function FormSection({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-h3 text-ink">{label}</h2>
        {helper && <p className="text-small text-stone">{helper}</p>}
      </div>
      {children}
    </section>
  );
}

type ChipGroupProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  ariaLabel?: string;
};

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: ChipGroupProps<T>) {
  return (
    <ul role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <li key={opt.value}>
            <motion.button
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={isSelected}
              animate={{ scale: isSelected ? 1.05 : 1 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "min-h-12 px-5 rounded-pill text-body font-medium inline-flex items-center transition-colors",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-rose/40 capitalize",
                isSelected
                  ? "bg-rose text-cream shadow-[var(--shadow-soft)]"
                  : "bg-cream border border-bone text-ink hover:bg-rose-soft/60"
              )}
            >
              {opt.label}
            </motion.button>
          </li>
        );
      })}
    </ul>
  );
}
