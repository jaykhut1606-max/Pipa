// Voice Entry API. Takes a short audio Blob (FormData), runs Whisper for the
// transcription, then asks gpt-4o-mini to extract a structured TrackerEvent
// (sleep / diaper / feed / note). Saves through lib/event-store.ts so the
// /trackers timeline immediately reflects the new event.
//
// Audio is never persisted — we only keep the transcription text.
import { NextResponse } from "next/server";
import { z } from "zod";
import { toFile } from "openai";
import { saveEvent } from "@/lib/data/events";
import type { TrackerEvent } from "@/lib/types";
import { openai } from "@/lib/openai/client";

export const runtime = "nodejs";
export const maxDuration = 30;

// --- Schema (mirrors app/api/tracker/event/route.ts payload shapes) ---------

const SLEEP_DATA = z.object({
  endedAt: z.string().datetime().optional(),
  location: z
    .enum(["crib", "bassinet", "stroller", "contact", "car", "other"])
    .optional(),
  quality: z.enum(["settled", "restless", "broken"]).optional(),
  notes: z.string().max(500).optional(),
});

const DIAPER_DATA = z.object({
  kind: z.enum(["wet", "dirty", "mixed"]),
  consistency: z
    .enum(["watery", "loose", "soft", "formed", "hard", "pellets"])
    .optional(),
  color: z.string().max(60).optional(),
  notes: z.string().max(500).optional(),
});

const FEED_DATA = z.object({
  method: z.enum(["breast", "bottle", "solids"]),
  breastSide: z.enum(["left", "right", "both"]).optional(),
  breastLeftMinutes: z.number().int().min(0).max(120).optional(),
  breastRightMinutes: z.number().int().min(0).max(120).optional(),
  bottleMl: z.number().int().min(0).max(500).optional(),
  bottleContents: z.enum(["breast_milk", "formula", "mixed"]).optional(),
  solidsItems: z.array(z.string().max(60)).max(20).optional(),
  notes: z.string().max(500).optional(),
});

const NOTE_DATA = z.object({
  text: z.string().min(1).max(1000),
  mood: z.enum(["good", "okay", "rough"]).optional(),
});

const SLEEP = z.object({ type: z.literal("sleep"), data: SLEEP_DATA });
const DIAPER = z.object({ type: z.literal("diaper"), data: DIAPER_DATA });
const FEED = z.object({ type: z.literal("feed"), data: FEED_DATA });
const NOTE = z.object({ type: z.literal("note"), data: NOTE_DATA });

// What we ask the model to produce (a payload-ish object, plus extras).
const MODEL_OUTPUT = z.object({
  type: z.enum(["sleep", "diaper", "feed", "note"]),
  // We re-discriminate after the model picks `type`; until then it's loose.
  data: z.record(z.string(), z.unknown()),
  occurredOffsetMin: z.number().int().min(0).max(720).default(0),
  durationMinutes: z.number().int().min(0).max(1440).optional(),
  confidence: z.number().min(0).max(1).default(0.5),
  summary: z.string().min(1).max(160),
});

const PAYLOAD = z.discriminatedUnion("type", [SLEEP, DIAPER, FEED, NOTE]);

// --- Prompts ----------------------------------------------------------------

