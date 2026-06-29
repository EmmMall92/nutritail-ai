import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Pet Nutrition Chatbot | ${brand.name}`,
  description:
    "Open Nutritail AI's account chatbot for educational dog and cat feeding guidance.",
  alternates: {
    canonical: "/account/chatbot",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: `Pet Nutrition Chatbot | ${brand.name}`,
    description:
      "Get educational pet nutrition guidance for dogs and cats with Nutritail AI.",
    url: "/account/chatbot",
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
