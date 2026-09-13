import { createNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = createNoIndexMetadata(
  "Νέος κωδικός",
  "Όρισε νέο κωδικό πρόσβασης για το Nutritail AI.",
  "/reset-password"
);

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
