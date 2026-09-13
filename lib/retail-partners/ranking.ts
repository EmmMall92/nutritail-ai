export const RETAIL_PARTNER_RANKING_VERSION = "2026-08-17";

export const PARTNER_DISCLOSURE_EL =
  "Όλες οι επιλογές είναι συνεργαζόμενα καταστήματα. Μια χορηγούμενη εμφάνιση μπορεί να προηγείται μόνο ανάμεσα σε επιλέξιμα καταστήματα για την ίδια ήδη επιλεγμένη τροφή. Η διατροφική πρόταση παραμένει ανεξάρτητη και η διαθεσιμότητα χρειάζεται επιβεβαίωση πριν την αγορά.";

export type PartnerAvailabilityRow = {
  id: string;
  channel: "local_store" | "online" | "both" | null;
  availability_status: "in_stock" | "order_available" | "unknown" | null;
  product_url: string | null;
  estimated_price_euro: number | string | null;
  is_sponsored: boolean | null;
  display_priority: number | null;
  partner: {
    id: string;
    name: string;
    city: string | null;
    area: string | null;
    postal_code: string | null;
    address: string | null;
    website_url: string | null;
    phone: string | null;
    channel: "local_store" | "online" | "both" | null;
    subscription_status: string | null;
    subscription_expires_at: string | null;
  } | null;
};

const availabilityRank = {
  in_stock: 0,
  order_available: 1,
  unknown: 2,
} as const;

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeText(value: unknown) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function normalizedPartnerLocation(row: PartnerAvailabilityRow) {
  return normalizeText(
    [
      row.partner?.city,
      row.partner?.area,
      row.partner?.postal_code,
      row.partner?.address,
    ].join(" ")
  );
}

function effectiveChannel(row: PartnerAvailabilityRow) {
  return row.channel ?? row.partner?.channel ?? "online";
}

function isAreaEligible(row: PartnerAvailabilityRow, area: string) {
  const normalizedArea = normalizeText(area);
  if (!normalizedArea) return true;

  const channel = effectiveChannel(row);
  if (channel === "online" || channel === "both") return true;

  return normalizedPartnerLocation(row).includes(normalizedArea);
}

function areaRank(row: PartnerAvailabilityRow, area: string) {
  const normalizedArea = normalizeText(area);
  if (!normalizedArea) return 0;

  const hasLocalMatch = normalizedPartnerLocation(row).includes(normalizedArea);
  const channel = effectiveChannel(row);
  return channel !== "online" && hasLocalMatch ? 0 : 1;
}

function hasCurrentSubscription(row: PartnerAvailabilityRow, today: string) {
  const status = row.partner?.subscription_status;
  if (status !== "active" && status !== "trial") return false;

  const expiresAt = row.partner?.subscription_expires_at;
  return !expiresAt || expiresAt >= today;
}

export function rankEligiblePartnerAvailability(
  rows: PartnerAvailabilityRow[],
  {
    area = "",
    today = new Date().toISOString().slice(0, 10),
  }: { area?: string; today?: string } = {}
) {
  return rows
    .filter(
      (row) =>
        row.partner &&
        hasCurrentSubscription(row, today) &&
        isAreaEligible(row, area)
    )
    .sort((left, right) => {
      const byArea = areaRank(left, area) - areaRank(right, area);
      if (byArea !== 0) return byArea;

      const leftAvailability = left.availability_status ?? "unknown";
      const rightAvailability = right.availability_status ?? "unknown";
      const byAvailability =
        availabilityRank[leftAvailability] - availabilityRank[rightAvailability];
      if (byAvailability !== 0) return byAvailability;

      const bySponsorship = Number(right.is_sponsored) - Number(left.is_sponsored);
      if (bySponsorship !== 0) return bySponsorship;

      const byDisplayPriority =
        (left.display_priority ?? 100) - (right.display_priority ?? 100);
      if (byDisplayPriority !== 0) return byDisplayPriority;

      const byPartnerName = (left.partner?.name ?? "").localeCompare(
        right.partner?.name ?? "",
        "el",
        { sensitivity: "base" }
      );
      return byPartnerName !== 0 ? byPartnerName : left.id.localeCompare(right.id);
    });
}
