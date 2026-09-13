import { createNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = createNoIndexMetadata(
  "Βοηθός επιλογής τροφής",
  "Συνέχισε στον προσωπικό βοηθό επιλογής τροφής του Nutritail AI.",
  "/chatbot"
);

export default function ChatbotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