const SYSTEM_PROMPT = `You parse short voice notes from sleep-deprived parents into one TrackerEvent. The transcription may be terse, contain typos, or use approximate times. Output strict JSON. If unsure of the type, output {"type":"note","data":{"text":"<verbatim>"}}.

Map relative times like "just now", "right now" to occurredOffsetMin=0. "30 minutes ago" → 30. "an hour ago" → 60. "earlier this morning" → 120. The API will compute absolute occurredAt.
Map durations: "an hour and a half" → durationMinutes=90. "20 minutes" → 20. "two hours" → 120.

Strict output shape:
{
  "type": "sleep" | "diaper" | "feed" | "note",
  "data": { ... }, // payload data fields ONLY for that type
  "occurredOffsetMin": number, // minutes ago, default 0
  "durationMinutes": number?, // sleep duration / breast minutes — omit if unknown
  "confidence": number, // 0..1
  "summary": "human-readable one-liner like 'Slept 1h 30m'"
}

Type-specific data fields (use ONLY these keys):
- sleep:  { location?: "crib"|"bassinet"|"stroller"|"contact"|"car"|"other", quality?: "settled"|"restless"|"broken", notes?: string }
- diaper: { kind: "wet"|"dirty"|"mixed", consistency?: "watery"|"loose"|"soft"|"formed"|"hard"|"pellets", color?: string, notes?: string }
- feed:   { method: "breast"|"bottle"|"solids", breastSide?: "left"|"right"|"both", breastLeftMinutes?: number, breastRightMinutes?: number, bottleMl?: number, bottleContents?: "breast_milk"|"formula"|"mixed", solidsItems?: string[], notes?: string }
- note:   { text: string, mood?: "good"|"okay"|"rough" }

Examples:
"She slept for an hour and a half just now"
=> {"type":"sleep","data":{"quality":"settled"},"occurredOffsetMin":90,"durationMinutes":90,"confidence":0.9,"summary":"Slept 1h 30m"}

"Wet diaper, like 30 minutes ago"
=> {"type":"diaper","data":{"kind":"wet"},"occurredOffsetMin":30,"confidence":0.95,"summary":"Wet diaper"}

"Just nursed her on the left for 12 minutes"
=> {"type":"feed","data":{"method":"breast","breastSide":"left","breastLeftMinutes":12},"occurredOffsetMin":12,"durationMinutes":12,"confidence":0.9,"summary":"Breast feed (left, 12m)"}

"4oz bottle of formula about an hour ago"
=> {"type":"feed","data":{"method":"bottle","bottleMl":120,"bottleContents":"formula"},"occurredOffsetMin":60,"confidence":0.85,"summary":"Bottle 120ml (formula)"}

"He's been a little fussy this afternoon"
=> {"type":"note","data":{"text":"He's been a little fussy this afternoon","mood":"rough"},"occurredOffsetMin":0,"confidence":0.6,"summary":"Note: fussy this afternoon"}

If the audio is silent or unintelligible, still return a note with text="(unclear)" and confidence 0.1.`;

// --- Helpers ----------------------------------------------------------------

