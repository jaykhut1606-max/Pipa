"use client";

// Themed full-screen shell for /trackers/{type}/log pages. Provides a
// solid pastel background, circular back button + icon-right title, a
// content area, and a fixed Save-routine bar with a bundled Note sheet
// trigger. Children render directly on the themed bg (no inner card).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, FilePlus, Trash2 } from "lucide-react";
import { TrackerIcon } from "@/components/icons/tracker-icon";
import { cn } from "@/lib/utils";

type Tone = "yellow" | "pink" | "blue";
type IconVariant = "sleep" | "diaper" | "feed";

const BG: Record<Tone, string> = {
  yellow: "bg-amber-soft",
  pink: "bg-rose-soft",
  blue: "bg-soft-blue-soft",
};

type Props = {
  tone: Tone;
  iconVariant: IconVariant;
  title: string;
  children: React.ReactNode;
  ctaLabel?: string;
  ctaDisabled?: boolean;
  onSubmit: () => void;
  loading?: boolean;
  note: string;
  onNoteChange: (text: string) => void;
};

export function LogShell({
  tone,
  iconVariant,
  title,
  children,
  ctaLabel = "Save routine",
  ctaDisabled,
  onSubmit,
  loading,
  note,
  onNoteChange,
}: Props) {
  const router = useRouter();
  const [noteOpen, setNoteOpen] = useState(false);
  const [draft, setDraft] = useState(note);

  return (
    <main className={cn("flex-1 flex flex-col", BG[tone])}>
      <header className="px-6 pt-12 pb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.back()}
          className="size-11 rounded-pill bg-stone/40 grid place-items-center text-cream hover:bg-stone/50 transition-colors"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-h2 text-ink">{title}</h1>
          <TrackerIcon variant={iconVariant} size={48} />
        </div>
      </header>

      <div className="flex-1 px-6 pb-44 flex flex-col gap-6">
        {children}
      </div>

      <div className="fixed bottom-6 inset-x-0 z-30 px-6">
        <div className="container-app flex items-center gap-3">
          <button
            type="button"
            aria-label="Add note"
            onClick={() => {
              setDraft(note);
              setNoteOpen(true);
            }}
            className="relative size-14 rounded-pill bg-plum text-cream grid place-items-center shadow-[var(--shadow-pop)] hover:bg-plum/90 transition-colors"
          >
            <FilePlus className="size-5" aria-hidden />
            {note.length > 0 && (
              <span
                aria-hidden
                className="absolute top-0 right-0 size-3 rounded-pill bg-vivid-peach ring-2 ring-plum"
              />
            )}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={ctaDisabled || loading}
            className="flex-1 h-14 rounded-pill bg-plum text-cream font-medium inline-flex items-center justify-center gap-2 shadow-[var(--shadow-pop)] hover:bg-plum/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="size-4" aria-hidden />
            {loading ? "Saving…" : ctaLabel}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {noteOpen && (
          <NoteSheet
            value={draft}
            onChange={setDraft}
            onClose={(commit) => {
              if (commit) onNoteChange(draft);
              setNoteOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

const NOTE_MAX = 200;

function NoteSheet({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (text: string) => void;
  onClose: (commit: boolean) => void;
}) {
  return (
    <>
      <motion.button
        type="button"
        aria-label="Dismiss note"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => onClose(false)}
        className="fixed inset-0 z-40 bg-ink/40"
      />
      <motion.div
        role="dialog"
        aria-label="Note"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-0 inset-x-0 z-50 bg-plum text-cream rounded-t-3xl px-6 pt-3 pb-10"
      >
        <div className="mx-auto h-1 w-10 rounded-pill bg-cream/40" />
        <div className="flex items-center justify-between mt-4">
          <p className="font-display text-h3">Note</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 text-small h-10 px-3 text-cream/80 hover:text-cream"
            >
              Clear
              <Trash2 className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onClose(true)}
              className="inline-flex items-center gap-1.5 text-small h-10 px-3 hover:opacity-80"
            >
              Done
              <Check className="size-4" aria-hidden />
            </button>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border-2 border-vivid-peach/60 px-4 py-3">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, NOTE_MAX))}
            rows={5}
            placeholder="Leave important notes for yourself and health professionals"
            className="w-full bg-transparent text-cream placeholder:text-cream/50 outline-none resize-none text-body"
            autoFocus
          />
          <p className="text-right text-micro text-cream/50">
            {value.length}/{NOTE_MAX}
          </p>
        </div>
      </motion.div>
    </>
  );
}
