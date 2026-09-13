"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  LoaderCircle,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { brand } from "@/lib/brand";
import { launchFeatures } from "@/lib/launch/features";
import {
  PRIVACY_POLICY_LAST_UPDATED_EL,
  PRIVACY_POLICY_VERSION,
  PRIVACY_RETENTION,
} from "@/lib/privacy/config";
import { createClient } from "@/lib/supabase/client";
import type { CustomerPrivacyPreferences } from "@/types/privacy";

const DELETE_CONFIRMATION = "ΔΙΑΓΡΑΦΗ";

function PrivacyToggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`nt-focus relative h-7 w-12 shrink-0 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-[#1f7a4d] bg-[#1f7a4d]"
          : "border-[#b9c8bf] bg-[#dfe7e2]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function AccountPrivacyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [authUserId, setAuthUserId] = useState("");
  const [preferences, setPreferences] =
    useState<CustomerPrivacyPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPrivacyCenter() {
      try {
        setIsLoading(true);
        setError("");

        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        setAuthUserId(data.session.user.id);
        const response = await fetch("/api/account/privacy/preferences", {
          cache: "no-store",
        });
        const result = (await response.json()) as
          | CustomerPrivacyPreferences
          | { error?: string };

        if (!response.ok || !("productAnalyticsEnabled" in result)) {
          throw new Error(
            "error" in result && result.error
              ? result.error
              : "Δεν μπόρεσα να φορτώσω τις επιλογές απορρήτου."
          );
        }

        setPreferences(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Δεν μπόρεσα να φορτώσω τις επιλογές απορρήτου."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadPrivacyCenter();
  }, [pathname, router]);

  async function savePreferences() {
    if (!preferences) return;

    try {
      setIsSaving(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/account/privacy/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authUserId,
          productAnalyticsEnabled: preferences.productAnalyticsEnabled,
          partnerOffersEnabled: preferences.partnerOffersEnabled,
        }),
      });
      const result = (await response.json()) as
        | CustomerPrivacyPreferences
        | { error?: string };

      if (!response.ok || !("productAnalyticsEnabled" in result)) {
        throw new Error(
          "error" in result && result.error
            ? result.error
            : "Δεν αποθηκεύτηκαν οι επιλογές απορρήτου."
        );
      }

      setPreferences(result);
      setMessage("Οι επιλογές απορρήτου αποθηκεύτηκαν.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Δεν αποθηκεύτηκαν οι επιλογές απορρήτου."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function exportAccountData() {
    try {
      setIsExporting(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/account/privacy/export", {
        cache: "no-store",
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(result.error || "Η εξαγωγή δεν ολοκληρώθηκε.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `nutritail-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("Το αρχείο δεδομένων δημιουργήθηκε.");
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Η εξαγωγή δεν ολοκληρώθηκε."
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function deleteAccount() {
    if (deleteConfirmation !== DELETE_CONFIRMATION) return;

    try {
      setIsDeleting(true);
      setError("");

      const response = await fetch("/api/account/privacy/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authUserId, confirmation: deleteConfirmation }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Η διαγραφή δεν ολοκληρώθηκε.");
      }

      const supabase = createClient();
      await supabase.auth.signOut({ scope: "local" });
      router.replace("/");
      router.refresh();
    } catch (deleteError) {
      setShowDeleteDialog(false);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Η διαγραφή δεν ολοκληρώθηκε."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="flex min-h-64 items-center justify-center">
        <LoaderCircle className="animate-spin text-[#1f7a4d]" size={28} />
        <span className="ml-3 text-sm font-bold text-[#52635a]">
          Φορτώνω τις επιλογές απορρήτου...
        </span>
      </section>
    );
  }

  return (
    <section className="space-y-5" data-testid="account-privacy-center">
      <header className="flex flex-col gap-4 border-b border-[#dce5df] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase text-[#1f7a4d]">
            Privacy Center
          </p>
          <h1 className="mt-2 text-2xl font-black text-[#14221b] sm:text-3xl">
            Απόρρητο και δεδομένα
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52635a]">
            Έλεγξε τις προαιρετικές χρήσεις, κατέβασε τα δεδομένα σου ή
            διέγραψε οριστικά τον λογαριασμό σου.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#b9ddc7] bg-[#eaf7ef] px-3 py-2 text-sm font-bold text-[#17663f]">
          <ShieldCheck size={17} />
          Προστασία ενεργή
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {error}
        </div>
      )}
      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      <section className="rounded-lg border border-[#dce5df] bg-white p-5 sm:p-6">
        <div className="border-b border-[#e4ebe6] pb-4">
          <h2 className="text-lg font-black text-[#14221b]">
            Προαιρετικές επιλογές
          </h2>
          <p className="mt-1 text-sm text-[#5f6f66]">
            Οι παρακάτω επιλογές είναι κλειστές από προεπιλογή. Η βασική
            υπηρεσία λειτουργεί κανονικά χωρίς αυτές.
          </p>
        </div>

        <div className="divide-y divide-[#e4ebe6]">
          <div className="flex items-start justify-between gap-5 py-5">
            <div>
              <h3 className="font-bold text-[#14221b]">
                Προαιρετικά δεδομένα χρήσης
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5f6f66]">
                Επιτρέπει μελλοντική μέτρηση χρήσης για βελτίωση του προϊόντος,
                πέρα από τα απολύτως αναγκαία logs ασφάλειας και σφαλμάτων.
              </p>
            </div>
            <PrivacyToggle
              checked={preferences?.productAnalyticsEnabled ?? false}
              disabled={!preferences || isSaving}
              label="Προαιρετικά δεδομένα χρήσης"
              onChange={(checked) =>
                setPreferences((current) =>
                  current
                    ? { ...current, productAnalyticsEnabled: checked }
                    : current
                )
              }
            />
          </div>

          {launchFeatures.partnerStores && (
          <div className="flex items-start justify-between gap-5 py-5">
            <div>
              <h3 className="font-bold text-[#14221b]">
                Προσφορές συνεργατών μέσω email
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5f6f66]">
                Επιτρέπει προαιρετικά emails για διαθέσιμες τροφές ή προσφορές.
                Η επιλογή καταστήματος δεν επηρεάζει τη διατροφική πρόταση.
              </p>
            </div>
            <PrivacyToggle
              checked={preferences?.partnerOffersEnabled ?? false}
              disabled={!preferences || isSaving}
              label="Προσφορές συνεργατών μέσω email"
              onChange={(checked) =>
                setPreferences((current) =>
                  current ? { ...current, partnerOffersEnabled: checked } : current
                )
              }
            />
          </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => void savePreferences()}
          disabled={!preferences || isSaving}
          className="nt-focus inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#123d2b] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0d3021] disabled:opacity-50"
        >
          {isSaving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}
          {isSaving ? "Αποθήκευση..." : "Αποθήκευση επιλογών"}
        </button>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-[#dce5df] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-black text-[#14221b]">Τα δεδομένα σου</h2>
          <p className="mt-2 text-sm leading-6 text-[#5f6f66]">
            Το αρχείο JSON περιλαμβάνει στοιχεία λογαριασμού, κατοικίδια,
            αναλύσεις, επιλογές συγκατάθεσης και συνδεδεμένη δραστηριότητα.
          </p>
          <button
            type="button"
            onClick={() => void exportAccountData()}
            disabled={isExporting}
            className="nt-focus mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#aebdb4] bg-white px-4 py-2 text-sm font-bold text-[#14221b] transition hover:bg-[#f3f7f4] disabled:opacity-50"
          >
            {isExporting ? <LoaderCircle className="animate-spin" size={17} /> : <Download size={17} />}
            {isExporting ? "Δημιουργία αρχείου..." : "Λήψη δεδομένων"}
          </button>
        </div>

        <div className="rounded-lg border border-[#dce5df] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-black text-[#14221b]">
            Cookies και περιοχή
          </h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-bold text-[#14221b]">Cookies</dt>
              <dd className="mt-1 leading-6 text-[#5f6f66]">
                Χρησιμοποιούνται μόνο όσα χρειάζονται για σύνδεση και βασικές
                προτιμήσεις. Δεν φορτώνεται διαφημιστικό tracker.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-[#14221b]">Πόλη ή ΤΚ</dt>
              <dd className="mt-1 leading-6 text-[#5f6f66]">
                Χρησιμοποιείται μόνο στο συγκεκριμένο αίτημα εύρεσης
                καταστήματος και δεν αποθηκεύεται στο προφίλ σου.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-lg border border-[#dce5df] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-black text-[#14221b]">Χρόνοι διατήρησης</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#dce5df] text-[#52635a]">
                <th className="px-2 py-3 font-bold">Κατηγορία</th>
                <th className="px-2 py-3 font-bold">Διάρκεια</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4ebe6] text-[#14221b]">
              <tr>
                <td className="px-2 py-3">Λογαριασμός</td>
                <td className="px-2 py-3">{PRIVACY_RETENTION.accountData}</td>
              </tr>
              <tr>
                <td className="px-2 py-3">Κατοικίδια και αναλύσεις</td>
                <td className="px-2 py-3">{PRIVACY_RETENTION.petData}</td>
              </tr>
              <tr>
                <td className="px-2 py-3">Τεχνικά logs</td>
                <td className="px-2 py-3">
                  {PRIVACY_RETENTION.runtimeMonitoringDays} ημέρες
                </td>
              </tr>
              <tr>
                <td className="px-2 py-3">Feedback συνομιλίας</td>
                <td className="px-2 py-3">
                  {PRIVACY_RETENTION.chatbotFeedbackDays} ημέρες
                </td>
              </tr>
              {launchFeatures.partnerStores && (
              <tr>
                <td className="px-2 py-3">Ανώνυμες παραπομπές καταστημάτων</td>
                <td className="px-2 py-3">
                  {PRIVACY_RETENTION.partnerReferralDays} ημέρες
                </td>
              </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-[#f0c7be] bg-[#fff8f6] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-black text-[#7f2f20]">Διαγραφή λογαριασμού</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#8d4a3c]">
            Διαγράφει οριστικά λογαριασμό, προφίλ, κατοικίδια, αναλύσεις και
            συνδεδεμένα logs. Η ενέργεια δεν αναιρείται.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDeleteConfirmation("");
            setShowDeleteDialog(true);
          }}
          className="nt-focus inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#d48978] bg-white px-4 py-2 text-sm font-bold text-[#8d2f1d] transition hover:bg-[#fff0ec]"
        >
          <Trash2 size={17} />
          Διαγραφή
        </button>
      </section>

      <footer className="flex flex-col gap-2 border-t border-[#dce5df] pt-4 text-xs leading-5 text-[#66766d] sm:flex-row sm:items-center sm:justify-between">
        <span>
          Πολιτική {PRIVACY_POLICY_VERSION}, ενημέρωση {PRIVACY_POLICY_LAST_UPDATED_EL}
        </span>
        <div className="flex flex-wrap gap-4">
          <Link href="/privacy" className="nt-focus inline-flex items-center gap-1 rounded font-bold hover:text-[#1f7a4d]">
            Πολιτική απορρήτου <ExternalLink size={13} />
          </Link>
          <a href={`mailto:${brand.contactEmail}`} className="nt-focus rounded font-bold hover:text-[#1f7a4d]">
            {brand.contactEmail}
          </a>
        </div>
      </footer>

      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-account-title" className="text-xl font-black text-[#7f2f20]">
                  Οριστική διαγραφή
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#5f6f66]">
                  Γράψε <strong>{DELETE_CONFIRMATION}</strong> για επιβεβαίωση.
                  Μετά τη διαγραφή δεν θα μπορείς να συνδεθείς ή να ανακτήσεις
                  τις αποθηκευμένες αναφορές.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="nt-focus inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#52635a] hover:bg-[#f3f7f4]"
                aria-label="Κλείσιμο"
                title="Κλείσιμο"
              >
                <X size={19} />
              </button>
            </div>

            <label htmlFor="delete-confirmation" className="mt-5 block text-sm font-bold text-[#14221b]">
              Επιβεβαίωση
            </label>
            <input
              id="delete-confirmation"
              autoComplete="off"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              className="nt-focus mt-2 w-full rounded-lg border border-[#c8d3cc] px-3 py-3 text-[#14221b]"
            />

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="nt-focus min-h-11 rounded-lg border border-[#c8d3cc] px-4 py-2 text-sm font-bold text-[#14221b] hover:bg-[#f3f7f4]"
              >
                Ακύρωση
              </button>
              <button
                type="button"
                onClick={() => void deleteAccount()}
                disabled={isDeleting || deleteConfirmation !== DELETE_CONFIRMATION}
                className="nt-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:bg-red-300 disabled:text-red-50"
              >
                {isDeleting ? <LoaderCircle className="animate-spin" size={17} /> : <Trash2 size={17} />}
                {isDeleting ? "Διαγραφή..." : "Οριστική διαγραφή"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
