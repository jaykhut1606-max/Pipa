// Tiny localStorage helper for milestone completion. Same shape and
// failure semantics as the baby-profile store: writes silently drop in
// Safari Private Browsing rather than crashing the page.

const KEY = "pippa.milestones.v1";

export type MilestoneState = Record<string, true>;

export function readMilestones(): MilestoneState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as MilestoneState;
    }
    return {};
  } catch {
    return {};
  }
}

export function writeMilestones(state: MilestoneState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function setMilestoneCompleted(id: string, completed: boolean): void {
  const next = readMilestones();
  if (completed) {
    next[id] = true;
  } else {
    delete next[id];
  }
  writeMilestones(next);
}
