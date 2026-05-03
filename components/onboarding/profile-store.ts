// Tiny localStorage helper for the demo-mode baby profile.
// Wrapped in try/catch because Safari Private Browsing throws on every write
// and we'd rather drop the persistence than crash the onboarding flow.
export const PROFILE_KEY = "pippa.baby";
export const BABY_ID_KEY = "pippa.baby.id";

export type BabyProfile = {
  name: string;
  birthDate: string; // ISO date (YYYY-MM-DD)
  feedingType: string[];
  concerns: string[];
  onboardedAt: string; // ISO datetime
};

// The DB row id, written after the first successful POST /api/demo/baby
// so subsequent edits update the same row instead of inserting twice.
export function readBabyId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(BABY_ID_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function writeBabyId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BABY_ID_KEY, id);
  } catch {
    // private mode — drop silently
  }
}

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
