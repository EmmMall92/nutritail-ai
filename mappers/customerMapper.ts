import type { Customer } from "@/types/customer";
import type { DbCustomer } from "@/types/db/db-customer";

export function mapDbCustomerToCustomer(db: DbCustomer): Customer {
  return {
    id: db.id,
    authUserId: db.auth_user_id,
    fullName: db.full_name,
    email: db.email,
    phone: db.phone,
    bonusCardCode: db.bonus_card_code,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapCustomerToDbCustomer(customer: Customer): DbCustomer {
  return {
    id: customer.id,
    auth_user_id: customer.authUserId ?? null,
    full_name: customer.fullName,
    email: customer.email ?? null,
    phone: customer.phone ?? null,
    bonus_card_code: customer.bonusCardCode ?? null,
    notes: customer.notes ?? null,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt,
  };
}