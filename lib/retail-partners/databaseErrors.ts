type DatabaseErrorLike = {
  code?: string | null;
  message?: string | null;
};

export function isMissingRetailPartnerSchemaError(
  error: unknown
) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as DatabaseErrorLike;
  const message = String(candidate.message ?? "").toLowerCase();
  return (
    candidate.code === "42P01" ||
    candidate.code === "PGRST205" ||
    (message.includes("retail_partners") &&
      (message.includes("does not exist") || message.includes("schema cache"))) ||
    (message.includes("retail_partner_product_availability") &&
      (message.includes("does not exist") || message.includes("schema cache"))) ||
    (message.includes("retail_partner_referral") &&
      (message.includes("does not exist") || message.includes("schema cache")))
  );
}
