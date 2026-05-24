import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Pet Nutrition Chatbot | ${brand.name}`,
  description:
    "Try Nutritail AI's pet nutrition chatbot for educational dog and cat feeding guidance.",
  alternates: {
    canonical: "/chatbot",
  },
  openGraph: {
    title: `Pet Nutrition Chatbot | ${brand.name}`,
    description:
      "Get educational pet nutrition guidance for dogs and cats with Nutritail AI.",
    url: "/chatbot",
    type: "website",
  },
};

export default function ChatbotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
