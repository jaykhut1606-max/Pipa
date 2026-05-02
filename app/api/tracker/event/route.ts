import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented", phase: "Phase 6" },
    { status: 501 }
  );
}
