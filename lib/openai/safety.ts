// Hardcoded safety overrides — these NEVER come from the model.
// Spec Part 6.2 + 6.4 + 14.2 are authoritative. The pale-stool override in
// particular has a real-world reason (biliary atresia has a ~60-day surgical
// window) and must escalate even if the model says "looks fine."
import type { DiaperScanResult, RashScanResult } from "@/lib/types";

const PALE_COLOR_NAMES = ["pale", "white", "clay", "chalky", "gray", "grey"];
const PALE_HEX_PREFIXES = ["#E8DDD0", "#EDE5D5", "#F0EAD9", "#E0D5C0", "#D8CFB8"];
const BLOOD_NAMES = ["black", "red", "bloody", "maroon"];

export function applyDiaperSafetyOverrides(
  result: DiaperScanResult,
  babyAgeWeeks: number
): DiaperScanResult {
  const colorName = result.visualAnalysis?.colorName?.toLowerCase() ?? "";
  const primaryColor =
    result.visualAnalysis?.primaryColor?.toUpperCase() ?? "";
  const features = result.visualAnalysis?.notableFeatures ?? [];

  const isPale =
    PALE_COLOR_NAMES.some((n) => colorName.includes(n)) ||
    PALE_HEX_PREFIXES.includes(primaryColor);

  const isBloody =
    BLOOD_NAMES.some((n) => colorName.includes(n)) ||
    features.some(
      (f) =>
        f.toLowerCase().includes("blood") ||
        f.toLowerCase().includes("red streak")
    );

  if (isPale && babyAgeWeeks < 24) {
    return {
      ...result,
      assessment: {
        status: "CALL_PEDIATRICIAN",
        explanation:
          "Pale or chalky stools can signal something the liver is handling, and in young babies this needs same-day pediatric evaluation. This is one of those calls where being early is always right.",
        contextualNote:
          "Liver-related concerns have a narrow window where early action matters.",
      },
      recommendation: {
        primary:
          "Call your pediatrician today. If the office is closed, urgent care is appropriate.",
        medicalEscalation: {
          reason:
            "Pale/clay stool in a baby under 6 months requires same-day evaluation",
          urgency: "today",
        },
      },
      _safetyOverride: "pale_stool_newborn",
    };
  }

  if (isBloody) {
    return {
      ...result,
      assessment: {
        status: "CALL_PEDIATRICIAN",
        explanation:
          "Red or black streaks can indicate something that needs a pediatrician's eyes today. Trust your instinct on this one.",
        contextualNote:
          "Blood in stool is always worth same-day evaluation in babies.",
      },
      recommendation: {
        primary: "Call your pediatrician today.",
        medicalEscalation: {
          reason: "Blood in stool requires same-day evaluation in infants",
          urgency: "today",
        },
      },
      _safetyOverride: "blood_in_stool",
    };
  }

  return result;
}

export function applyRashSafetyOverrides(
  result: RashScanResult,
  babyAgeWeeks: number,
  hasFever: boolean
): RashScanResult {
  if (hasFever && babyAgeWeeks < 12) {
    return {
      ...result,
      triage: {
        recommendation: "URGENT_CARE",
        reasoning:
          "Fever in babies under 3 months always requires same-day pediatric evaluation, regardless of how the rash looks.",
        urgencyLabel: "Today",
      },
      _safetyOverride: "fever_under_12_weeks",
    };
  }
  return result;
}
