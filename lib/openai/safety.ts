// Hardcoded safety overrides — these NEVER come from the model.
// Full implementation arrives in Phase 4 (diaper) and Phase 5 (rash).
// Spec Part 6.2 + 6.4 + 14.2 are authoritative.
import type { DiaperScanResult, RashScanResult } from "@/lib/types";

export function applyDiaperSafetyOverrides(
  result: DiaperScanResult,
  _babyAgeWeeks: number
): DiaperScanResult {
  return result;
}

export function applyRashSafetyOverrides(
  result: RashScanResult,
  _babyAgeWeeks: number,
  _hasFever: boolean
): RashScanResult {
  return result;
}
