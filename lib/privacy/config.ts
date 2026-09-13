export const PRIVACY_POLICY_VERSION = "2026-08-17";
export const PRIVACY_POLICY_LAST_UPDATED_EL = "17 Αυγούστου 2026";

export const PRIVACY_RETENTION = {
  accountData: "Μέχρι να διαγραφεί ο λογαριασμός",
  petData: "Μέχρι να διαγραφεί το κατοικίδιο ή ο λογαριασμός",
  runtimeMonitoringDays: 90,
  chatbotFeedbackDays: 365,
  partnerReferralDays: 365,
  consentHistory: "Μέχρι να διαγραφεί ο λογαριασμός",
} as const;

export const PRIVACY_DEFAULTS = {
  productAnalyticsEnabled: false,
  partnerOffersEnabled: false,
} as const;
