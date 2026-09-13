import { createNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = createNoIndexMetadata(
  "Ανάκτηση κωδικού",
  "Ζήτησε σύνδεσμο επαναφοράς κωδικού για το Nutritail AI.",
  "/forgot-password"
);

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
