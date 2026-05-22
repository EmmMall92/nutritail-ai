export type DbCustomer = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  bonus_card_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};