// PostHog event constants — spec Part 12.1.
// Wired to PostHog client + server in Phase 12.
export const EVENTS = {
  // Acquisition funnel
  PAGE_VIEWED: "page_viewed",
  LANDING_HERO_VIEWED: "landing_hero_viewed",
  LANDING_CTA_CLICKED: "landing_cta_clicked",
  SIGNIN_REQUESTED: "signin_requested",
  SIGNIN_COMPLETED: "signin_completed",

  // Onboarding funnel
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_AGE_COMPLETED: "onboarding_age_completed",
  ONBOARDING_NAME_COMPLETED: "onboarding_name_completed",
  ONBOARDING_FEEDING_COMPLETED: "onboarding_feeding_completed",
  ONBOARDING_CONCERNS_COMPLETED: "onboarding_concerns_completed",
  ONBOARDING_FINISHED: "onboarding_finished",

  // Core action
  SCAN_INITIATED: "scan_initiated",
  SCAN_PHOTO_CAPTURED: "scan_photo_captured",
  SCAN_AUDIO_RECORDED: "scan_audio_recorded",
  SCAN_SUBMITTED: "scan_submitted",
  SCAN_RESULT_RECEIVED: "scan_result_received",
  SCAN_FAILED: "scan_failed",
  SAFETY_OVERRIDE_TRIGGERED: "safety_override_triggered",

  // Paywall
  PAYWALL_VIEWED: "paywall_viewed",
  PAYWALL_PLAN_SELECTED: "paywall_plan_selected",
  PAYWALL_CHECKOUT_STARTED: "paywall_checkout_started",
  PAYWALL_CHECKOUT_COMPLETED: "paywall_checkout_completed",
  PAYWALL_DISMISSED: "paywall_dismissed",

  // Retention
  HISTORY_VIEWED: "history_viewed",
  CHAT_OPENED: "chat_opened",
  CHAT_MESSAGE_SENT: "chat_message_sent",
  PWA_INSTALL_PROMPTED: "pwa_install_prompted",
  PWA_INSTALLED: "pwa_installed",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
