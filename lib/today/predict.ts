// Predictive next-window math for Pippa Today.
//
// Uses age-banded pediatric norms × the most-recent event time to give a
// "next likely feed" / "next likely nap" window. Deterministic, no AI —
// the brief API combines this with the AI narrative in one response.
//
// Norms are conservative ranges; the brief explicitly notes these are
// estimates so the parent doesn't treat them as a clock.

export type AgeBand = {
  feedHours: [number, number]; // typical hours between feeds
  wakeMinutes: [number, number]; // typical awake-window before next nap
};

export function ageBand(weeks: number | undefined): AgeBand {
  const w = typeof weeks === "number" && weeks >= 0 ? weeks : 4;
  if (w < 4) return { feedHours: [2, 3], wakeMinutes: [30, 60] };
  if (w < 12) return { feedHours: [2.5, 3.5], wakeMinutes: [60, 90] };
  if (w < 16) return { feedHours: [3, 4], wakeMinutes: [75, 105] };
  if (w < 26) return { feedHours: [3, 4], wakeMinutes: [90, 135] };
  if (w < 52) return { feedHours: [3.5, 4.5], wakeMinutes: [120, 180] };
  return { feedHours: [4, 5], wakeMinutes: [150, 240] };
}

export type Window = {
  // Earliest / latest time the next event is likely to fall, as ISO strings.
  // Both are in absolute time so the client can compute live countdowns
  // without having to know server time.
  earliestIso: string;
  latestIso: string;
  // Minutes until the start of the window; negative means we're inside
  // or past it.
  minutesUntilEarliest: number;
};

export function predictWindow(
  fromIso: string,
  rangeMinutes: [number, number],
): Window {
  const fromMs = new Date(fromIso).getTime();
  const earliest = fromMs + rangeMinutes[0] * 60_000;
  const latest = fromMs + rangeMinutes[1] * 60_000;
  return {
    earliestIso: new Date(earliest).toISOString(),
    latestIso: new Date(latest).toISOString(),
    minutesUntilEarliest: Math.round((earliest - Date.now()) / 60_000),
  };
}

export function nextFeedWindow(
  ageWeeks: number | undefined,
  lastFeedIso: string | null,
): Window | null {
  if (!lastFeedIso) return null;
  const band = ageBand(ageWeeks);
  return predictWindow(lastFeedIso, [
    band.feedHours[0] * 60,
    band.feedHours[1] * 60,
  ]);
}

export function nextSleepWindow(
  ageWeeks: number | undefined,
  lastSleepEndIso: string | null,
): Window | null {
  if (!lastSleepEndIso) return null;
  const band = ageBand(ageWeeks);
  return predictWindow(lastSleepEndIso, band.wakeMinutes);
}
