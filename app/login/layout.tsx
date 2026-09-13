import { createNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = createNoIndexMetadata(
  "Σύνδεση",
  "Σύνδεση στον προσωπικό λογαριασμό Nutritail AI.",
  "/login"
);

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