function uuid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `evt_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function ozToMl(text: string): number | null {
  const m = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:oz|ounce)/i);
  if (!m) return null;
  const oz = Number.parseFloat(m[1]);
  if (!Number.isFinite(oz)) return null;
  return Math.round(oz * 30); // 1 oz ≈ 30 ml.
}

// Pick a sensible filename extension Whisper accepts based on the Blob mime.
function whisperFilename(mime: string | null | undefined): string {
  const lower = (mime ?? "").toLowerCase();
  if (lower.includes("wav")) return "voice.wav";
  if (lower.includes("mp3") || lower.includes("mpeg")) return "voice.mp3";
  if (lower.includes("mp4") || lower.includes("m4a")) return "voice.m4a";
  if (lower.includes("ogg")) return "voice.ogg";
  // MediaRecorder default on Chromium/Firefox.
  return "voice.webm";
}

// --- Route handler ----------------------------------------------------------

export async function POST(request: Request) {
  // 1) Parse multipart form.
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
  // Reject obvious garbage early. Whisper will choke on >60s anyway.
  if (audio.size > 6 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Audio too large; please keep it under 60 seconds" },
      { status: 413 }
    );
  }

  const babyName = (form.get("babyName") as string | null)?.trim() || "Baby";
  const ageWeeksRaw = Number(form.get("babyAgeWeeks"));
  const babyAgeWeeks =
    Number.isFinite(ageWeeksRaw) && ageWeeksRaw >= 0 ? ageWeeksRaw : undefined;

  // 2) Whisper transcription. We have to wrap the Blob in a File-shaped
  // upload so the SDK can attach a filename + content-type for the multipart
  // upstream request — Whisper rejects bare Blobs without an extension.
  let transcription: string;
  try {
    const buf = Buffer.from(await audio.arrayBuffer());
    const file = await toFile(buf, whisperFilename(audio.type), {
      type: audio.type || "audio/webm",
    });
    const result = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "en",
      response_format: "json",
    });
    transcription = (result as { text?: string }).text?.trim() ?? "";
  } catch (err) {
    console.error("Whisper transcription error:", err);
    return NextResponse.json(
      { error: "We couldn't transcribe that. Try again in a moment." },
      { status: 502 }
    );
  }

  if (!transcription) {
    return NextResponse.json(
      {
        error:
          "We didn't catch any words. Try recording a little longer or somewhere quieter.",
      },
      { status: 422 }
    );
  }

  // 3) GPT extraction.
  const userContext = babyAgeWeeks
    ? `Baby name: ${babyName}. Age: ${babyAgeWeeks} weeks.\nTranscription: ${transcription}`
    : `Baby name: ${babyName}.\nTranscription: ${transcription}`;

  let raw: unknown;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContext },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
    const content = completion.choices[0]?.message?.content ?? "{}";
    raw = JSON.parse(content);
  } catch (err) {
    console.error("Voice extraction error:", err);
    return NextResponse.json(
      {
        error: "We heard you, but couldn't read the signal. Try again.",
        transcription,
      },
      { status: 502 }
    );
  }

  // 4) Validate model output shape.
  const modelParsed = MODEL_OUTPUT.safeParse(raw);
  if (!modelParsed.success) {
    console.error(
      "Voice model output failed schema:",
      modelParsed.error.format(),
      raw
    );
    // Graceful fallback: drop the whole thing into a note so the parent
    // doesn't lose what they said.
    const fallback = await persistNoteFallback(babyName, transcription);
    return NextResponse.json({
      event: fallback,
      transcription,
      summary: `Note: ${transcription.slice(0, 80)}`,
      confidence: 0.2,
    });
  }
  const m = modelParsed.data;

  // 5) Re-validate the discriminated payload before saving.
  const payloadCandidate = { type: m.type, data: m.data };
  let payloadParsed = PAYLOAD.safeParse(payloadCandidate);

  // Tolerant fixups for common ounce-mentions or oddly-typed minute fields.
  if (!payloadParsed.success && m.type === "feed") {
    const data = { ...(m.data as Record<string, unknown>) };
    // Coerce numeric strings the model sometimes emits.
    for (const k of [
      "breastLeftMinutes",
      "breastRightMinutes",
      "bottleMl",
    ] as const) {
      if (typeof data[k] === "string") {
        const n = Number.parseFloat(data[k] as string);
        if (Number.isFinite(n)) data[k] = Math.round(n);
      }
    }
    // If the model said e.g. "4 oz" in the transcription but didn't convert.
    if (
      data.method === "bottle" &&
      typeof data.bottleMl !== "number"
    ) {
      const ml = ozToMl(transcription);
      if (ml != null) data.bottleMl = ml;
    }
    payloadParsed = PAYLOAD.safeParse({ type: "feed", data });
  }

  if (!payloadParsed.success) {
    console.error(
      "Voice payload schema mismatch:",
      payloadParsed.error.format(),
      payloadCandidate
    );
    const fallback = await persistNoteFallback(babyName, transcription);
    return NextResponse.json({
      event: fallback,
      transcription,
      summary: `Note: ${transcription.slice(0, 80)}`,
      confidence: 0.2,
    });
  }
  const payload = payloadParsed.data;

  // 6) Compute occurredAt, optional durationMinutes, save.
  const offsetMin = Math.max(0, m.occurredOffsetMin ?? 0);
  const occurredAt = new Date(Date.now() - offsetMin * 60_000).toISOString();
  const durationMinutes =
    typeof m.durationMinutes === "number" && m.durationMinutes >= 0
      ? Math.round(m.durationMinutes)
      : undefined;

  const event: TrackerEvent = {
    id: uuid(),
    babyName,
    eventType: payload.type,
    payload,
    occurredAt,
    durationMinutes,
    createdAt: new Date().toISOString(),
  };
  await saveEvent(event);

  return NextResponse.json({
    event,
    transcription,
    summary: m.summary,
    confidence: m.confidence,
  });
}

async function persistNoteFallback(
  babyName: string,
  transcription: string
): Promise<TrackerEvent> {
  const now = new Date().toISOString();
  const event: TrackerEvent = {
    id: uuid(),
    babyName,
    eventType: "note",
    payload: { type: "note", data: { text: transcription.slice(0, 1000) } },
    occurredAt: now,
    createdAt: now,
  };
  await saveEvent(event);
  return event;
}
