export type RetailPartnerChannel = "local_store" | "online" | "both";

export type RetailPartnerSubscriptionStatus =
  | "active"
  | "inactive"
  | "trial"
  | "expired";

export type RetailPartnerAvailabilityStatus =
  | "in_stock"
  | "order_available"
  | "unknown";

export type RetailPartnerReferralDestination =
  | "product"
  | "website"
  | "phone";

export type RetailPartnerReferralMetrics = {
  total30d: number;
  product30d: number;
  website30d: number;
  phone30d: number;
  lastReferralAt: string | null;
};

export type RetailPartnerListing = {
  id: string;
  partnerId: string;
  foodProductId: string;
  channel: RetailPartnerChannel;
  availabilityStatus: RetailPartnerAvailabilityStatus;
  productUrl: string | null;
  estimatedPriceEuro: number | null;
  isActive: boolean;
  isSponsored: boolean;
  displayPriority: number;
  lastVerifiedAt: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  food: {
    id: string;
    brand: string;
    displayName: string;
    species: string;
    format: string;
  } | null;
};

export type RetailPartner = {
  id: string;
  name: string;
  legalName: string | null;
  channel: RetailPartnerChannel;
  city: string | null;
  area: string | null;
  postalCode: string | null;
  address: string | null;
  websiteUrl: string | null;
  phone: string | null;
  contactEmail: string | null;
  subscriptionStatus: RetailPartnerSubscriptionStatus;
  subscriptionStartedAt: string | null;
  subscriptionExpiresAt: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  referralMetrics: RetailPartnerReferralMetrics;
  listings: RetailPartnerListing[];
};

export type RetailPartnerFoodSearchResult = {
  id: string;
  brand: string;
  displayName: string;
  species: string;
  format: string;
  isRecommendable: boolean;
};
