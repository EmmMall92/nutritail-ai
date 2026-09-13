import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Camera,
  Check,
  HeartPulse,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Utensils,
  Weight,
} from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { brand } from "@/lib/brand";
import { launchFeatures } from "@/lib/launch/features";

export const metadata: Metadata = {
  title: `${brand.name} | Ενημερωτική επιλογή τροφής κατοικιδίων`,
  description:
    "Κατανόησε τις ανάγκες του σκύλου ή της γάτας σου, υπολόγισε τη σωστή μερίδα και βρες κατάλληλες τροφές με υπεύθυνη καθοδήγηση.",
  alternates: { canonical: "/" },
};

const steps = [
  {
    icon: MessagesSquare,
    title: "Μίλησέ μας για το κατοικίδιό σου",
    text: "Ηλικία, βάρος, δραστηριότητα, στείρωση, ευαισθησίες και στόχος σε μια απλή συζήτηση.",
  },
  {
    icon: Calculator,
    title: "Παίρνεις καθαρούς υπολογισμούς",
    text: "Ημερήσιες θερμίδες, γραμμάρια τροφής και ασφαλές όριο λιχουδιών χωρίς δύσκολους πίνακες.",
  },
  {
    icon: Utensils,
    title: "Βλέπεις τις κατάλληλες επιλογές",
    text: "Σύντομη λίστα τροφών από τη βάση μας, με εξήγηση για το γιατί ταιριάζει κάθε πρόταση.",
  },
];

