import { NextResponse } from "next/server";

// Magic-link consumption — Phase 1 will exchange the `code` query param
// for a session via `supabase.auth.exchangeCodeForSession`, then redirect
// to /welcome (or /onboarding/age if profile.onboarded_at is null).
export async function GET() {
  return NextResponse.json(
    { error: "Not implemented", phase: "Phase 1" },
    { status: 501 }
  );
}
