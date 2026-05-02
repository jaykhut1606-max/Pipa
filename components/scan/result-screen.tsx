"use client";

// Single result screen shared by all three scan types (diaper / cry / rash).
// Picks data out of the union shape based on scan.scanType, derives status
// theming from scan.status (or, for cry, scan.result.primaryReason.label),
// and runs a staggered framer-motion entrance.
import { motion } from "framer-motion";
import { GradientHero } from "@/components/primitives/gradient-hero";
import { NavBar } from "@/components/primitives/nav-bar";
import { Character } from "@/components/primitives/character";
import { ResultBadge } from "@/components/primitives/result-badge";
import { StatusPill } from "@/components/primitives/status-pill";
import { SoothingCard } from "@/components/primitives/soothing-card";
import type { DemoScan } from "@/lib/scan-store";
import type {
  DiaperScanResult,
  RashScanResult,
  ResultBadgeStatus,
} from "@/lib/types";

type Tone = "peach" | "sage" | "rose" | "amber" | "blue" | "lavender" | "cream";
type CharacterBg =
  | "peach"
  | "sage"
  | "rose"
  | "amber"
  | "soft-blue"
  | "lavender"
  | "mint"
  | "cream";
type CharacterVariant =
  | "baby"
  | "moon"
  | "bottle"
  | "bear"
  | "shield"
  | "rocket"
  | "stars"
  | "sparkle"
  | "heart"
  | "rainbow"
  | "thinking"
  | "celebrate";
type PillColor =
  | "sage"
  | "amber"
  | "clay"
  | "peach"
  | "soft-blue"
  | "rose"
  | "stone";

// Cry scan result — only the bits this screen consumes. Lives here until
// Phase 5 promotes it into lib/types.
type CryAnalyzerResultLite = {
  primaryReason: {
    label: string;
    explanation: string;
    suggestion: string;
    confidence?: number;
  };
  audioNotes?: string;
};

type Theme = {
  tone: Tone;
  bg: CharacterBg;
  variant: CharacterVariant;
  pill: PillColor;
  pillLabel: string;
};

const STATUS_THEME: Record<ResultBadgeStatus, Theme> = {
  healthy: {
    tone: "sage",
    bg: "sage",
    variant: "heart",
    pill: "sage",
    pillLabel: "All clear",
  },
  monitor: {
    tone: "amber",
    bg: "amber",
    variant: "thinking",
    pill: "amber",
    pillLabel: "Worth watching",
  },
  urgent: {
    tone: "rose",
    bg: "rose",
    variant: "shield",
    pill: "clay",
    pillLabel: "Call pediatrician",
  },
  unclear: {
    tone: "cream",
    bg: "cream",
    variant: "thinking",
    pill: "stone",
    pillLabel: "Hard to say",
  },
  // Cry-specific labels reuse the same kit.
  tired: {
    tone: "lavender",
    bg: "soft-blue",
    variant: "moon",
    pill: "soft-blue",
    pillLabel: "Likely tired",
  },
  hungry: {
    tone: "peach",
    bg: "peach",
    variant: "bottle",
    pill: "peach",
    pillLabel: "Likely hungry",
  },
  discomfort: {
    tone: "rose",
    bg: "rose",
    variant: "bear",
    pill: "rose",
    pillLabel: "Discomfort",
  },
};

// Map a cry's primaryReason.label → ResultBadgeStatus.
function cryLabelToBadge(label: string | undefined): ResultBadgeStatus {
  switch (label) {
    case "hungry":
      return "hungry";
    case "tired":
      return "tired";
    case "discomfort":
    case "wind_gas":
    case "needs_change":
    case "wants_contact":
    case "overstimulated":
      return "discomfort";
    case "pain":
      return "urgent";
    case "unclear":
      return "unclear";
    default:
      return "unclear";
  }
}

type ExtractedCopy = {
  badge: ResultBadgeStatus;
  headline: string;
  secondary?: string;
  primaryAction: string;
};

function extractCopy(scan: DemoScan): ExtractedCopy {
  if (scan.scanType === "diaper") {
    const r = scan.result as DiaperScanResult;
    return {
      badge: scan.status,
      headline: r.assessment?.explanation ?? "We have a read on this scan.",
      secondary: r.assessment?.contextualNote,
      primaryAction:
        r.recommendation?.primary ?? "Keep an eye on the next diaper.",
    };
  }
  if (scan.scanType === "cry") {
    const r = scan.result as CryAnalyzerResultLite;
    return {
      badge: cryLabelToBadge(r.primaryReason?.label),
      headline:
        r.primaryReason?.explanation ?? "Here's what we're hearing.",
      secondary: r.audioNotes,
      primaryAction:
        r.primaryReason?.suggestion ?? "Try a calm, slow rock and a fresh diaper.",
    };
  }
  // rash
  const r = scan.result as RashScanResult & {
    possibleConditions?: { description?: string }[];
    homeCare?: string[];
    escalation?: { whatToTell?: string } | null;
  };
  return {
    badge: scan.status,
    headline:
      r.triage?.reasoning ?? "We have a read on this skin condition.",
    secondary: r.possibleConditions?.[0]?.description,
    primaryAction:
      r.escalation?.whatToTell ??
      r.homeCare?.[0] ??
      "Keep the area clean and dry, and watch for changes.",
  };
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

type Props = { scan: DemoScan };

export function ResultScreen({ scan }: Props) {
  const copy = extractCopy(scan);
  const theme = STATUS_THEME[copy.badge];
  const isUrgent = copy.badge === "urgent";

  return (
    <main className="flex-1 flex flex-col">
      <NavBar showBack backHref="/scan" />
      <GradientHero tone={theme.tone} className="flex-1 flex flex-col">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="container-app flex-1 flex flex-col items-center gap-6 py-10"
        >
          <motion.div variants={fadeUp}>
            <Character variant={theme.variant} bg={theme.bg} size="lg" />
          </motion.div>

          <motion.div variants={scaleIn}>
            <ResultBadge status={copy.badge} size="lg" />
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
            <StatusPill color={theme.pill}>{theme.pillLabel}</StatusPill>
            <h1 className="font-display text-h1 text-ink text-center text-balance">
              {copy.headline}
            </h1>
            {copy.secondary && (
              <p className="text-small text-stone text-center max-w-prose">
                {copy.secondary}
              </p>
            )}
          </motion.div>

          <motion.div variants={fadeUp} className="w-full">
            <SoothingCard eyebrow="Pippa suggests">
              {copy.primaryAction}
            </SoothingCard>
          </motion.div>

          {isUrgent && (
            <motion.div variants={fadeUp} className="w-full">
              <section className="rounded-lg bg-clay-soft text-ink p-5 flex flex-col gap-2">
                <p className="font-display text-h3 text-clay">
                  Trust your instinct.
                </p>
                <p className="text-body text-ink">
                  You know {scan.babyName} best.
                </p>
                <p className="text-micro text-stone pt-1">
                  If this is an emergency, call 911.
                </p>
              </section>
            </motion.div>
          )}

          <motion.p
            variants={fadeUp}
            className="text-micro text-stone text-center pt-2 max-w-prose"
          >
            Educational support, not medical diagnosis.
          </motion.p>
        </motion.div>
      </GradientHero>
    </main>
  );
}
