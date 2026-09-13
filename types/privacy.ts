export type CustomerPrivacyPreferences = {
  policyVersion: string;
  productAnalyticsEnabled: boolean;
  partnerOffersEnabled: boolean;
  updatedAt: string | null;
};

export type CustomerConsentEvent = {
  id: string;
  category: "product_analytics" | "partner_offers";
  granted: boolean;
  policyVersion: string;
  source: string;
  createdAt: string;
};