const recommendationCards = [
  {
    label: "Καλύτερη συνολική επιλογή",
    brand: "Ambrosia",
    name: "Chicken & Fresh Salmon",
    detail: "Ενήλικη γάτα · ξηρά τροφή",
    note: "Ταιριάζει στο στάδιο ζωής και στον ημερήσιο στόχο.",
    tone: "bg-[#eaf7ef] text-[#17663f]",
  },
  {
    label: "Για ευαίσθητη πέψη",
    brand: "Nature's Protection",
    name: "White Fish Sensitive",
    detail: "Ενήλικη γάτα · ευαίσθητη πέψη",
    note: "Επιλογή με πιο στοχευμένο διατροφικό προφίλ.",
    tone: "bg-[#fff2ed] text-[#a7442c]",
  },
  {
    label: "Αξιόπιστη εναλλακτική",
    brand: "Josera",
    name: "NatureCat",
    detail: "Ενήλικη γάτα · χωρίς σιτηρά",
    note: "Ισορροπημένη εναλλακτική όταν θέλεις περισσότερες επιλογές.",
    tone: "bg-[#fff8df] text-[#795b08]",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: brand.domain,
    email: brand.contactEmail,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand.name,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    url: brand.domain,
    description: brand.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfcfa] text-[#14221b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <PublicHeader />

      <section className="relative isolate min-h-[620px] overflow-hidden bg-[#123d2b] sm:min-h-[680px] lg:min-h-[710px]">
        <Image
          src="/nutritail-hero.png"
          alt="Ένας σκύλος και μία γάτα δίπλα στα μπολ της τροφής τους"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[67%_center] sm:object-[62%_center] lg:object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,31,22,0.96)_0%,rgba(10,31,22,0.82)_38%,rgba(10,31,22,0.20)_70%,rgba(10,31,22,0.04)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(10,31,22,0.52)_0%,transparent_45%)] lg:hidden" />

        <div className="nt-container relative flex min-h-[620px] items-center py-10 sm:min-h-[680px] sm:py-14 lg:min-h-[710px]">
          <div className="max-w-[42rem] text-white">
            <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-black/15 px-3 py-2 text-xs font-extrabold backdrop-blur-sm">
              <Sparkles size={15} className="text-[#72d39a]" />
              AI βοηθός επιλογής τροφής για σκύλους και γάτες
            </div>

            <h1 className="mt-5 text-4xl font-black leading-[1.08] sm:mt-6 sm:text-5xl lg:text-6xl">
              Ενημερωτική επιλογή τροφής για το δικό σου κατοικίδιο.
            </h1>
            <p className="mt-4 max-w-[38rem] text-base leading-7 text-white/85 sm:mt-5 sm:text-lg sm:leading-8">
              Εκτίμηση θερμίδων, ενδεικτική μερίδα και επιλογές τροφών με βάση τα
              στοιχεία που δηλώνεις, για μη ιατρικές περιπτώσεις.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="nt-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#72d39a] px-5 py-3 text-sm font-black text-[#0c2a1d] transition hover:bg-[#8ae0aa]"
              >
                Ξεκίνα δωρεάν ανάλυση
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/how-it-works"
                className="nt-focus inline-flex min-h-12 items-center justify-center rounded-lg border border-white/35 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Δες πώς λειτουργεί
              </Link>
            </div>

            <div className="mt-6 flex flex-col gap-2 text-xs font-semibold text-white/75 sm:mt-7 sm:flex-row sm:gap-6">
              <span className="flex items-center gap-2"><Check size={15} /> Χωρίς κάρτα</span>
              <span className="flex items-center gap-2"><Check size={15} /> Για σκύλους και γάτες</span>
              <span className="hidden items-center gap-2 sm:flex"><Check size={15} /> Με υπεύθυνα όρια υγείας</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dce5df] bg-white">
        <div className="nt-container grid gap-6 py-7 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            {launchFeatures.foodPhotoAnalysis ? (
              <>
                <Camera className="shrink-0 text-[#1f7a4d]" size={22} />
                <p className="text-sm font-bold">Αναγνώριση τροφής και από φωτογραφία</p>
              </>
            ) : (
              <>
                <Utensils className="shrink-0 text-[#1f7a4d]" size={22} />
                <p className="text-sm font-bold">Σύντομη λίστα κατάλληλων τροφών</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Weight className="shrink-0 text-[#e56f51]" size={22} />
            <p className="text-sm font-bold">Στόχος βάρους και πρακτική ημερήσια μερίδα</p>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="shrink-0 text-[#1f7a4d]" size={22} />
            <p className="text-sm font-bold">Προσεκτική καθοδήγηση σε θέματα υγείας</p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="nt-container grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="nt-eyebrow">Από δεδομένα σε απόφαση</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Ένα αποτέλεσμα που μπορείς να χρησιμοποιήσεις σήμερα.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#5f6f66]">
              Το NutriTail οργανώνει τις ανάγκες του κατοικιδίου, τη σημερινή
              τροφή και τον στόχο του σε ένα καθαρό πλάνο. Δεν σου δίνει έναν
              ακατανόητο βαθμό. Σου εξηγεί τι σημαίνει κάθε πρόταση.
            </p>
            <Link href="/register" className="nt-button nt-button-primary nt-focus mt-7">
              Δημιούργησε το προφίλ του
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#cfdcd3] bg-white shadow-[0_20px_60px_rgba(22,64,43,0.12)]">
            <div className="flex flex-col gap-3 border-b border-[#dce5df] bg-[#f4f8f5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black">Η σημερινή εικόνα της Λούνας</p>
                <p className="mt-1 text-xs text-[#6b7b72]">Ενήλικη γάτα · 4,8 kg · στειρωμένη</p>
              </div>
              <span className="w-fit rounded-md bg-[#eaf7ef] px-2.5 py-1.5 text-xs font-extrabold text-[#17663f]">
                Το προφίλ είναι πλήρες
              </span>
            </div>

            <div className="grid grid-cols-2 border-b border-[#dce5df] sm:grid-cols-4">
              {[
                ["235", "kcal / ημέρα"],
                ["58 g", "τροφής / ημέρα"],
                ["23", "kcal λιχουδιών"],
                ["3", "κατάλληλες τροφές"],
              ].map(([value, label], index) => (
                <div
                  key={label}
                  className={`px-4 py-5 ${index % 2 === 0 ? "border-r" : ""} border-[#dce5df] sm:border-r sm:last:border-r-0`}
                >
                  <p className="text-2xl font-black text-[#14221b]">{value}</p>
                  <p className="mt-1 text-xs leading-5 text-[#6b7b72]">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-0 md:grid-cols-[1fr_0.9fr]">
              <div className="border-b border-[#dce5df] p-5 md:border-b-0 md:border-r">
                <p className="text-xs font-extrabold text-[#6b7b72]">Η ΠΡΑΚΤΙΚΗ ΠΡΟΤΑΣΗ</p>
                <p className="mt-3 text-lg font-black">29 g το πρωί + 29 g το βράδυ</p>
                <p className="mt-2 text-sm leading-6 text-[#5f6f66]">
                  Μέτρησε τη μερίδα με ζυγαριά κουζίνας και επανέλεγξε το βάρος
                  σε 3-4 εβδομάδες.
                </p>
              </div>
              <div className="bg-[#123d2b] p-5 text-white">
                <HeartPulse size={22} className="text-[#72d39a]" />
                <p className="mt-3 text-sm font-black">Σημαντική υπενθύμιση</p>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Σε συμπτώματα ή κλινική δίαιτα, η επιλογή γίνεται με
                  καθοδήγηση κτηνιάτρου.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#dce5df] bg-[#f1f7f3] py-16 sm:py-20">
        <div className="nt-container">
          <div className="max-w-2xl">
            <p className="nt-eyebrow">Πώς λειτουργεί</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Τρία βήματα, χωρίς διατροφική ορολογία.
            </h2>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="border-t border-[#b9c9bf] pt-5">
                  <div className="flex items-center justify-between">
                    <Icon size={25} className="text-[#1f7a4d]" />
                    <span className="text-sm font-black text-[#90a198]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-7 text-lg font-black">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#5f6f66]">{step.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="nt-container">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="nt-eyebrow">Προτάσεις με εξήγηση</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Λιγότερες επιλογές. Περισσότερη σιγουριά.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[#5f6f66] lg:justify-self-end">
              Η βάση τροφών φιλτράρει πρώτα το είδος, την ηλικία, το μέγεθος,
              τις ευαισθησίες και τις ανάγκες υγείας. Μετά σου δείχνει μόνο τις
              επιλογές που αξίζει πραγματικά να εξετάσεις.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {recommendationCards.map((food) => (
              <article key={food.name} className="rounded-lg border border-[#dce5df] bg-white p-5">
                <span className={`inline-flex rounded-md px-2.5 py-1.5 text-xs font-extrabold ${food.tone}`}>
                  {food.label}
                </span>
                <p className="mt-6 text-xs font-extrabold text-[#6b7b72]">{food.brand}</p>
                <h3 className="mt-1 text-xl font-black">{food.name}</h3>
                <p className="mt-2 text-sm text-[#6b7b72]">{food.detail}</p>
                <div className="mt-5 border-t border-[#e2e9e4] pt-4">
                  <p className="flex gap-2 text-sm leading-6 text-[#42534a]">
                    <Check size={17} className="mt-1 shrink-0 text-[#1f7a4d]" />
                    {food.note}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#123d2b] py-14 text-white sm:py-16">
        <div className="nt-container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold text-[#72d39a]">ΥΠΕΥΘΥΝΗ ΚΑΘΟΔΗΓΗΣΗ</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Η υγεία προηγείται πάντα από μια πρόταση τροφής.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
              Οι κλινικές δίαιτες εμφανίζονται μόνο όταν υπάρχει σχετικό θέμα
              υγείας και συνοδεύονται από σαφή σύσταση για κτηνιατρική συμβουλή.
            </p>
          </div>
          <Link
            href="/register"
            className="nt-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-[#123d2b] transition hover:bg-[#eaf7ef]"
          >
            Ξεκίνα την πρώτη ανάλυση
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
