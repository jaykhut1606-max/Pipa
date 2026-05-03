// Demo reset — wipes all demo events + scans so a fresh user starts clean.
// Called from the onboarding "Finish" handler the first time a user
// completes onboarding (i.e. when no prior `onboardedAt` is set).
//
// Demo mode only: deletions are scoped to rows with demo_baby_name set,
// so when real auth lands this is a no-op for production data.
import { NextResponse } from "next/server";
import { clearEvents } from "@/lib/data/events";
import { clearScans } from "@/lib/data/scans";

export const runtime = "nodejs";

export async function POST() {
  await Promise.all([clearEvents(), clearScans()]);
  return NextResponse.json({ ok: true });
}
