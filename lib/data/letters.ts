// Dual-mode letters adapter — same pattern as scans/events.
//
// Demo mode: rows live in Supabase tagged with demo_baby_name (when
// SUPABASE_SERVICE_ROLE_KEY is set) or in an in-memory Map (when not).
// Real-auth: profile_id + baby_id + RLS take over once the rest of
// the app moves to auth.
import { getAdminClient, isSupabaseEnabled } from "@/lib/supabase/admin";

export type LetterHighlights = {
  longestSleepMinutes?: number;
  totalSleepHours?: number;
  feedsCount?: number;
  diapersCount?: number;
  milestoneHit?: string;
  moodWord?: "settled" | "steady" | "watchful" | "rough";
};

export type Letter = {
  id: string;
  babyName: string;
  weekStart: string; // ISO date YYYY-MM-DD
  weekEnd: string; // ISO date YYYY-MM-DD
  title: string;
  prose: string;
  closing: string;
  highlights: LetterHighlights;
  generatedAt: string;
};

type LetterRow = {
  id: string;
  demo_baby_name: string | null;
  week_start: string;
  week_end: string;
  prose: string;
  highlights: (LetterHighlights & { title?: string; closing?: string }) | null;
  generated_at: string;
};

function rowToLetter(row: LetterRow): Letter {
  const h = row.highlights ?? {};
  const { title, closing, ...rest } = h;
  return {
    id: row.id,
    babyName: row.demo_baby_name ?? "Baby",
    weekStart: row.week_start,
    weekEnd: row.week_end,
    title: title ?? "A week with you",
    prose: row.prose,
    closing: closing ?? "Pippa's thinking of you.",
    highlights: rest as LetterHighlights,
    generatedAt: row.generated_at,
  };
}

// In-memory fallback for SUPABASE_SERVICE_ROLE_KEY-less dev/demo.
type Store = Map<string, Letter>;
declare global {
  // eslint-disable-next-line no-var
  var __pippa_letter_store: Store | undefined;
}
const memStore: Store =
  globalThis.__pippa_letter_store ??
  (globalThis.__pippa_letter_store = new Map());

export async function upsertLetter(letter: Letter): Promise<Letter> {
  if (!isSupabaseEnabled()) {
    memStore.set(`${letter.babyName}__${letter.weekStart}`, letter);
    return letter;
  }
  const sb = getAdminClient()!;
  // We bundle title + closing into highlights so the table stays narrow.
  const highlightsRow = {
    ...letter.highlights,
    title: letter.title,
    closing: letter.closing,
  };

  // Upsert by (demo_baby_name, week_start) — the partial unique index
  // in the migration handles the conflict.
  const { error } = await sb.from("letters").upsert(
    {
      demo_baby_name: letter.babyName,
      week_start: letter.weekStart,
      week_end: letter.weekEnd,
      prose: letter.prose,
      highlights: highlightsRow,
    },
    { onConflict: "demo_baby_name,week_start", ignoreDuplicates: false },
  );
  if (error) {
    console.error("[letters.upsertLetter] supabase upsert failed", error);
    memStore.set(`${letter.babyName}__${letter.weekStart}`, letter);
    return letter;
  }
  return letter;
}

export async function listLetters(
  babyName: string,
  limit = 30,
): Promise<Letter[]> {
  if (!isSupabaseEnabled()) {
    return Array.from(memStore.values())
      .filter((l) => l.babyName === babyName)
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
      .slice(0, limit);
  }
  const sb = getAdminClient()!;
  const { data, error } = await sb
    .from("letters")
    .select(
      "id, demo_baby_name, week_start, week_end, prose, highlights, generated_at",
    )
    .eq("demo_baby_name", babyName)
    .order("week_start", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[letters.listLetters] supabase select failed", error);
    return [];
  }
  return ((data as unknown as LetterRow[]) ?? []).map(rowToLetter);
}

export async function getLetter(id: string): Promise<Letter | undefined> {
  if (!isSupabaseEnabled()) {
    return Array.from(memStore.values()).find((l) => l.id === id);
  }
  const sb = getAdminClient()!;
  const { data, error } = await sb
    .from("letters")
    .select(
      "id, demo_baby_name, week_start, week_end, prose, highlights, generated_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[letters.getLetter] supabase select failed", error);
    return undefined;
  }
  if (!data) return undefined;
  return rowToLetter(data as unknown as LetterRow);
}
