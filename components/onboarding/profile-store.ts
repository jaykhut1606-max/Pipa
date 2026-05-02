// Tiny localStorage helper for the demo-mode baby profile.
// Wrapped in try/catch because Safari Private Browsing throws on every write
// and we'd rather drop the persistence than crash the onboarding flow.
export const PROFILE_KEY = "pippa.baby";

export type BabyProfile = {
  name: string;
  birthDate: string; // ISO date (YYYY-MM-DD)
  feedingType: string[];
  concerns: string[];
  onboardedAt: string; // ISO datetime
};

export function readProfile(): Partial<BabyProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return (parsed && typeof parsed === "object" ? parsed : {}) as Partial<BabyProfile>;
  } catch {
    return {};
  }
}

export function writeProfile(patch: Partial<BabyProfile>): void {
  if (typeof window === "undefined") return;
  try {
    const current = readProfile();
    const next = { ...current, ...patch };
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing or quota exceeded — silently drop.
  }
}
