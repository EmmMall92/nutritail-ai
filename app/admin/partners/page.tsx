"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import type {
  RetailPartner,
  RetailPartnerAvailabilityStatus,
  RetailPartnerChannel,
  RetailPartnerFoodSearchResult,
  RetailPartnerListing,
  RetailPartnerSubscriptionStatus,
} from "@/types/retail-partner";

type PartnerResponse = {
  schemaReady: boolean;
  partners: RetailPartner[];
  summary: {
    totalPartners: number;
    visiblePartners: number;
    activeListings: number;
    referrals30d: number;
  };
};

type PartnerForm = {
  name: string;
  legalName: string;
  channel: RetailPartnerChannel;
  city: string;
  area: string;
  postalCode: string;
  address: string;
  websiteUrl: string;
  phone: string;
  contactEmail: string;
  subscriptionStatus: RetailPartnerSubscriptionStatus;
  subscriptionStartedAt: string;
  subscriptionExpiresAt: string;
  notes: string;
};

type ListingForm = {
  channel: RetailPartnerChannel;
  availabilityStatus: RetailPartnerAvailabilityStatus;
  productUrl: string;
  estimatedPriceEuro: string;
  displayPriority: string;
  isActive: boolean;
  isSponsored: boolean;
  notes: string;
};

const EMPTY_PARTNER_FORM: PartnerForm = {
  name: "",
  legalName: "",
  channel: "online",
  city: "",
  area: "",
  postalCode: "",
  address: "",
  websiteUrl: "",
  phone: "",
  contactEmail: "",
  subscriptionStatus: "inactive",
  subscriptionStartedAt: "",
  subscriptionExpiresAt: "",
  notes: "",
};

const EMPTY_LISTING_FORM: ListingForm = {
  channel: "online",
  availabilityStatus: "in_stock",
  productUrl: "",
  estimatedPriceEuro: "",
  displayPriority: "100",
  isActive: true,
  isSponsored: false,
  notes: "",
};

function partnerToForm(partner: RetailPartner): PartnerForm {
  return {
    name: partner.name,
    legalName: partner.legalName ?? "",
    channel: partner.channel,
    city: partner.city ?? "",
    area: partner.area ?? "",
    postalCode: partner.postalCode ?? "",
    address: partner.address ?? "",
    websiteUrl: partner.websiteUrl ?? "",
    phone: partner.phone ?? "",
    contactEmail: partner.contactEmail ?? "",
    subscriptionStatus: partner.subscriptionStatus,
    subscriptionStartedAt: partner.subscriptionStartedAt ?? "",
    subscriptionExpiresAt: partner.subscriptionExpiresAt ?? "",
    notes: partner.notes ?? "",
  };
}

function formatDate(value: string | null) {
  if (!value) return "Not verified";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "No referrals yet";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function subscriptionClasses(status: RetailPartnerSubscriptionStatus) {
  if (status === "active") return "bg-green-100 text-green-800";
  if (status === "trial") return "bg-blue-100 text-blue-800";
  if (status === "expired") return "bg-red-100 text-red-800";
  return "bg-gray-200 text-gray-700";
}

function channelLabel(channel: RetailPartnerChannel) {
  if (channel === "local_store") return "Local store";
  if (channel === "both") return "Local + online";
  return "Online";
}

async function readJson(response: Response) {
  const result = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(String(result.error ?? "The request could not be completed."));
  }
  return result;
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-black">{label}</span>
      {children}
    </label>
  );
}

