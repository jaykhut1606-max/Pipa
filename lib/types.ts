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
