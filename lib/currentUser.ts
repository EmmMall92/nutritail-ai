import type { AppUser } from "@/types/user";

export function getCurrentUser(): AppUser {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Demo User",
    email: "demo@nutritail.ai",
  };
}