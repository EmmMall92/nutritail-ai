# NutriTail Migration Plan

## Current state
- Pets stored in localStorage / mock DB layer
- Foods stored in seed files
- Analysis runs through service layer
- Database schema drafted in `database/sql/schema.sql`

## Next migration steps
1. Create Supabase project
2. Run schema.sql in Supabase SQL editor
3. Connect app with `.env.local`
4. Move pets storage from local repositories to Supabase repositories
5. Move foods from seed file to `foods` table
6. Add authentication
7. Persist pet analyses and recommendations