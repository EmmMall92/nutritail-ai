import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const migration = read(
  "supabase/migrations/20260810185131_harden_existing_public_tables.sql"
);
const privilegesMigration = read(
  "supabase/migrations/20260810220117_tighten_existing_rls_privileges.sql"
);
const accountGuard = read("lib/auth/accountApiGuard.ts");
const packageJson = read("package.json");

const protectedTables = [
  "users",
  "pets",
  "foods",
  "pet_analyses",
  "admin_activity_logs",
  "admin_duplicate_reviews",
];

for (const table of protectedTables) {
  assert(
    migration.includes(
      `alter table public.${table} enable row level security;`
    ),
    `${table} must have RLS enabled by the hardening migration.`
  );
  assert(
    migration.includes(
      `revoke all on table public.${table} from anon, authenticated, service_role;`
    ),
    `${table} must revoke legacy broad grants.`
  );
  assert(
    migration.includes(
      `grant select, insert, update, delete on table public.${table} to service_role;`
    ),
    `${table} must explicitly grant only application CRUD to service_role.`
  );
}

for (const marker of [
  "grant select on table public.foods to anon, authenticated;",
  'create policy "Public can read recommendable legacy foods"',
  "deleted_at is null",
  "is_recommendable is true",
  "data_quality_status in ('partial', 'verified')",
]) {
  assert(migration.includes(marker), `Safe public food policy is missing: ${marker}`);
}

const serverOnlyTables = [
  "customers",
  "food_brand_recommendation_controls",
  "food_import_audit_v2",
  "food_product_nutrients_v2",
  "food_product_sources_v2",
  "food_products_v2",
  "retail_partner_product_availability",
  "retail_partners",
];

for (const table of serverOnlyTables) {
  assert(
    privilegesMigration.includes(
      `revoke all on table public.${table} from anon, authenticated, service_role;`
    ),
    `${table} must not retain broad Data API grants.`
  );
  assert(
    privilegesMigration.includes(
      `grant select, insert, update, delete on table public.${table} to service_role;`
    ),
    `${table} must grant only application CRUD to service_role.`
  );
}

for (const marker of [
  "revoke all on table public.profiles from anon, authenticated, service_role;",
  "grant select on table public.profiles to authenticated;",
  'create policy "Users can read own profile"',
  "to authenticated",
  "using ((select auth.uid()) = id);",
]) {
  assert(
    privilegesMigration.includes(marker),
    `Authenticated profile policy is missing: ${marker}`
  );
}

for (const marker of [
  "createServerSupabaseClient",
  "supabase.auth.getUser()",
  "requestedId !== user.id",
  'NextResponse.json({ error: "Unauthorized." }, { status: 401 })',
  'NextResponse.json({ error: "Forbidden." }, { status: 403 })',
]) {
  assert(accountGuard.includes(marker), `Account API guard is missing: ${marker}`);
}

const guardedRoutes = [
  "app/api/account/me/route.ts",
  "app/api/account/profile/route.ts",
  "app/api/account/pets/route.ts",
  "app/api/account/pets/[id]/route.ts",
  "app/api/account/pets/[id]/progress/route.ts",
  "app/api/account/chatbot/save/route.ts",
  "app/api/pets/[id]/route.ts",
  "app/api/pet-analyses/[petId]/route.ts",
];

for (const route of guardedRoutes) {
  assert(
    read(route).includes("requireAccountApiUser"),
    `${route} must verify the authenticated Supabase user.`
  );
}

const adminRouteFiles = [
  "app/api/admin/duplicates/route.ts",
  "app/api/admin/import-foods/route.ts",
  "app/api/admin/pets/route.ts",
  "app/api/admin/trash/route.ts",
  "app/api/admin/validation/route.ts",
];

for (const route of adminRouteFiles) {
  const source = read(route);
  assert(
    source.includes('from "@/lib/db/supabaseAdmin"'),
    `${route} must use the server-side Supabase admin client.`
  );
  assert(
    !source.includes('from "@/lib/db/supabase"'),
    `${route} must not use the anonymous Supabase client.`
  );
}

assert(
  packageJson.includes('"qa:rls-hardening-contract"'),
  "package.json must expose qa:rls-hardening-contract."
);

console.log(
  "RLS hardening contract passed: grants, policies, admin clients, and account ownership guards are intact."
);
