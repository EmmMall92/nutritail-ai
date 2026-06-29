import { redirect } from "next/navigation";

export default function LegacyChatbotRedirectPage() {
  redirect("/account/chatbot");
}
