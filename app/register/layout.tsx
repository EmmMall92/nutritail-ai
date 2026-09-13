import { createNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = createNoIndexMetadata(
  "Δημιουργία λογαριασμού",
  "Δημιούργησε δωρεάν λογαριασμό στο Nutritail AI.",
  "/register"
);

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
