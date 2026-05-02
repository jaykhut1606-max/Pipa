// Pediatric age-norm bands. These are typical ranges over 24 hours, used to
// give Pippa-voice insights a friendly benchmark — never a diagnosis.
//
// Sources (consulted 2026):
//   - AAP — "Healthy Sleep Habits: How Many Hours Does Your Child Need?"
//     (sleep totals; newborn 14–17h, infant 12–16h)
//   - CDC — "Infant and Toddler Nutrition" (feeds per 24h, wet diaper counts)
//   - La Leche League — wet/dirty diaper expectations for breastfed infants
//
// Bands are conservative and intentionally wide: real babies vary a lot at
// every age, especially in the first few months.
//
// Usage:
//   const band = ageBand(weeks);
//   const sleep = SLEEP_NORM[band];
//   if (totalDailyMinutes < sleep.dailyMinutes.low) ...

export type AgeBand = "newborn" | "youngInfant" | "infant" | "olderInfant" | "toddler";

export type Band = { low: number; high: number };

// Daily total sleep, minutes / 24h. AAP brackets:
//   newborn (0–4w):       14–17h  (840–1020 min)
//   young infant (4–16w): 14–16h  (840–960 min)
//   infant (4–7m):        12–16h  (720–960 min)
//   older infant (7–12m): 12–15h  (720–900 min)
//   toddler (1y+):        11–14h  (660–840 min)
export const SLEEP_NORM: Record<AgeBand, { dailyMinutes: Band; label: string }> = {
  newborn: { dailyMinutes: { low: 14 * 60, high: 17 * 60 }, label: "newborns" },
  youngInfant: { dailyMinutes: { low: 14 * 60, high: 16 * 60 }, label: "young infants" },
  infant: { dailyMinutes: { low: 12 * 60, high: 16 * 60 }, label: "infants" },
  olderInfant: { dailyMinutes: { low: 12 * 60, high: 15 * 60 }, label: "older infants" },
  toddler: { dailyMinutes: { low: 11 * 60, high: 14 * 60 }, label: "toddlers" },
};

// Feeds / 24h. CDC + AAP rough guidance:
//   newborn:        8–12 (every 2–3h, often more)
//   young infant:   7–10
//   infant:         6–8
//   older infant:   5–7 (solids supplementing)
//   toddler:        3–5 (mostly solids)
export const FEED_NORM: Record<AgeBand, { perDay: Band; label: string }> = {
  newborn: { perDay: { low: 8, high: 12 }, label: "newborns" },
  youngInfant: { perDay: { low: 7, high: 10 }, label: "young infants" },
  infant: { perDay: { low: 6, high: 8 }, label: "infants" },
  olderInfant: { perDay: { low: 5, high: 7 }, label: "older infants" },
  toddler: { perDay: { low: 3, high: 5 }, label: "toddlers" },
};

// Wet diapers / 24h. La Leche League hydration guideline: 6+ wets/day after
// the first week is reassuring for breastfed babies. Drops naturally as they
// transition off exclusive milk feeds.
export const WET_DIAPER_NORM: Record<AgeBand, { perDay: Band; label: string }> = {
  newborn: { perDay: { low: 6, high: 10 }, label: "newborns" },
  youngInfant: { perDay: { low: 6, high: 8 }, label: "young infants" },
  infant: { perDay: { low: 5, high: 7 }, label: "infants" },
  olderInfant: { perDay: { low: 4, high: 6 }, label: "older infants" },
  toddler: { perDay: { low: 3, high: 5 }, label: "toddlers" },
};

export function ageBand(weeks: number): AgeBand {
  if (!Number.isFinite(weeks) || weeks < 0) return "infant";
  if (weeks < 4) return "newborn";
  if (weeks < 16) return "youngInfant";
  if (weeks < 28) return "infant";
  if (weeks < 52) return "olderInfant";
  return "toddler";
}

// Helper: human-readable hour band for narration ("14–17h/day").
export function formatHourBand(b: Band): string {
  return `${Math.round(b.low / 60)}–${Math.round(b.high / 60)}h/day`;
}

// Helper: classify a value against a band — useful for picking interpretation
// copy. Returns "low" / "typical" / "high".
export function classify(value: number, band: Band): "low" | "typical" | "high" {
  if (value < band.low) return "low";
  if (value > band.high) return "high";
  return "typical";
}
