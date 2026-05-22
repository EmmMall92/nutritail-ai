export type UserRole = "admin" | "staff";

export type Profile = {
  id: string;
  email?: string | null;
  role: UserRole;
  fullName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};