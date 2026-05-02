// Avatar selection — six pre-illustrated kid portraits (a1–a6).
// Each is served from /public/images/avatar-aN.png.
//
// Persisted to localStorage so the choice survives a refresh; everything
// is wrapped in try/catch because Safari Private Browsing throws on every
// write.
import type { CSSProperties } from "react";

const STORAGE_KEY = "pippa.baby.avatar.v1";

export const PRESET_AVATAR_IDS = ["a1", "a2", "a3", "a4", "a5", "a6"] as const;
export type PresetAvatarId = (typeof PRESET_AVATAR_IDS)[number];

export type AvatarSelection = { kind: "preset"; id: PresetAvatarId };

export const DEFAULT_AVATAR: AvatarSelection = { kind: "preset", id: "a1" };

export function avatarSrc(sel: AvatarSelection): string {
  return `/images/avatar-${sel.id}.png`;
}

// Kept as a no-op so existing callers that pass the result into
// `style={...}` don't need to change.
export function avatarStyle(_sel: AvatarSelection): CSSProperties | null {
  return null;
}

export function avatarAlt(sel: AvatarSelection, name?: string | null): string {
  const who = name?.trim() || "Baby";
  return `${who} avatar (${sel.id})`;
}

export function isSameAvatar(a: AvatarSelection, b: AvatarSelection): boolean {
  return a.kind === b.kind && a.id === b.id;
}

export function readAvatar(): AvatarSelection {
  if (typeof window === "undefined") return DEFAULT_AVATAR;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AVATAR;
    const parsed = JSON.parse(raw) as { kind?: string; id?: unknown };
    if (
      parsed?.kind === "preset" &&
      typeof parsed.id === "string" &&
      (PRESET_AVATAR_IDS as readonly string[]).includes(parsed.id)
    ) {
      return { kind: "preset", id: parsed.id as PresetAvatarId };
    }
    return DEFAULT_AVATAR;
  } catch {
    return DEFAULT_AVATAR;
  }
}

export function writeAvatar(sel: AvatarSelection): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sel));
  } catch {
    // ignore
  }
}

export function allAvatarOptions(): AvatarSelection[] {
  return PRESET_AVATAR_IDS.map((id) => ({ kind: "preset" as const, id }));
}
