// Rash check API. Vision call against gpt-4o using the standard
// image_url content block (data URL with the photo bytes), then
// applyRashSafetyOverrides hardcodes the fever-under-12-weeks rule
// regardless of what the model says.
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { openai } from "@/lib/openai/client";
import { RASH_ANALYZER_SYSTEM_PROMPT } from "@/lib/openai/prompts/rash";
import { applyRashSafetyOverrides } from "@/lib/openai/safety";
import { saveDemoScan } from "@/lib/scan-store";
import type {
  RashScanResult,
  ResultBadgeStatus,
  ScanStatus,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

type ModelRashResult = RashScanResult & {
  possibleConditions?: { name: string; confidence: number; description: string }[];
  severity?: "MILD" | "MODERATE" | "SEEK_CARE";
  homeCare?: string[];
  escalation?: { reason: string; whatToTell: string } | null;
  confidence?: number;
};

function statusFromRash(result: ModelRashResult): ScanStatus {
  if (result._safetyOverride) return "urgent";
  switch (result.severity) {
    case "MILD":
      return "healthy";
    case "MODERATE":
      return "monitor";
    case "SEEK_CARE":
      return "urgent";
    default:
      return "monitor";
  }
}

function badgeFromRash(status: ScanStatus): ResultBadgeStatus {
  return status === "unclear" ? "unclear" : status;
}

function primaryLabelFromRash(result: ModelRashResult, status: ScanStatus): string {
  const top = result.possibleConditions?.[0]?.name?.trim();
  if (top) return top;
  if (status === "urgent") return "Worth a pediatrician visit";
  if (status === "monitor") return "Keep an eye on it";
  return "Looks like home care";
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const photo = form.get("photo");
  if (!(photo instanceof Blob) || photo.size === 0) {
    return NextResponse.json({ error: "Missing photo" }, { status: 400 });
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return NextResponse.json(
      { error: "Photo's a bit large. Try one under 8MB." },
      { status: 413 }
    );
  }

  const bodyLocation =
    (form.get("bodyLocation") as string | null)?.trim() || "unspecified";
  const durationLabel =
    (form.get("durationLabel") as string | null)?.trim() || "unknown";
  const feverRaw = (form.get("fever") as string | null)?.trim() || "unsure";
  const fever: "yes" | "no" | "unsure" =
    feverRaw === "yes" || feverRaw === "no" ? feverRaw : "unsure";

  const babyName = (form.get("babyName") as string | null)?.trim() || "Baby";
  const ageWeeksRaw = Number(form.get("babyAgeWeeks"));
  const babyAgeWeeks =
    Number.isFinite(ageWeeksRaw) && ageWeeksRaw >= 0 ? ageWeeksRaw : 4;

  let dataUrl: string;
  try {
    const buf = Buffer.from(await photo.arrayBuffer());
    const mime = photo.type && photo.type.length > 0 ? photo.type : "image/jpeg";
    dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return NextResponse.json(
      { error: "Could not read photo" },
      { status: 400 }
    );
  }

  const userText = `Baby ${babyName}, age ${babyAgeWeeks} weeks. Body location: ${bodyLocation}. Duration: ${durationLabel}. Fever: ${fever}.`;

  let parsed: ModelRashResult;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: RASH_ANALYZER_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    parsed = JSON.parse(content) as ModelRashResult;
  } catch (err) {
    console.error("Rash analyzer error:", err);
    return NextResponse.json(
      { error: "We couldn't read the photo just now. Try again in a moment." },
      { status: 502 }
    );
  }

  const safe = applyRashSafetyOverrides(
    parsed,
    babyAgeWeeks,
    fever === "yes"
  ) as ModelRashResult;

  const status = statusFromRash(safe);
  const badge = badgeFromRash(status);
  const primaryLabel = primaryLabelFromRash(safe, status);
  const id = randomUUID();

  saveDemoScan({
    id,
    scanType: "rash",
    status,
    primaryLabel,
    babyName,
    babyAgeWeeks,
    result: { ...safe, _badgeStatus: badge },
    safetyOverride: safe._safetyOverride,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ scanId: id });
}
