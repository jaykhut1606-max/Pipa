// Cross-cutting types shared by API routes, UI components, and the DB layer.
// Filled out per phase. Spec Part 6 has the result schemas for each scan type.

export type ScanType = "diaper" | "cry" | "rash";

export type ScanStatus = "healthy" | "monitor" | "urgent" | "unclear";

export type ResultBadgeStatus =
  | "healthy"
  | "monitor"
  | "urgent"
  | "tired"
  | "hungry"
  | "discomfort"
  | "unclear";

export type FeedingType = "breast" | "formula" | "mixed" | "solids";

export type Concern =
  | "sleep"
  | "crying"
  | "feeding"
  | "poop"
  | "health"
  | "development"
  | "coordinating";

export type SubscriptionTier = "weekly" | "yearly" | "lifetime";

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "lifetime";

// Phase 4 will fill these in to match spec Part 6 response schemas.
export type DiaperScanResult = {
  visualAnalysis: {
    primaryColor: string;
    colorName: string;
    consistency:
      | "watery"
      | "loose"
      | "soft"
      | "formed"
      | "hard"
      | "pellets";
    bristolType: number;
    notableFeatures: string[];
  };
  assessment: {
    status: "NORMAL" | "MONITOR" | "CALL_PEDIATRICIAN";
    explanation: string;
    contextualNote: string;
  };
  recommendation: {
    primary: string;
    medicalEscalation: {
      reason: string;
      urgency: "today" | "this_week" | "next_visit";
    } | null;
  };
  confidence: number;
  _safetyOverride?: string;
};

// Phase 5 fills out RashScanResult + CryAnalyzerResult.
export type RashScanResult = {
  triage: {
    recommendation: "HOME_CARE" | "MONITOR" | "URGENT_CARE";
    reasoning: string;
    urgencyLabel: string;
  };
  // …
  _safetyOverride?: string;
};

// Tracker module — sleep / diaper / feed logging and aggregates.
// The `events` row in the spec DB has columns id/baby_id/profile_id/event_type/
// payload(jsonb)/occurred_at/duration_minutes/created_at. Demo mode keeps the
// same shape in lib/event-store.ts so a real-DB swap is mechanical.

export type TrackerEventType = "sleep" | "diaper" | "feed" | "note";

export type SleepPayload = {
  endedAt?: string; // ISO timestamp; if absent the sleep is in progress
  location?: "crib" | "bassinet" | "stroller" | "contact" | "car" | "other";
  quality?: "settled" | "restless" | "broken";
  notes?: string;
};

export type DiaperPayload = {
  kind: "wet" | "dirty" | "mixed";
  // For dirty/mixed only:
  consistency?: "watery" | "loose" | "soft" | "formed" | "hard" | "pellets";
  color?: string; // common name (e.g. "mustard yellow")
  notes?: string;
};

export type FeedPayload = {
  method: "breast" | "bottle" | "solids";
  // For breast: side(s) used and per-side durations in minutes.
  breastSide?: "left" | "right" | "both";
  breastLeftMinutes?: number;
  breastRightMinutes?: number;
  // For bottle:
  bottleMl?: number;
  bottleContents?: "breast_milk" | "formula" | "mixed";
  // For solids:
  solidsItems?: string[];
  notes?: string;
};

export type NotePayload = {
  text: string;
  mood?: "good" | "okay" | "rough";
};

export type TrackerEventPayload =
  | { type: "sleep"; data: SleepPayload }
  | { type: "diaper"; data: DiaperPayload }
  | { type: "feed"; data: FeedPayload }
  | { type: "note"; data: NotePayload };

export type TrackerEvent = {
  id: string;
  babyName: string; // demo: from localStorage; prod: babies.id reference
  eventType: TrackerEventType;
  payload: TrackerEventPayload;
  occurredAt: string; // ISO datetime
  durationMinutes?: number;
  createdAt: string;
};

// Insights API contract — stable shape consumed by the charts page.
// Each metric is keyed by a granularity bucket (yyyy-mm-dd for day, ISO week
// for week, yyyy-mm for month).
export type InsightGranularity = "day" | "week" | "month";

export type InsightSeries = {
  label: string;
  // Buckets in ascending chronological order. Keys are bucket ids; values are
  // the metric for that bucket.
  buckets: { key: string; value: number; secondary?: number }[];
  unit?: string;
};

export type InsightInterpretation = {
  // 1–3 short, friendly bullets explaining what the data is saying.
  // Always written in Pippa's voice: warm, never alarmist, specific.
  bullets: string[];
  // Optional comparison-to-norm note — "Within typical range for 6-week-old
  // breastfed babies" or similar.
  benchmark?: string;
};

export type InsightCard = {
  id: string;
  title: string; // e.g. "Total sleep"
  metric: string; // headline number e.g. "13h 20m"
  delta?: { direction: "up" | "down" | "flat"; label: string }; // "+1h vs last week"
  series?: InsightSeries;
  interpretation?: InsightInterpretation;
};

export type InsightsResponse = {
  granularity: InsightGranularity;
  rangeStart: string; // ISO
  rangeEnd: string;
  cards: InsightCard[];
  // Optional cross-domain narrative — e.g. "Sleep dipped this week and feeds
  // shortened by ~10%. Could be a growth spurt."
  narrative?: string;
};

