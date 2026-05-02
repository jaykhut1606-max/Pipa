import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented", phase: "Phase 5" },
    { status: 501 }
  );
}
