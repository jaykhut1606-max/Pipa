// Demo baby upsert — onboarding's writeProfile stores name/birthDate/etc
// in localStorage; this endpoint mirrors them into public.babies so the
// DB has the canonical record.
//
// On first call (no babyId in body) we INSERT and return the new id; the
// client stashes that id in localStorage so future updates target the
// same row. With no Supabase configured (`!isSupabaseEnabled`), we
// degrade to a no-op so onboarding still completes locally.
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient, isSupabaseEnabled } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const FEEDING = z.array(
  z.enum(["breast", "formula", "mixed", "solids"]),
);

const Body = z.object({
  babyId: z.string().uuid().optional(),
  name: z.string().min(1).max(60),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
    .optional(),
  feedingType: FEEDING.optional(),
  concerns: z.array(z.string().max(40)).max(10).optional(),
});

export async function POST(request: Request) {
  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid body", details: String(err) },
      { status: 400 },
    );
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      reason: "supabase not configured",
    });
  }

  const sb = getAdminClient()!;
  const row = {
    name: parsed.name,
    birth_date: parsed.birthDate ?? null,
    feeding_type: parsed.feedingType ?? null,
    concerns: parsed.concerns ?? null,
  } as const;

  if (parsed.babyId) {
    const { error } = await sb
      .from("babies")
      .update(row)
      .eq("id", parsed.babyId);
    if (error) {
      console.error("[demo/baby] update failed", error);
      return NextResponse.json(
        { ok: false, persisted: false, error: error.message },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, persisted: true, babyId: parsed.babyId });
  }

  const { data, error } = await sb
    .from("babies")
    .insert(row)
    .select("id")
    .single();
  if (error) {
    console.error("[demo/baby] insert failed", error);
    return NextResponse.json(
      { ok: false, persisted: false, error: error.message },
      { status: 502 },
    );
  }
  return NextResponse.json({
    ok: true,
    persisted: true,
    babyId: (data as { id: string }).id,
  });
}
