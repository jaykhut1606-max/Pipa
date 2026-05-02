import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented", phase: "Phase 4" },
    { status: 501 }
  );
}
