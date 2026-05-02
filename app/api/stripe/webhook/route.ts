import { NextResponse } from "next/server";

// Stripe webhooks read the raw body — when this is implemented we'll use
// `await req.text()` plus stripe.webhooks.constructEvent for signature
// verification per spec Part 8.3.
export async function POST() {
  return NextResponse.json(
    { error: "Not implemented", phase: "Phase 8" },
    { status: 501 }
  );
}
