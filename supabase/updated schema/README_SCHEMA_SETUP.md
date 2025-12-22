# ProjectHub Database Schema Setup

This folder contains the complete database schema for ProjectHub, organized into modular SQL files for easy deployment and maintenance.

## Prerequisites

- Supabase project (or local Supabase instance)
- Database connection with appropriate permissions
- Ability to execute SQL on auth schema (for user signup trigger)

## Setup Instructions

### Quick Setup (All at Once)

If you want to run everything in one go, execute the files in this exact order:

1. Create all tables
- ``psql -f sec1_tables.sql``

2. Create indexes
- ``psql -f sec2_indexes.sql``

3. Set up Row Level Security policies
- ``psql -f sec3_rls_policies.sql``

4. Create functions and triggers
- ``psql -f sec4_functions_triggers.sql``

5. Create frontend RPC functions
- ``psql -f sec5_frontend_rpc_functions.sql``

6. Set up storage buckets and policies
- ``psql -f sec6_storage_policies.sql``

7. Set up XP trigger system
- ``psql -f sec7_xp_triggers.sql``

### Using Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Copy and paste each file's contents in the order above
4. Run each file sequentially
5. Verify no errors occurred

### Important Notes

- **All files are idempotent** - Safe to run multiple times using `CREATE OR REPLACE` and `DROP IF EXISTS`
- **Order matters** - Tables must exist before creating indexes, policies, or triggers
- **Auth trigger** - The trigger on `auth.users` requires elevated permissions. If you get permission errors, contact Supabase support or run it through the Supabase dashboard.
- **Storage buckets** - Requires Supabase storage to be enabled in your project

## File Descriptions

| File | Purpose | Dependencies |
|------|---------|--------------|
| `sec1_tables.sql` | Core database tables | None |
| `sec2_indexes.sql` | Performance indexes | sec1 |
| `sec3_rls_policies.sql` | Row Level Security policies | sec1 |
| `sec4_functions_triggers.sql` | Business logic functions & triggers | sec1, sec3 |
| `sec5_frontend_rpc_functions.sql` | RPC functions for frontend | sec1, sec4 |
| `sec6_storage_policies.sql` | File storage configuration | sec1 |
| `sec7_xp_triggers.sql` | XP/gamification system | sec1, sec4 |

## Verification

After running all files, verify setup:

```
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check triggers are active
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## Testing User Signup

The schema includes an automatic profile creation trigger. Test it:

1. Sign up a new user through your app
2. Check that a profile was automatically created:

```
SELECT * FROM profiles WHERE user_id = 'your-user-auth-uid';
```

## Troubleshooting

### "permission denied for schema auth"
- Run through Supabase dashboard SQL Editor
- Or contact Supabase support to enable auth trigger permissions

### "relation already exists" errors
- Normal if re-running files (they use `IF NOT EXISTS`)
- Check for syntax errors if it's the first run

### Storage bucket errors
- Ensure Supabase Storage is enabled in your project settings
- Check that you have storage.admin role access

## Support

For issues or questions about the schema:
- Check the DEVLOG in the project root
- Open an issue in the GitHub repository