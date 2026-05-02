// Cry analyzer API. Takes a small audio Blob (FormData) + baby context, sends
// it through gpt-4o-audio-preview, and returns a saved DemoScan id so the
// caller can redirect to /result/[scanId]. Audio is never persisted.
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { openai } from "@/lib/openai/client";
import { CRY_ANALYZER_SYSTEM_PROMPT } from "@/lib/openai/prompts/cry";
import { saveScan } from "@/lib/data/scans";
import type { ResultBadgeStatus, ScanStatus } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

type CryReason = {
  label?: string;
  confidence?: number;
  explanation?: string;
  suggestion?: string;
};

type CryResult = {
  primaryReason?: CryReason;
  secondaryReasons?: CryReason[];
  concernFlag?: { raised?: boolean; reason?: string | null; action?: string };
  audioNotes?: string;
};

const HEALTHY_LABELS = new Set([
  "tired",
  "hungry",
  "discomfort",
  "wind_gas",
  "needs_change",
  "wants_contact",
  "overstimulated",
]);

function statusFromCry(result: CryResult): ScanStatus {
  const label = result.primaryReason?.label ?? "unclear";
  const confidence = Number(result.primaryReason?.confidence ?? 0);

  if (result.concernFlag?.raised) return "urgent";
  if (label === "pain") return "urgent";
  if (label === "unclear" || label === "overstimulated") return "unclear";

  if (HEALTHY_LABELS.has(label)) {
    return confidence >= 0.7 ? "healthy" : "monitor";
  }
  return "unclear";
}

function badgeFromCry(result: CryResult): ResultBadgeStatus {
  const label = result.primaryReason?.label ?? "unclear";
  switch (label) {
    case "tired":
      return "tired";
    case "hungry":
      return "hungry";
    case "discomfort":
    case "wind_gas":
    case "needs_change":
      return "discomfort";
    case "pain":
      return "urgent";
    case "unclear":
    case "overstimulated":
    case "wants_contact":
    default:
      return "unclear";
  }
}

function humanLabel(result: CryResult): string {
  const raw = result.primaryReason?.label ?? "unclear";
  const map: Record<string, string> = {
    hungry: "Likely hungry",
    tired: "Likely tired",
    discomfort: "Some discomfort",
    wind_gas: "Wind or gas",
    overstimulated: "Overstimulated",
    needs_change: "Time for a change",
    wants_contact: "Wants to be held",
    pain: "Sounds painful",
    unclear: "Not sure yet",
  };
  return map[raw] ?? "Not sure yet";
}

// We can only ship "wav" or "mp3" to the model. Browsers usually hand us
// webm/opus from MediaRecorder; OpenAI rejects that. So we tell the model
// it's "wav" and base64 the bytes — gpt-4o-audio-preview handles the
// container sniffing in practice. If the user clearly handed us an mp3,
// we honour that.
function pickAudioFormat(mime: string | null | undefined): "wav" | "mp3" {
  if (!mime) return "wav";
  const lower = mime.toLowerCase();
  if (lower.includes("mp3") || lower.includes("mpeg")) return "mp3";
  return "wav";
}

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

  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "Missing audio" }, { status: 400 });
  }

  const babyName = (form.get("babyName") as string | null)?.trim() || "Baby";
  const ageWeeksRaw = Number(form.get("babyAgeWeeks"));
  const babyAgeWeeks =
    Number.isFinite(ageWeeksRaw) && ageWeeksRaw >= 0 ? ageWeeksRaw : 4;
  const feedingType =
    (form.get("feedingType") as string | null)?.trim() || "breast";

  const minutesSinceFeed =
    (form.get("minutesSinceFeed") as string | null)?.trim() || "unknown";
  const minutesSinceSleep =
    (form.get("minutesSinceSleep") as string | null)?.trim() || "unknown";

  let base64Audio: string;
  try {
    const buf = Buffer.from(await audio.arrayBuffer());
    base64Audio = buf.toString("base64");
  } catch {
    return NextResponse.json(
      { error: "Could not read audio" },
      { status: 400 }
    );
  }

  const format = pickAudioFormat(audio.type);

  const userText = `Baby ${babyName}, age ${babyAgeWeeks} weeks. Feeding type: ${feedingType}. Last fed ${minutesSinceFeed} min ago. Last slept ${minutesSinceSleep} min ago.`;

  let parsed: CryResult;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-audio-preview",
      modalities: ["text"],
      messages: [
        { role: "system", content: CRY_ANALYZER_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            {
              type: "input_audio",
              input_audio: { data: base64Audio, format },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    parsed = JSON.parse(content) as CryResult;
  } catch (err) {
    console.error("Cry analyzer error:", err);
    return NextResponse.json(
      { error: "We couldn't read the cry just now. Try again in a moment." },
      { status: 502 }
    );
  }

  const status: ScanStatus = statusFromCry(parsed);
  const badgeStatus: ResultBadgeStatus = badgeFromCry(parsed);
  const primaryLabel = humanLabel(parsed);
  const id = randomUUID();

  await saveScan({
    id,
    scanType: "cry",
    status,
    primaryLabel,
    babyName,
    babyAgeWeeks,
    result: { ...parsed, _badgeStatus: badgeStatus },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ scanId: id });
}
