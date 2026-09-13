import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

const trustPoints = [
  "Προσωπικό προφίλ για κάθε κατοικίδιο",
  "Θερμίδες, μερίδα και προτάσεις τροφής",
  "Υπεύθυνα όρια σε θέματα υγείας",
];

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-white text-[#14221b] lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden min-h-screen overflow-hidden bg-[#123d2b] lg:block">
        <Image
          src="/nutritail-hero.png"
          alt="Σκύλος και γάτα δίπλα στα μπολ της τροφής τους"
          fill
          priority
          sizes="45vw"
          className="object-cover object-[72%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(9,35,24,0.94)_0%,rgba(9,35,24,0.1)_72%)]" />

        <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
          <p className="max-w-xl text-3xl font-black leading-tight xl:text-4xl">
            Μια πιο καθαρή εικόνα για τη διατροφή του.
          </p>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/78">
            Από το προφίλ και τη σημερινή τροφή μέχρι μια πρακτική ημερήσια
            μερίδα και επιλογές που μπορείς να συζητήσεις με τον κτηνίατρό σου.
          </p>
          <div className="mt-7 grid gap-3">
            {trustPoints.map((point) => (
              <p key={point} className="flex items-center gap-2 text-sm font-bold text-white/90">
                <CheckCircle2 size={18} className="shrink-0 text-[#72d39a]" />
                {point}
              </p>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex min-h-screen items-center px-5 py-8 sm:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-[32rem]">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="nt-focus flex items-center gap-2.5 rounded-lg">
              <Image src="/nutritail-icon.svg" alt="" width={38} height={38} />
              <span className="text-lg font-black">
                Nutritail <span className="text-[#1f7a4d]">AI</span>
              </span>
            </Link>
            <Link
              href="/"
              className="nt-focus inline-flex items-center gap-1.5 rounded-lg text-xs font-bold text-[#5f6f66] hover:text-[#1f7a4d]"
            >
              <ArrowLeft size={15} />
              Αρχική
            </Link>
          </div>

          <div className="mt-12 sm:mt-16">
            <p className="nt-eyebrow">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-[#5f6f66]">{description}</p>
          </div>

          <div className="mt-8">{children}</div>

          <p className="mt-8 text-xs leading-5 text-[#7a8980] lg:hidden">
            Το NutriTail παρέχει ενημερωτική καθοδήγηση και δεν αντικαθιστά
            την κτηνιατρική διάγνωση ή θεραπεία.
          </p>
        </div>
      </section>
    </main>
  );
}
