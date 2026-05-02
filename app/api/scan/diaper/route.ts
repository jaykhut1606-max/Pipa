// Diaper scan analysis. Spec Part 6.2.
// Receives a multipart photo + baby context, calls GPT-4o vision, runs the
// hardcoded safety overrides (pale-stool / blood = always escalate), and
// stashes the result in the in-memory demo store keyed by a fresh UUID.
// The page polls/redirects to /result/<scanId>.
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai/client";
import { DIAPER_SCAN_SYSTEM_PROMPT } from "@/lib/openai/prompts/diaper";
import { applyDiaperSafetyOverrides } from "@/lib/openai/safety";
import { saveDemoScan } from "@/lib/scan-store";
import type { DiaperScanResult, ScanStatus } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024;

function statusFromAssessment(
  raw: DiaperScanResult["assessment"]["status"]
): ScanStatus {
  switch (raw) {
    case "NORMAL":
      return "healthy";
    case "MONITOR":
      return "monitor";
    case "CALL_PEDIATRICIAN":
      return "urgent";
    default:
      return "unclear";
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const photo = formData.get("photo");
    const babyName = String(formData.get("babyName") ?? "Baby").trim() || "Baby";
    const ageWeeksRaw = formData.get("babyAgeWeeks");
    const babyAgeWeeks = Number.parseInt(String(ageWeeksRaw ?? "0"), 10) || 0;
    const feedingRaw = String(formData.get("feedingType") ?? "breast");
    const feeding = feedingRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!(photo instanceof File)) {
      return NextResponse.json(
        { error: "Photo is missing." },
        { status: 400 }
      );
    }
    if (!photo.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "That file isn't an image." },
        { status: 400 }
      );
    }
    if (photo.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Photo is too large. Try one under 8MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await photo.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = photo.type;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: DIAPER_SCAN_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Baby ${babyName}, age ${babyAgeWeeks} weeks. Feeding: ${
                feeding.join(", ") || "breast"
              }. Please analyze.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty model response");
    }

    const raw = JSON.parse(content) as DiaperScanResult;
    const final = applyDiaperSafetyOverrides(raw, babyAgeWeeks);
    const status = statusFromAssessment(final.assessment.status);

    const scanId = crypto.randomUUID();
    saveDemoScan({
      id: scanId,
      scanType: "diaper",
      status,
      primaryLabel: final.visualAnalysis?.colorName ?? "—",
      babyName,
      babyAgeWeeks,
      result: final,
      safetyOverride: final._safetyOverride,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ scanId });
  } catch (error) {
    console.error("[scan/diaper] failed", error);
    return NextResponse.json(
      { error: "Something went wrong analyzing the photo. Please try again." },
      { status: 500 }
    );
  }
}