function ListingEditor({
  listing,
  isBusy,
  onSave,
}: {
  listing: RetailPartnerListing;
  isBusy: boolean;
  onSave: (listingId: string, payload: Record<string, unknown>) => Promise<void>;
}) {
  const [channel, setChannel] = useState(listing.channel);
  const [availabilityStatus, setAvailabilityStatus] = useState(
    listing.availabilityStatus
  );
  const [productUrl, setProductUrl] = useState(listing.productUrl ?? "");
  const [price, setPrice] = useState(
    listing.estimatedPriceEuro === null ? "" : String(listing.estimatedPriceEuro)
  );
  const [isActive, setIsActive] = useState(listing.isActive);
  const [isSponsored, setIsSponsored] = useState(listing.isSponsored);

  return (
    <article className="border-t border-gray-200 py-5 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-semibold text-black">
            {listing.food?.brand ?? "Food V2"}
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {listing.food?.displayName ?? listing.foodProductId}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {listing.food?.species ?? "Unknown species"} / {listing.food?.format ?? "-"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {listing.isSponsored && (
            <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
              Sponsored
            </span>
          )}
          <span
            className={`rounded-full px-3 py-1 font-semibold ${
              listing.isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {listing.isActive ? "Visible" : "Hidden"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Channel">
          <select
            value={channel}
            onChange={(event) =>
              setChannel(event.target.value as RetailPartnerChannel)
            }
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black"
          >
            <option value="online">Online</option>
            <option value="local_store">Local store</option>
            <option value="both">Local + online</option>
          </select>
        </Field>
        <Field label="Availability">
          <select
            value={availabilityStatus}
            onChange={(event) =>
              setAvailabilityStatus(
                event.target.value as RetailPartnerAvailabilityStatus
              )
            }
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black"
          >
            <option value="in_stock">In stock</option>
            <option value="order_available">Available to order</option>
            <option value="unknown">Unknown</option>
          </select>
        </Field>
        <Field label="Estimated price (EUR)">
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black"
          />
        </Field>
        <Field label="Product URL">
          <input
            type="url"
            value={productUrl}
            onChange={(event) => setProductUrl(event.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black"
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4"
            />
            Visible to customers
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSponsored}
              onChange={(event) => setIsSponsored(event.target.checked)}
              className="h-4 w-4"
            />
            Sponsored placement
          </label>
          <span>Verified: {formatDate(listing.lastVerifiedAt)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onSave(listing.id, { markVerified: true })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-black hover:bg-gray-100 disabled:opacity-50"
          >
            Mark verified
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() =>
              onSave(listing.id, {
                channel,
                availabilityStatus,
                productUrl,
                estimatedPriceEuro: price,
                isActive,
                isSponsored,
              })
            }
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Save listing
          </button>
        </div>
      </div>
    </article>
  );
}

export default function RetailPartnersAdminPage() {
  const [partners, setPartners] = useState<RetailPartner[]>([]);
  const [summary, setSummary] = useState<PartnerResponse["summary"]>({
    totalPartners: 0,
    visiblePartners: 0,
    activeListings: 0,
    referrals30d: 0,
  });
  const [schemaReady, setSchemaReady] = useState(true);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [search, setSearch] = useState("");
  const [createForm, setCreateForm] = useState<PartnerForm>(EMPTY_PARTNER_FORM);
  const [editForm, setEditForm] = useState<PartnerForm>(EMPTY_PARTNER_FORM);
  const [showCreate, setShowCreate] = useState(false);
  const [listingForm, setListingForm] = useState<ListingForm>(EMPTY_LISTING_FORM);
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState<RetailPartnerFoodSearchResult[]>([]);
  const [selectedFood, setSelectedFood] =
    useState<RetailPartnerFoodSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingFoods, setIsSearchingFoods] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPartners = useCallback(async (preferredPartnerId?: string) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch("/api/admin/retail-partners", {
        cache: "no-store",
      });
      const result = (await readJson(response)) as unknown as PartnerResponse;
      setPartners(result.partners);
      setSummary(result.summary);
      setSchemaReady(result.schemaReady);
      const requestedPartnerId = preferredPartnerId ?? "";
      const nextPartner =
        result.partners.find((partner) => partner.id === requestedPartnerId) ??
        result.partners[0] ??
        null;
      setSelectedPartnerId(nextPartner?.id ?? "");
      setEditForm(nextPartner ? partnerToForm(nextPartner) : EMPTY_PARTNER_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load partners.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPartners();
  }, [loadPartners]);

  const selectedPartner = useMemo(
    () => partners.find((partner) => partner.id === selectedPartnerId) ?? null,
    [partners, selectedPartnerId]
  );

  function selectPartner(partner: RetailPartner) {
    setSelectedPartnerId(partner.id);
    setEditForm(partnerToForm(partner));
    setListingForm({
      ...EMPTY_LISTING_FORM,
      channel: partner.channel,
    });
    setSelectedFood(null);
    setFoodResults([]);
    setFoodQuery("");
    setError("");
    setMessage("");
  }

  const visiblePartners = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return partners;
    return partners.filter((partner) =>
      [partner.name, partner.city, partner.area, partner.contactEmail]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [partners, search]);

  function setPartnerField(
    setter: React.Dispatch<React.SetStateAction<PartnerForm>>,
    field: keyof PartnerForm,
    value: string
  ) {
    setter((current) => ({ ...current, [field]: value }));
  }

  async function createPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setIsSaving(true);
      setError("");
      setMessage("");
      const response = await fetch("/api/admin/retail-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const result = (await readJson(response)) as unknown as RetailPartner;
      setCreateForm(EMPTY_PARTNER_FORM);
      setShowCreate(false);
      setMessage("Partner created.");
      await loadPartners(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create partner.");
    } finally {
      setIsSaving(false);
    }
  }

  async function savePartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPartner) return;
    try {
      setIsSaving(true);
      setError("");
      setMessage("");
      const response = await fetch(`/api/admin/retail-partners/${selectedPartner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      await readJson(response);
      setMessage("Partner details updated.");
      await loadPartners(selectedPartner.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update partner.");
    } finally {
      setIsSaving(false);
    }
  }

  async function searchFoods(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setIsSearchingFoods(true);
      setError("");
      const response = await fetch(
        `/api/admin/retail-partners/foods?q=${encodeURIComponent(foodQuery.trim())}`,
        { cache: "no-store" }
      );
      const result = await readJson(response);
      setFoodResults(
        (result.foods as RetailPartnerFoodSearchResult[] | undefined) ?? []
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not search foods.");
    } finally {
      setIsSearchingFoods(false);
    }
  }

  async function saveListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPartner || !selectedFood) {
      setError("Choose an exact Food V2 product first.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setMessage("");
      const response = await fetch(
        `/api/admin/retail-partners/${selectedPartner.id}/availability`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...listingForm,
            foodProductId: selectedFood.id,
          }),
        }
      );
      await readJson(response);
      setMessage("Food listing saved.");
      setListingForm({
        ...EMPTY_LISTING_FORM,
        channel: selectedPartner.channel,
      });
      setSelectedFood(null);
      setFoodResults([]);
      setFoodQuery("");
      await loadPartners(selectedPartner.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save listing.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateListing(
    listingId: string,
    payload: Record<string, unknown>
  ) {
    if (!selectedPartner) return;
    try {
      setIsSaving(true);
      setError("");
      setMessage("");
      const response = await fetch(
        `/api/admin/retail-partners/${selectedPartner.id}/availability/${listingId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      await readJson(response);
      setMessage(payload.markVerified ? "Listing verified." : "Listing updated.");
      await loadPartners(selectedPartner.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update listing.");
    } finally {
      setIsSaving(false);
    }
  }

  const partnerFormFields = (
    form: PartnerForm,
    setter: React.Dispatch<React.SetStateAction<PartnerForm>>
  ) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Display name">
        <input
          required
          value={form.name}
          onChange={(event) => setPartnerField(setter, "name", event.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
      </Field>
      <Field label="Legal name">
        <input
          value={form.legalName}
          onChange={(event) =>
            setPartnerField(setter, "legalName", event.target.value)
          }
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
      </Field>
      <Field label="Sales channel">
        <select
          value={form.channel}
          onChange={(event) => setPartnerField(setter, "channel", event.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        >
          <option value="online">Online</option>
          <option value="local_store">Local store</option>
          <option value="both">Local + online</option>
        </select>
      </Field>
      <Field label="Subscription status">
        <select
          value={form.subscriptionStatus}
          onChange={(event) =>
            setPartnerField(setter, "subscriptionStatus", event.target.value)
          }
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        >
          <option value="inactive">Inactive</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </Field>
      <Field label="Subscription starts">
        <input
          type="date"
          value={form.subscriptionStartedAt}
          onChange={(event) =>
            setPartnerField(setter, "subscriptionStartedAt", event.target.value)
          }
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
      </Field>
      <Field label="Subscription expires">
        <input
          type="date"
          value={form.subscriptionExpiresAt}
          onChange={(event) =>
            setPartnerField(setter, "subscriptionExpiresAt", event.target.value)
          }
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
      </Field>
      <Field label="City">
        <input
          value={form.city}
          onChange={(event) => setPartnerField(setter, "city", event.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
      </Field>
      <Field label="Area">
        <input
          value={form.area}
          onChange={(event) => setPartnerField(setter, "area", event.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
      </Field>
      <Field label="Postal code">
        <input
          value={form.postalCode}
          onChange={(event) =>
            setPartnerField(setter, "postalCode", event.target.value)
          }
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
      </Field>
      <Field label="Address" className="md:col-span-2">
        <input
          value={form.address}
          onChange={(event) => setPartnerField(setter, "address", event.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
      </Field>
      <Field label="Website">
        <input
          type="url"
          value={form.websiteUrl}
          onChange={(event) =>
            setPartnerField(setter, "websiteUrl", event.target.value)
          }
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
      </Field>
      <Field label="Phone">
        <input
          value={form.phone}
          onChange={(event) => setPartnerField(setter, "phone", event.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
      </Field>
      <Field label="Contact email">
        <input
          type="email"
          value={form.contactEmail}
          onChange={(event) =>
            setPartnerField(setter, "contactEmail", event.target.value)
          }
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
      </Field>
      <Field label="Notes" className="md:col-span-2 xl:col-span-3">
        <textarea
          rows={3}
          value={form.notes}
          onChange={(event) => setPartnerField(setter, "notes", event.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
      </Field>
    </div>
  );

  return (
    <main className="space-y-6" data-testid="retail-partners-admin-page">
      <section className="border-b border-gray-200 pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-green-700">
              Commercial operations
            </p>
            <h1 className="mt-2 text-3xl font-bold text-black">Retail partners</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Manage eligible stores and exact Food V2 availability. Commercial
              placement is kept separate from nutrition ranking.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowCreate((current) => !current)}
              disabled={!schemaReady}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
            >
              {showCreate ? "Close form" : "New partner"}
            </button>
            <button
              type="button"
              onClick={() => loadPartners(selectedPartnerId)}
              disabled={isLoading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100 disabled:opacity-50"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Partners", summary.totalPartners, "All commercial records"],
          ["Eligible", summary.visiblePartners, "Active or current trial"],
          ["Visible listings", summary.activeListings, "Exact Food V2 matches"],
          ["Referrals (30d)", summary.referrals30d, "Anonymous outbound actions"],
        ].map(([label, value, helper]) => (
          <div key={String(label)} className="border-l-4 border-black bg-white px-5 py-4">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-black">{value}</p>
            <p className="mt-1 text-xs text-gray-500">{helper}</p>
          </div>
        ))}
      </section>

      {!schemaReady && (
        <section className="border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">Database setup required</p>
          <p className="mt-1 leading-6">
            Apply <code>supabase/migrations/retail_partner_availability.sql</code>
            before adding partners or product listings.
          </p>
        </section>
      )}

      {message && (
        <div className="border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {showCreate && schemaReady && (
        <form onSubmit={createPartner} className="border-y border-gray-200 bg-white py-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-black">New retail partner</h2>
            <p className="mt-1 text-sm text-gray-600">
              Keep the subscription inactive until commercial approval is complete.
            </p>
          </div>
          {partnerFormFields(createForm, setCreateForm)}
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isSaving ? "Creating..." : "Create partner"}
            </button>
          </div>
        </form>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-gray-200 pr-0 lg:pr-5">
          <Field label="Find partner">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or location"
              className="w-full rounded-lg border border-gray-300 p-3 text-black"
            />
          </Field>
          <div className="mt-4 space-y-2">
            {isLoading ? (
              <p className="py-4 text-sm text-gray-500">Loading partners...</p>
            ) : visiblePartners.length === 0 ? (
              <p className="py-4 text-sm text-gray-500">No partners found.</p>
            ) : (
              visiblePartners.map((partner) => (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => selectPartner(partner)}
                  className={`w-full border p-3 text-left transition ${
                    partner.id === selectedPartnerId
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-black hover:border-gray-400"
                  }`}
                >
                  <span className="block text-sm font-semibold">{partner.name}</span>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                      partner.id === selectedPartnerId
                        ? "bg-white text-black"
                        : subscriptionClasses(partner.subscriptionStatus)
                    }`}
                  >
                    {partner.subscriptionStatus}
                  </span>
                  <span className="mt-2 block text-xs opacity-70">
                    {partner.listings.filter((listing) => listing.isActive).length} active
                    listings
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-8">
          {!selectedPartner ? (
            <div className="border border-gray-200 bg-white p-6 text-sm text-gray-600">
              Select a partner to manage its subscription and product availability.
            </div>
          ) : (
            <>
              <section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-black">
                      {selectedPartner.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {channelLabel(selectedPartner.channel)} / {selectedPartner.city || "No city"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${subscriptionClasses(
                      selectedPartner.subscriptionStatus
                    )}`}
                  >
                    {selectedPartner.subscriptionStatus}
                  </span>
                </div>
                <div
                  className="mt-5 border border-[#dce5df] bg-[#f7faf8] p-4"
                  data-testid="partner-referral-metrics"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="font-bold text-black">Anonymous referrals</h3>
                      <p className="mt-1 text-xs leading-5 text-gray-600">
                        Rolling 30-day directional activity. No customer, pet,
                        location, IP, or conversation data is stored here.
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Last: {formatDateTime(selectedPartner.referralMetrics.lastReferralAt)}
                    </p>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden border border-[#dce5df] bg-[#dce5df] sm:grid-cols-4">
                    {[
                      ["Total", selectedPartner.referralMetrics.total30d],
                      ["Product", selectedPartner.referralMetrics.product30d],
                      ["Website", selectedPartner.referralMetrics.website30d],
                      ["Phone", selectedPartner.referralMetrics.phone30d],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="bg-white p-3">
                        <dt className="text-xs font-medium text-gray-500">{label}</dt>
                        <dd className="mt-1 text-xl font-bold text-black">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    These counts indicate interest and are not proof of a sale or
                    a standalone billing record.
                  </p>
                </div>
                <form onSubmit={savePartner} className="mt-5">
                  {partnerFormFields(editForm, setEditForm)}
                  <div className="mt-5 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save partner"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="border-t border-gray-200 pt-7">
                <div>
                  <h2 className="text-2xl font-bold text-black">Add food availability</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Link this partner to the exact Food V2 row shown by the chatbot.
                  </p>
                </div>

                <form onSubmit={searchFoods} className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="search"
                    value={foodQuery}
                    onChange={(event) => setFoodQuery(event.target.value)}
                    placeholder="Search brand or exact food name"
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 p-3 text-black"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingFoods}
                    className="rounded-lg border border-black px-4 py-3 text-sm font-semibold text-black hover:bg-gray-100 disabled:opacity-50"
                  >
                    {isSearchingFoods ? "Searching..." : "Search Food V2"}
                  </button>
                </form>

                {foodResults.length > 0 && (
                  <div className="mt-3 max-h-72 overflow-y-auto border border-gray-200 bg-white">
                    {foodResults.map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        onClick={() => setSelectedFood(food)}
                        className={`block w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 ${
                          selectedFood?.id === food.id
                            ? "bg-black text-white"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{food.brand}</span>
                        <span className="mt-1 block text-sm">{food.displayName}</span>
                        <span className="mt-1 block text-xs opacity-70">
                          {food.species} / {food.format}
                          {!food.isRecommendable ? " / hidden from recommendations" : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedFood && (
                  <form onSubmit={saveListing} className="mt-5 border-l-4 border-green-700 bg-green-50 p-5">
                    <p className="text-sm font-semibold text-green-900">
                      {selectedFood.brand} / {selectedFood.displayName}
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <Field label="Channel">
                        <select
                          value={listingForm.channel}
                          onChange={(event) =>
                            setListingForm((current) => ({
                              ...current,
                              channel: event.target.value as RetailPartnerChannel,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black"
                        >
                          <option value="online">Online</option>
                          <option value="local_store">Local store</option>
                          <option value="both">Local + online</option>
                        </select>
                      </Field>
                      <Field label="Availability">
                        <select
                          value={listingForm.availabilityStatus}
                          onChange={(event) =>
                            setListingForm((current) => ({
                              ...current,
                              availabilityStatus: event.target
                                .value as RetailPartnerAvailabilityStatus,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black"
                        >
                          <option value="in_stock">In stock</option>
                          <option value="order_available">Available to order</option>
                          <option value="unknown">Unknown</option>
                        </select>
                      </Field>
                      <Field label="Estimated price (EUR)">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={listingForm.estimatedPriceEuro}
                          onChange={(event) =>
                            setListingForm((current) => ({
                              ...current,
                              estimatedPriceEuro: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black"
                        />
                      </Field>
                      <Field label="Product URL" className="md:col-span-2">
                        <input
                          type="url"
                          value={listingForm.productUrl}
                          onChange={(event) =>
                            setListingForm((current) => ({
                              ...current,
                              productUrl: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black"
                        />
                      </Field>
                      <Field label="Display priority">
                        <input
                          type="number"
                          min="0"
                          max="10000"
                          step="1"
                          value={listingForm.displayPriority}
                          onChange={(event) =>
                            setListingForm((current) => ({
                              ...current,
                              displayPriority: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black"
                        />
                      </Field>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-4 text-sm text-green-950">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={listingForm.isActive}
                            onChange={(event) =>
                              setListingForm((current) => ({
                                ...current,
                                isActive: event.target.checked,
                              }))
                            }
                            className="h-4 w-4"
                          />
                          Visible to customers
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={listingForm.isSponsored}
                            onChange={(event) =>
                              setListingForm((current) => ({
                                ...current,
                                isSponsored: event.target.checked,
                              }))
                            }
                            className="h-4 w-4"
                          />
                          Sponsored placement
                        </label>
                      </div>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="rounded-lg bg-green-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
                      >
                        {isSaving ? "Saving..." : "Save food listing"}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              <section className="border-t border-gray-200 pt-7">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-black">Current listings</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedPartner.listings.length} exact product links for this partner.
                    </p>
                  </div>
                </div>
                <div className="mt-5 bg-white">
                  {selectedPartner.listings.length === 0 ? (
                    <p className="border border-gray-200 p-5 text-sm text-gray-600">
                      No Food V2 availability has been added yet.
                    </p>
                  ) : (
                    selectedPartner.listings.map((listing) => (
                      <ListingEditor
                        key={`${listing.id}:${listing.updatedAt ?? "new"}`}
                        listing={listing}
                        isBusy={isSaving}
                        onSave={updateListing}
                      />
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
