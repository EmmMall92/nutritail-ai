function publicFlag(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes(
    String(value ?? "").trim().toLowerCase()
  );
}

/**
 * Commercial surfaces stay off by default for the simple public launch.
 * Each feature can be restored independently through Vercel environment variables.
 */
export const launchFeatures = Object.freeze({
  betaWaitlist: publicFlag(process.env.NEXT_PUBLIC_ENABLE_BETA_WAITLIST),
  paidPlans: publicFlag(process.env.NEXT_PUBLIC_ENABLE_PAID_PLANS),
  professionalSignup: publicFlag(
    process.env.NEXT_PUBLIC_ENABLE_PROFESSIONAL_SIGNUP
  ),
  foodPhotoAnalysis: publicFlag(
    process.env.NEXT_PUBLIC_ENABLE_FOOD_PHOTO_ANALYSIS
  ),
  partnerStores: publicFlag(
    process.env.NEXT_PUBLIC_ENABLE_PARTNER_STORES
  ),
});
